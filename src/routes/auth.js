const express=require("express");
const router=express.Router();
const {authenticate,authorize}=require("../middleware/middleware");
const authController=require("../controllers/auth.controller");

// ---------- USER ----------
router.post("/user/register",authController.register(["user"],"User has been registered successfully"));
router.post("/user/login",authController.login());
router.get("/getDataUser",(req,res)=>{
    
})

// ---------- ADMIN ----------
router.post("/admin/login",authController.login("admin"));
// Superadmin only: create a new admin (roles: admin + user)
router.post("/admin/register",authenticate,authorize("superadmin"),
    authController.register(["admin","user"],"Admin has been registered successfully",true));

// Admin only: list users (without passwords)
router.get("/getData",authenticate,authorize("admin"),authController.listUsers);

// Any logged-in user: own profile from token
router.get("/me",authenticate,authController.me);

module.exports=router;