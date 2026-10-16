const paymentService=require("../services/payment.service");

// AppError -> its status; anything else -> 500 with a generic message
const handleError=(res,error,label)=>{
    if(error.status){
        return res.status(error.status).json({message:error.message});
    }
    console.log(`${label} error`,error);
    return res.status(500).json({message:`${label} failed`});
};

// POST /payment/checkout
const checkout=async(req,res)=>{
    try{
        const data=await paymentService.createCheckout(req.user,req.body || {});
        return res.status(201).json({message:"Payment created, submit fields to action_url",data});
    }
    catch(error){
        return handleError(res,error,"Create payment");
    }
};

// POST /payment/callback (PayWay pushback, public)
const callback=async(req,res)=>{
    try{
        const data=await paymentService.handleCallback(req.body || {});
        return res.status(200).json({message:"OK",status:data.status});
    }
    catch(error){
        return handleError(res,error,"Payment callback");
    }
};

// GET /payment/verify/:tranId
const verify=async(req,res)=>{
    try{
        const data=await paymentService.verifyMine(req.user,req.params.tranId);
        return res.status(200).json({message:"Payment status",data});
    }
    catch(error){
        return handleError(res,error,"Verify payment");
    }
};

// GET /payment
const listMine=async(req,res)=>{
    try{
        const {rows,pagination}=await paymentService.listMine(req.user.id,req.query);
        return res.status(200).json({message:"My payments",data:rows,pagination});
    }
    catch(error){
        return handleError(res,error,"Get my payments");
    }
};

// GET /payment/admin?status=
const listAll=async(req,res)=>{
    try{
        const {rows,pagination}=await paymentService.listAll(req.query);
        return res.status(200).json({message:"All payments",data:rows,pagination});
    }
    catch(error){
        return handleError(res,error,"Get all payments");
    }
};

module.exports={checkout,callback,verify,listMine,listAll};
