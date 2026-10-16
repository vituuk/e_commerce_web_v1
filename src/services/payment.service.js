const {Payment,Order,OrderItem,User,sequelize}=require("../../models");
const AppError=require("../util/app-error");
const {paginate}=require("../util/paginate");
const {getReqTime,buildPurchaseHash,encodeBase64,buildCheckTransactionHash}=require("../util/payway");

const BASE_URL=process.env.ABA_PAYWAY_BASE_URL || "https://checkout-sandbox.payway.com.kh";
const PURCHASE_URL=`${BASE_URL}/api/payment-gateway/v1/payments/purchase`;
const CHECK_URL=`${BASE_URL}/api/payment-gateway/v1/payments/check-transaction-2`;
const ALLOWED_OPTIONS=["abapay_khqr","abapay_khqr_deeplink","cards","alipay","wechat"];

const money=(n)=>Number(n).toFixed(2);

const requireConfig=()=>{
    if(!process.env.ABA_PAYWAY_MERCHANT_ID || !process.env.ABA_PAYWAY_API_KEY){
        throw new AppError(500,"PayWay is not configured (ABA_PAYWAY_MERCHANT_ID / ABA_PAYWAY_API_KEY)");
    }
};

// unique, max 20 chars (PayWay limit), e.g. "12-mgq3k2x1"
const generateTranId=(orderId)=>`${orderId}-${Date.now().toString(36)}`.slice(0,20);

// POST /payment/checkout  body: {orderId, payment_option?}
// creates a pending Payment and returns the form fields the frontend must POST to PayWay
const createCheckout=async(user,body)=>{
    requireConfig();
    const {orderId}=body;
    const payment_option=body.payment_option || "abapay_khqr";
    if(!orderId) throw new AppError(400,"orderId is required");
    if(!ALLOWED_OPTIONS.includes(payment_option)) throw new AppError(400,`payment_option must be one of: ${ALLOWED_OPTIONS.join(", ")}`);

    const order=await Order.findOne({
        where:{id:orderId,userId:user.id},
        include:[{model:OrderItem,as:"items"}]
    });
    if(!order) throw new AppError(404,"Order not found");
    if(order.status!=="pending") throw new AppError(400,`Order is ${order.status}, cannot pay`);

    const dbUser=await User.findByPk(user.id,{attributes:["firstName","lastName","email"]});

    const tran_id=generateTranId(order.id);
    const payment=await Payment.create({
        userId:user.id,
        orderId:order.id,
        paywayTranId:tran_id,
        method:payment_option,
        amount:order.total,
        status:"pending"
    });

    const items=encodeBase64(JSON.stringify(order.items.map(i=>({
        name:i.product_name,
        quantity:i.quantity,
        price:Number(i.unit_price)
    }))));

    // every field in the hash must be sent exactly as hashed (empty string if unused)
    const fields={
        req_time:getReqTime(),
        merchant_id:process.env.ABA_PAYWAY_MERCHANT_ID,
        tran_id,
        amount:money(order.total),
        items,
        shipping:money(order.shipping_fee),
        firstname:dbUser?.firstName || "",
        lastname:dbUser?.lastName || "",
        email:dbUser?.email || "",
        phone:order.shipping_phone || "",
        type:"purchase",
        payment_option,
        return_url:process.env.ABA_PAYWAY_RETURN_URL ? encodeBase64(process.env.ABA_PAYWAY_RETURN_URL) : "",
        cancel_url:process.env.ABA_PAYWAY_CANCEL_URL || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/checkout/cancel?orderId=${order.id}` : ""),
        continue_success_url:process.env.ABA_PAYWAY_SUCCESS_URL || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/checkout/success?tranId=${tran_id}` : ""),
        currency:"USD"
    };
    fields.hash=buildPurchaseHash(fields);

    return {payment,action_url:PURCHASE_URL,method:"POST",fields};
};

// ask PayWay for the real status (never trust the callback body alone)
const checkWithPayWay=async(tran_id)=>{
    requireConfig();
    const req_time=getReqTime();
    const merchant_id=process.env.ABA_PAYWAY_MERCHANT_ID;
    const hash=buildCheckTransactionHash({req_time,merchant_id,tran_id});

    const res=await fetch(CHECK_URL,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({req_time,merchant_id,tran_id,hash})
    });
    const json=await res.json().catch(()=>({}));
    const data=json.data || {};
    // payment_status_code 0 = APPROVED
    const approved=data.payment_status_code===0 || data.payment_status==="APPROVED";
    const failed=["DECLINED","CANCELLED","REFUNDED"].includes(data.payment_status);
    return {approved,failed,data,raw:json};
};

// update Payment + Order from PayWay's answer (idempotent: safe to call many times)
const syncPayment=async(tran_id)=>{
    const result=await checkWithPayWay(tran_id);

    return sequelize.transaction(async(t)=>{
        const payment=await Payment.findOne({where:{paywayTranId:tran_id},transaction:t,lock:t.LOCK.UPDATE});
        if(!payment) throw new AppError(404,"Payment not found");
        if(payment.status==="success") return payment; // already done

        if(result.approved){
            const paidAmount=result.data.payment_amount!==undefined ? Number(result.data.payment_amount) : Number(payment.amount);
            if(money(paidAmount)!==money(payment.amount)){
                payment.status="failed";
                payment.remark=`Amount mismatch: expected ${money(payment.amount)}, got ${money(paidAmount)}`;
                await payment.save({transaction:t});
                return payment;
            }

            payment.status="success";
            payment.paidAt=new Date();
            if(result.data.payment_type) payment.method=result.data.payment_type;
            payment.remark=result.data.apv ? `APV: ${result.data.apv}` : payment.remark;
            await payment.save({transaction:t});

            const order=await Order.findByPk(payment.orderId,{transaction:t,lock:t.LOCK.UPDATE});
            if(order.status==="pending"){
                order.status="paid";
                await order.save({transaction:t});
            }
            else{
                payment.remark=`${payment.remark || ""} | Paid while order was ${order.status}: refund may be needed`.trim();
                await payment.save({transaction:t});
            }
        }
        else if(result.failed){
            payment.status="failed";
            payment.remark=`PayWay status: ${result.data.payment_status}`;
            await payment.save({transaction:t});
        }
        // otherwise still pending: leave as is
        return payment;
    });
};

// POST /payment/callback (called by PayWay server)
const handleCallback=async(body)=>{
    const tran_id=body.tran_id;
    if(!tran_id) throw new AppError(400,"tran_id is required");
    return syncPayment(tran_id);
};

// GET /payment/verify/:tranId (user checks own payment, e.g. when callback can't reach localhost)
const verifyMine=async(user,tran_id)=>{
    const payment=await Payment.findOne({where:{paywayTranId:tran_id,userId:user.id}});
    if(!payment) throw new AppError(404,"Payment not found");
    return syncPayment(tran_id);
};

// shared filters: status, method, orderId
const buildPaymentWhere=(query)=>{
    const where={};
    if(query.status){
        if(!Payment.STATUSES.includes(query.status)) throw new AppError(400,`status must be one of: ${Payment.STATUSES.join(", ")}`);
        where.status=query.status;
    }
    if(query.method) where.method=query.method;
    if(query.orderId) where.orderId=query.orderId;
    return where;
};

// ?status=&method=&orderId=&page=&limit=
const listMine=async(userId,query={})=>paginate(Payment,{
    where:{...buildPaymentWhere(query),userId},
    include:[{model:Order,as:"order",attributes:["id","order_number","total","status"]}],
    order:[["createdAt","DESC"]]
},query);

// ?status=&method=&orderId=&userId=&page=&limit=
const listAll=async(query)=>{
    const where=buildPaymentWhere(query);
    if(query.userId) where.userId=query.userId;
    return paginate(Payment,{
        where,
        include:[
            {model:Order,as:"order",attributes:["id","order_number","total","status"]},
            {model:User,as:"user",attributes:["id","firstName","lastName","email"]}
        ],
        order:[["createdAt","DESC"]]
    },query);
};

module.exports={createCheckout,handleCallback,verifyMine,listMine,listAll};
