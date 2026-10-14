const express= require("express");
const router= express.Router();

const {Product}= require("../../models");

router.get("/product",async(req,res)=>{
    const getall= await Product.findAll();
    res.json(
        {message: "get product successfully",getall}
    )
});

router.post("/product",async(req,res)=>{
    const {firstName,lastName,email}=req.body;
    const product= await Product.create({
        firstName,
        lastName,
        email
    });
    return res.json( {
        message: "create successfuly",
        product
    }
    )
})

module.exports = router;