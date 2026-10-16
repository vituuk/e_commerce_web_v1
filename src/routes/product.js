const express=require("express");
const router=express.Router();
const {Product,Category}=require("../../models");
const {authenticate,authorize}=require("../middleware/middleware");

// GET /product : public, list products with their category
// optional filter: /product?categoryId=1
router.get("/",async(req,res)=>{
    try{
        const where={};
        if(req.query.categoryId) where.categoryId=req.query.categoryId;

        const products=await Product.findAll({
            where,
            include:[{model:Category,as:"category",attributes:["id","name","slug"]}],
            order:[["id","ASC"]]
        });
        return res.status(200).json({message:"Get products successfully",data:products});
    }
    catch(error){
        console.log("Get products error",error);
        return res.status(500).json({message:"Get products failed"});
    }
});

// GET /product/:id : public, one product with its category
router.get("/:id",async(req,res)=>{
    try{
        const product=await Product.findByPk(req.params.id,{
            include:[{model:Category,as:"category",attributes:["id","name","slug"]}]
        });
        if(!product){
            return res.status(404).json({message:"Product not found"});
        }
        return res.status(200).json({message:"Get product successfully",data:product});
    }
    catch(error){
        console.log("Get product error",error);
        return res.status(500).json({message:"Get product failed"});
    }
});

// POST /product : admin only, create product
router.post("/",authenticate,authorize("admin"),async(req,res)=>{
    try{
        const {categoryId,name,slug,description,base_price,is_active}=req.body;

        if(!name || !slug){
            return res.status(400).json({message:"name and slug are required"});
        }
        if(base_price!==undefined && (isNaN(base_price) || Number(base_price)<0)){
            return res.status(400).json({message:"base_price must be a number >= 0"});
        }
        if(categoryId){
            const category=await Category.findByPk(categoryId);
            if(!category){
                return res.status(400).json({message:"Category not found"});
            }
        }
        const existing=await Product.findOne({where:{slug}});
        if(existing){
            return res.status(409).json({message:"Slug already used"});
        }

        const product=await Product.create({categoryId,name,slug,description,base_price,is_active});
        return res.status(201).json({message:"Product created",data:product});
    }
    catch(error){
        console.log("Create product error",error);
        return res.status(500).json({message:"Create product failed"});
    }
});

// PUT /product/:id : admin only, update product (send only fields to change)
router.put("/:id",authenticate,authorize("admin"),async(req,res)=>{
    try{
        const product=await Product.findByPk(req.params.id);
        if(!product){
            return res.status(404).json({message:"Product not found"});
        }

        const {categoryId,name,slug,description,base_price,is_active}=req.body;

        if(base_price!==undefined && (isNaN(base_price) || Number(base_price)<0)){
            return res.status(400).json({message:"base_price must be a number >= 0"});
        }
        if(categoryId){
            const category=await Category.findByPk(categoryId);
            if(!category){
                return res.status(400).json({message:"Category not found"});
            }
        }
        if(slug && slug!==product.slug){
            const existing=await Product.findOne({where:{slug}});
            if(existing){
                return res.status(409).json({message:"Slug already used"});
            }
        }

        if(categoryId!==undefined) product.categoryId=categoryId;
        if(name!==undefined) product.name=name;
        if(slug!==undefined) product.slug=slug;
        if(description!==undefined) product.description=description;
        if(base_price!==undefined) product.base_price=base_price;
        if(is_active!==undefined) product.is_active=is_active;
        await product.save();

        return res.status(200).json({message:"Product updated",data:product});
    }
    catch(error){
        console.log("Update product error",error);
        return res.status(500).json({message:"Update product failed"});
    }
});

// DELETE /product/:id : admin only
router.delete("/:id",authenticate,authorize("admin"),async(req,res)=>{
    try{
        const product=await Product.findByPk(req.params.id);
        if(!product){
            return res.status(404).json({message:"Product not found"});
        }
        await product.destroy();
        return res.status(200).json({message:"Product deleted"});
    }
    catch(error){
        console.log("Delete product error",error);
        return res.status(500).json({message:"Delete product failed"});
    }
});

module.exports=router;