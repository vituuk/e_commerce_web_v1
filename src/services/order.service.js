const {Op}=require("sequelize");
const {Order,OrderItem,Cart,CartItem,ProductVariant,Product,Address,User,sequelize}=require("../../models");
const AppError=require("../util/app-error");
const {paginate}=require("../util/paginate");

const SHIPPING_FEE=Number(process.env.SHIPPING_FEE || 0);

// allowed status changes (admin)
const TRANSITIONS={
    pending:["paid","cancelled"],
    paid:["shipped","cancelled"],
    shipped:["delivered"],
    delivered:[],
    cancelled:[]
};

const money=(n)=>+Number(n).toFixed(2);

// e.g. ORD-20261016-4F7K2Q
const generateOrderNumber=()=>{
    const d=new Date();
    const date=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
    const rand=Math.random().toString(36).slice(2,8).toUpperCase();
    return `ORD-${date}-${rand}`;
};

const orderInclude=[{model:OrderItem,as:"items"}];

const findOrder=async(where,transaction,lock)=>{
    const order=await Order.findOne({
        where,
        include:orderInclude,
        transaction,
        lock:lock ? {level:lock,of:Order} : undefined
    });
    if(!order) throw new AppError(404,"Order not found");
    return order;
};

// pick address: the given addressId (must be mine) or my default one
const resolveAddress=async(userId,addressId,transaction)=>{
    const where=addressId ? {id:addressId,userId} : {userId,status:true};
    const address=await Address.findOne({where,transaction});
    if(!address) throw new AppError(400,addressId ? "Address not found" : "No default address, please add an address or send addressId");
    return address;
};

// put stock back for every item (used on cancel)
const restoreStock=async(order,transaction)=>{
    for(const item of order.items){
        if(!item.variantId) continue;
        await ProductVariant.increment({stock_qty:item.quantity},{where:{id:item.variantId},transaction});
    }
};

// POST /order: turn my cart into an order
const checkout=async(userId,body)=>sequelize.transaction(async(t)=>{
    const cart=await Cart.findOne({where:{userId},transaction:t});
    const cartItems=cart ? await CartItem.findAll({where:{cartId:cart.id},transaction:t}) : [];
    if(!cartItems.length) throw new AppError(400,"Cart is empty");

    const address=await resolveAddress(userId,body.addressId,t);

    // lock variants so two checkouts can't oversell the same stock
    const variants=await ProductVariant.findAll({
        where:{id:cartItems.map(i=>i.variantId)},
        include:[{model:Product,as:"product",attributes:["id","name","base_price"]}],
        lock:{level:t.LOCK.UPDATE,of:ProductVariant},
        transaction:t
    });
    const byId=new Map(variants.map(v=>[v.id,v]));

    let sub_total=0;
    const lines=cartItems.map(ci=>{
        const v=byId.get(ci.variantId);
        if(!v || !v.is_active) throw new AppError(400,`Variant ${ci.variantId} is no longer available`);
        if(ci.quantity>v.stock_qty) throw new AppError(400,`Only ${v.stock_qty} left in stock for ${v.sku}`);
        const unit_price=money(v.price!==null ? v.price : v.product.base_price);
        const amount=money(unit_price*ci.quantity);
        sub_total+=amount;
        return {
            variant:v,
            data:{
                variantId:v.id,
                product_name:v.product.name,
                sku:v.sku,
                color:v.color,
                size:v.size,
                unit_price,
                quantity:ci.quantity,
                amount
            }
        };
    });

    sub_total=money(sub_total);
    const discount=0; // no coupons yet
    const shipping_fee=money(SHIPPING_FEE);
    const total=money(sub_total-discount+shipping_fee);

    const order=await Order.create({
        userId,
        addressId:address.id,
        order_number:generateOrderNumber(),
        shipping_receiver_name:address.receiver_name,
        shipping_phone:address.phone,
        shipping_street:address.street,
        shipping_city:address.city,
        sub_total,
        discount,
        shipping_fee,
        total,
        status:"pending"
    },{transaction:t});

    await OrderItem.bulkCreate(lines.map(l=>({...l.data,orderId:order.id})),{transaction:t});

    // reduce stock
    for(const l of lines){
        await l.variant.decrement({stock_qty:l.data.quantity},{transaction:t});
    }

    // empty the cart
    await CartItem.destroy({where:{cartId:cart.id},transaction:t});

    return findOrder({id:order.id},t);
});

// shared filters: status, q (order_number), from / to (createdAt, YYYY-MM-DD)
const buildOrderWhere=(query)=>{
    const where={};
    if(query.status){
        if(!Order.STATUSES.includes(query.status)) throw new AppError(400,`status must be one of: ${Order.STATUSES.join(", ")}`);
        where.status=query.status;
    }
    if(query.q) where.order_number={[Op.iLike]:`%${query.q}%`};
    if(query.from || query.to){
        const range={};
        if(query.from){
            if(isNaN(Date.parse(query.from))) throw new AppError(400,"from must be a valid date (YYYY-MM-DD)");
            range[Op.gte]=new Date(query.from);
        }
        if(query.to){
            if(isNaN(Date.parse(query.to))) throw new AppError(400,"to must be a valid date (YYYY-MM-DD)");
            const end=new Date(query.to);
            end.setHours(23,59,59,999);
            range[Op.lte]=end;
        }
        where.createdAt=range;
    }
    return where;
};

// GET /order (mine, newest first) ?status=&q=&from=&to=&page=&limit=
const listMine=async(userId,query={})=>paginate(Order,{
    where:{...buildOrderWhere(query),userId},
    include:orderInclude,
    order:[["createdAt","DESC"]]
},query);

// GET /order/:id (mine)
const getMine=async(userId,id)=>findOrder({id,userId});

// PATCH /order/:id/cancel (mine, only while pending)
const cancelMine=async(userId,id)=>sequelize.transaction(async(t)=>{
    const order=await findOrder({id,userId},t,t.LOCK.UPDATE);
    if(order.status!=="pending") throw new AppError(400,`Cannot cancel an order that is ${order.status}`);
    await restoreStock(order,t);
    order.status="cancelled";
    await order.save({transaction:t});
    return order;
});

// ---------- admin ----------

// GET /order/admin?status=&q=&userId=&from=&to=&page=&limit=
const listAll=async(query)=>{
    const where=buildOrderWhere(query);
    if(query.userId) where.userId=query.userId;
    return paginate(Order,{
        where,
        include:[...orderInclude,{model:User,as:"user",attributes:["id","firstName","lastName","email"]}],
        order:[["createdAt","DESC"]]
    },query);
};

// GET /order/admin/:id
const getAny=async(id)=>{
    const order=await Order.findOne({
        where:{id},
        include:[...orderInclude,{model:User,as:"user",attributes:["id","firstName","lastName","email"]}]
    });
    if(!order) throw new AppError(404,"Order not found");
    return order;
};

// PATCH /order/admin/:id/status  body: {status}
const updateStatus=async(id,body)=>sequelize.transaction(async(t)=>{
    const next=body.status;
    if(!Order.STATUSES.includes(next)) throw new AppError(400,`status must be one of: ${Order.STATUSES.join(", ")}`);

    const order=await findOrder({id},t,t.LOCK.UPDATE);
    if(!TRANSITIONS[order.status].includes(next)){
        throw new AppError(400,`Cannot change status from ${order.status} to ${next}`);
    }
    if(next==="cancelled") await restoreStock(order,t);

    order.status=next;
    await order.save({transaction:t});
    return order;
});

module.exports={checkout,listMine,getMine,cancelMine,listAll,getAny,updateStatus};
