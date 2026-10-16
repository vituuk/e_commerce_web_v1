const {Cart,CartItem,ProductVariant,Product}=require("../../models");
const AppError=require("../util/app-error");

const itemInclude=[{
    model:ProductVariant,
    as:"variant",
    attributes:["id","sku","color","size","price","stock_qty","is_active"],
    include:[{model:Product,as:"product",attributes:["id","name","slug","base_price"]}]
}];

const validateQuantity=(quantity)=>{
    if(!Number.isInteger(Number(quantity)) || Number(quantity)<1) throw new AppError(400,"quantity must be an integer >= 1");
    return Number(quantity);
};

// get the user's cart, create it if it doesn't exist yet
const getOrCreateCart=async(userId)=>{
    const [cart]=await Cart.findOrCreate({where:{userId},defaults:{userId}});
    return cart;
};

// load an active variant + check stock
const loadVariant=async(variantId,quantity)=>{
    const variant=await ProductVariant.findByPk(variantId);
    if(!variant || !variant.is_active) throw new AppError(404,"Variant not found");
    if(quantity>variant.stock_qty) throw new AppError(400,`Only ${variant.stock_qty} left in stock`);
    return variant;
};

const findItem=async(cartId,itemId)=>{
    const item=await CartItem.findOne({where:{id:itemId,cartId}});
    if(!item) throw new AppError(404,"Cart item not found");
    return item;
};

// build response with unit_price, line_total, totals
const getCart=async(userId)=>{
    const cart=await getOrCreateCart(userId);
    const items=await CartItem.findAll({
        where:{cartId:cart.id},
        include:itemInclude,
        order:[["id","ASC"]]
    });

    let total_qty=0;
    let total_price=0;
    const data=items.map(i=>{
        const json=i.toJSON();
        const v=json.variant;
        const unit=Number(v.price!==null ? v.price : v.product.base_price);
        json.unit_price=unit;
        json.line_total=+(unit*json.quantity).toFixed(2);
        total_qty+=json.quantity;
        total_price+=json.line_total;
        return json;
    });

    return {id:cart.id,userId:cart.userId,items:data,total_qty,total_price:+total_price.toFixed(2)};
};

// add variant; if already in cart, increase quantity
const addItem=async(userId,body)=>{
    const {variantId}=body;
    if(!variantId) throw new AppError(400,"variantId is required");
    const quantity=validateQuantity(body.quantity ?? 1);

    const cart=await getOrCreateCart(userId);
    const existing=await CartItem.findOne({where:{cartId:cart.id,variantId}});
    const newQty=(existing ? existing.quantity : 0)+quantity;
    await loadVariant(variantId,newQty);

    if(existing){
        existing.quantity=newQty;
        await existing.save();
    }
    else{
        await CartItem.create({cartId:cart.id,variantId,quantity});
    }
    return getCart(userId);
};

// set quantity of an item
const updateItem=async(userId,itemId,body)=>{
    const quantity=validateQuantity(body.quantity);
    const cart=await getOrCreateCart(userId);
    const item=await findItem(cart.id,itemId);
    await loadVariant(item.variantId,quantity);

    item.quantity=quantity;
    await item.save();
    return getCart(userId);
};

const removeItem=async(userId,itemId)=>{
    const cart=await getOrCreateCart(userId);
    const item=await findItem(cart.id,itemId);
    await item.destroy();
    return getCart(userId);
};

const clearCart=async(userId)=>{
    const cart=await getOrCreateCart(userId);
    await CartItem.destroy({where:{cartId:cart.id}});
    return getCart(userId);
};

module.exports={getCart,addItem,updateItem,removeItem,clearCart};
