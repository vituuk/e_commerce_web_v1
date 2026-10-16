const express=require("express");
const router=express.Router();
const {Category,Product}=require("../../models");
const {authenticate,authorize}=require("../middleware/middleware");

// GET /category : public, list categories
router.get("/",async(req,res)=>{
    try{
        const categories=await Category.findAll({order:[["id","ASC"]]});
        return res.status(200).json({message:"Get categories successfully",data:categories});
    }
    catch(error){
        console.log("Get categories error",error);
        return res.status(500).json({message:"Get categories failed"});
    }
});

// GET /category/:id : public, one category with its products
router.get("/:id",async(req,res)=>{
    try{
        const category=await Category.findByPk(req.params.id,{
            include:[{model:Product,as:"products"}]
        });
        if(!category){
            return res.status(404).json({message:"Category not found"});
        }
        return res.status(200).json({message:"Get category successfully",data:category});
    }
    catch(error){
        console.log("Get category error",error);
        return res.status(500).json({message:"Get category failed"});
    }
});

// POST /category : admin only, create category
router.post("/",authenticate,authorize("admin"),async(req,res)=>{
    try{
        const {name,slug,is_active}=req.body;

        if(!name || !slug){
            return res.status(400).json({message:"name and slug are required"});
        }
        const existing=await Category.findOne({where:{slug}});
        if(existing){
            return res.status(409).json({message:"Slug already used"});
        }

        const category=await Category.create({name,slug,is_active});
        return res.status(201).json({message:"Category created",data:category});
    }
    catch(error){
        console.log("Create category error",error);
        return res.status(500).json({message:"Create category failed"});
    }
});

// PUT /category/:id : admin only, update category (send only fields to change)
router.put("/:id",authenticate,authorize("admin"),async(req,res)=>{
    try{
        const category=await Category.findByPk(req.params.id);
        if(!category){
            return res.status(404).json({message:"Category not found"});
        }

        const {name,slug,is_active}=req.body;

        if(slug && slug!==category.slug){
            const existing=await Category.findOne({where:{slug}});
            if(existing){
                return res.status(409).json({message:"Slug already used"});
            }
        }

        if(name!==undefined) category.name=name;
        if(slug!==undefined) category.slug=slug;
        if(is_active!==undefined) category.is_active=is_active;
        await category.save();

        return res.status(200).json({message:"Category updated",data:category});
    }
    catch(error){
        console.log("Update category error",error);
        return res.status(500).json({message:"Update category failed"});
    }
});

// DELETE /category/:id : admin only
// products are kept (their categoryId becomes null)
router.delete("/:id",authenticate,authorize("admin"),async(req,res)=>{
    try{
        const category=await Category.findByPk(req.params.id);
        if(!category){
            return res.status(404).json({message:"Category not found"});
        }
        await category.destroy();
        return res.status(200).json({message:"Category deleted"});
    }
    catch(error){
        console.log("Delete category error",error);
        return res.status(500).json({message:"Delete category failed"});
    }
});

module.exports=router;
