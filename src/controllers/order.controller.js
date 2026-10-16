const orderService=require("../services/order.service");

// AppError -> its status; anything else -> 500 with a generic message
const handleError=(res,error,label)=>{
    if(error.status){
        return res.status(error.status).json({message:error.message});
    }
    console.log(`${label} error`,error);
    return res.status(500).json({message:`${label} failed`});
};

// POST /order   body: {addressId?}
const checkout=async(req,res)=>{
    try{
        const data=await orderService.checkout(req.user.id,req.body || {});
        return res.status(201).json({message:"Order placed",data});
    }
    catch(error){
        return handleError(res,error,"Checkout");
    }
};

// GET /order
const listMine=async(req,res)=>{
    try{
        const {rows,pagination}=await orderService.listMine(req.user.id,req.query);
        return res.status(200).json({message:"My orders",data:rows,pagination});
    }
    catch(error){
        return handleError(res,error,"Get my orders");
    }
};

// GET /order/:id
const getMine=async(req,res)=>{
    try{
        const data=await orderService.getMine(req.user.id,req.params.id);
        return res.status(200).json({message:"Order",data});
    }
    catch(error){
        return handleError(res,error,"Get order");
    }
};

// PATCH /order/:id/cancel
const cancelMine=async(req,res)=>{
    try{
        const data=await orderService.cancelMine(req.user.id,req.params.id);
        return res.status(200).json({message:"Order cancelled",data});
    }
    catch(error){
        return handleError(res,error,"Cancel order");
    }
};

// GET /order/admin?status=
const listAll=async(req,res)=>{
    try{
        const {rows,pagination}=await orderService.listAll(req.query);
        return res.status(200).json({message:"All orders",data:rows,pagination});
    }
    catch(error){
        return handleError(res,error,"Get all orders");
    }
};

// GET /order/admin/:id
const getAny=async(req,res)=>{
    try{
        const data=await orderService.getAny(req.params.id);
        return res.status(200).json({message:"Order",data});
    }
    catch(error){
        return handleError(res,error,"Get order");
    }
};

// PATCH /order/admin/:id/status   body: {status}
const updateStatus=async(req,res)=>{
    try{
        const data=await orderService.updateStatus(req.params.id,req.body || {});
        return res.status(200).json({message:"Order status updated",data});
    }
    catch(error){
        return handleError(res,error,"Update order status");
    }
};

module.exports={checkout,listMine,getMine,cancelMine,listAll,getAny,updateStatus};
