const express=require("express");
const {authenticate,authorize}=require("../middleware/middleware");
const profileController=require("../controllers/user-profile.controller");

const router=express.Router();

// GET /auth/profile : any logged-in user, own account + profile
router.get("/profile",authenticate,profileController.getMine);
// POST /auth/profile : create own profile (only once)
router.post("/profile",authenticate,profileController.create);
// PUT /auth/profile : update own existing profile (send only fields to change)
router.put("/profile",authenticate,profileController.update);
// GET /auth/profile/:userId : admin only, view any user's profile
router.get("/profile/:userId",authenticate,authorize("admin"),profileController.getByUserId);

module.exports=router;