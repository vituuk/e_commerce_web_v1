const cartService=require("../services/cart.service");

// AppError -> its status; anything else -> 500 with a generic message
const handleError=(res,error,label)=>{
    if(error.status){
        return res.status(error.status).json({message:error.message});
    }
    console.log(`${label} error`,error);
    return res.status(500).json({message:`${label} failed`});
};

// GET /cart
const getCart=async(req,res)=>{
    try{
        const data=await cartService.getCart(req.user.id);
        return res.status(200).json({message:"Cart",data});
    }
    catch(error){
        return handleError(res,error,"Get cart");
    }
};

// POST /cart/items   body: {variantId, quantity}
const addItem=async(req,res)=>{
    try{
        const data=await cartService.addItem(req.user.id,req.body || {});
        return res.status(201).json({message:"Item added to cart",data});
    }
    catch(error){
        return handleError(res,error,"Add cart item");
    }
};

// PUT /cart/items/:id   body: {quantity}
const updateItem=async(req,res)=>{
    try{
        const data=await cartService.updateItem(req.user.id,req.params.id,req.body || {});
        return res.status(200).json({message:"Cart item updated",data});
    }
    catch(error){
        return handleError(res,error,"Update cart item");
    }
};

// DELETE /cart/items/:id
const removeItem=async(req,res)=>{
    try{
        const data=await cartService.removeItem(req.user.id,req.params.id);
        return res.status(200).json({message:"Cart item removed",data});
    }
    catch(error){
        return handleError(res,error,"Remove cart item");
    }
};

// DELETE /cart
const clearCart=async(req,res)=>{
    try{
        const data=await cartService.clearCart(req.user.id);
        return res.status(200).json({message:"Cart cleared",data});
    }
    catch(error){
        return handleError(res,error,"Clear cart");
    }
};

module.exports={getCart,addItem,updateItem,removeItem,clearCart};
