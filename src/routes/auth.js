const express=require("express");
const router=express.Router();
const {User,Role}=require("../../models");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const {authenticate,authorize}=require("../middleware/middleware");

const JWT_SECRET=process.env.JWT_SECRET || "sala-express";

// ---------- handler factories ----------

// Returns a register handler that gives the new account the given roles
// allowBodyRoles: if true, req.body.roles (array of role codes) overrides the default roleCodes
const registerHandler=(roleCodes,successMessage,allowBodyRoles=false)=>async(req,res)=>{
    try{
        const {firstName,lastName,email,password,status}=req.body;
        if(!email || !password){
            return res.status(400).json({message:"Email and password are required"});
        }
        let codes=roleCodes;
        if(allowBodyRoles && req.body.roles!==undefined){
            if(!Array.isArray(req.body.roles) || req.body.roles.length===0){
                return res.status(400).json({message:"roles must be a non-empty array of role codes"});
            }
            codes=[...new Set(req.body.roles)];
        }
        const roles=await Role.findAll({where:{code:codes,status:true}});
        if(roles.length!==codes.length){
            const found=roles.map(r=>r.code);
            return res.status(400).json({message:"Invalid role(s)",invalid:codes.filter(c=>!found.includes(c))});
        }
        const existing=await User.findOne({where:{email}});
        if(existing){
            return res.status(409).json({message:"Email already registered"});
        }
        const hashedPassword=await bcrypt.hash(password,10);
        const user=await User.create({firstName,lastName,email,password:hashedPassword,status});
        await user.addRoles(roles);

        const {password:_,...userData}=user.toJSON();
        return res.status(201).json({
            message:successMessage,
            data:{...userData,roles:roles.map(r=>r.code)}
        });
    }catch(error){
        console.log("register error",error);
        return res.status(500).json({message:"Register failed"});
    }
};

// Returns a login handler; if requiredRole is given, account must have it
const loginHandler=(requiredRole)=>async(req,res)=>{
    try{
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({message:"Email and password are required"});
        }
        const user=await User.findOne({
            where:{email},
            include:[{model:Role,attributes:["code"],through:{attributes:[]}}]
        });
        if(!user){
            return res.status(404).json({message:"Email user not found"});
        }
        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(401).json({message:"Invalid password"});
        }
        const roles=(user.Roles || []).map(r=>r.code);
        if(requiredRole && !roles.includes(requiredRole)){
            return res.status(403).json({message:`This account is not ${requiredRole}`});
        }
        const token=jwt.sign({
            id:user.id,
            email:user.email,
            fullName:user.firstName + " " + user.lastName,
            roles
        },JWT_SECRET,{expiresIn:"1d"});

        return res.status(200).json({message:"Login successful",token,roles});
    }catch(error){
        console.log("login error",error);
        return res.status(500).json({message:"Login error"});
    }
};

// ---------- USER ----------
router.post("/user/register",registerHandler(["user"],"User has been registered successfully"));
router.post("/user/login",loginHandler());
router.get("/getDataUser",(req,res)=>{
    
})

// ---------- ADMIN ----------
router.post("/admin/login",loginHandler("admin"));
// Superadmin only: create a new admin (roles: admin + user)
router.post("/admin/register",authenticate,authorize("superadmin"),
    registerHandler(["admin","user"],"Admin has been registered successfully",true));

// Admin only: list users (without passwords)
router.get("/getData",authenticate,authorize("admin"),async(req,res)=>{
    try{
        const users=await User.findAll({
            attributes:{exclude:["password"]},
            include:[{model:Role,attributes:["code","name"],through:{attributes:[]}}]
        });
        return res.json({message:"Data is finding",data:users});
    }catch(error){
        console.log("error",error);
        return res.status(500).json({message:"Get data failed"});
    }
});

// Any logged-in user: own profile from token
router.get("/me",authenticate,(req,res)=>{
    return res.json({message:"Current user",data:req.user});
})

module.exports=router;