const express=require("express");
const {User,Role,UserProfile}=require("../../models");
const {authenticate,authorize}=require("../middleware/middleware");

const router=express.Router();

// must RETURN the promise, and include keys are lowercase "model"
const findUserProfile=(id)=>{
    return User.findByPk(id,{
        attributes:{exclude:["password"]},
        include:[
            {model:UserProfile,as:"profile",attributes:{exclude:["userId"]}},
            {model:Role,attributes:["code","name"],through:{attributes:[]}}
        ]
    });
};

// GET /auth/profile : any logged-in user, own account + profile
router.get("/profile",authenticate,async(req,res)=>{
    try{
        const user=await findUserProfile(req.user.id);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        return res.status(200).json({message:"Profile",data:user});
    }
    catch(error){
        console.log("Get profile error",error);
        return res.status(500).json({message:"Get profile failed"});
    }
});

// POST /auth/profile : create own profile (only once)
router.post("/profile",authenticate,async(req,res)=>{
    try{
        const user=await User.findByPk(req.user.id);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }

        const {firstName,lastName,avatar,bio,phone,date_of_birth}=req.body;

        // validate
        if(date_of_birth && isNaN(Date.parse(date_of_birth))){
            return res.status(400).json({message:"date_of_birth must be a valid date (YYYY-MM-DD)"});
        }
        if(phone && !/^\+?[0-9]{6,15}$/.test(String(phone))){
            return res.status(400).json({message:"phone must be 6-15 digits, optional leading +"});
        }

        // only one profile per user
        const existing=await UserProfile.findOne({where:{userId:user.id}});
        if(existing){
            return res.status(409).json({message:"Profile already exists, use PUT to update"});
        }

        // firstName / lastName are on the Users table
        if(firstName!==undefined) user.firstName=firstName;
        if(lastName!==undefined) user.lastName=lastName;
        await user.save();

        // userId comes from the token, never from the body
        await UserProfile.create({
            userId:user.id,
            avatar,
            bio,
            phone:phone ? String(phone) : null,
            date_of_birth
        });

        const result=await findUserProfile(user.id);
        return res.status(201).json({message:"Profile created",data:result});
    }
    catch(error){
        console.log("Create profile error",error);
        return res.status(500).json({message:"Create profile failed"});
    }
});

// PUT /auth/profile : update own existing profile (send only fields to change)
router.put("/profile",authenticate,async(req,res)=>{
    try{
        const user=await User.findByPk(req.user.id);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }

        const {firstName,lastName,avatar,bio,phone,date_of_birth}=req.body;

        // validate
        if(date_of_birth && isNaN(Date.parse(date_of_birth))){
            return res.status(400).json({message:"date_of_birth must be a valid date (YYYY-MM-DD)"});
        }
        if(phone && !/^\+?[0-9]{6,15}$/.test(String(phone))){
            return res.status(400).json({message:"phone must be 6-15 digits, optional leading +"});
        }

        const profile=await UserProfile.findOne({where:{userId:user.id}});
        if(!profile){
            return res.status(404).json({message:"Profile not found, use POST to create"});
        }

        // firstName / lastName are on the Users table
        if(firstName!==undefined) user.firstName=firstName;
        if(lastName!==undefined) user.lastName=lastName;
        await user.save();

        // only change fields that were sent
        if(avatar!==undefined) profile.avatar=avatar;
        if(bio!==undefined) profile.bio=bio;
        if(phone!==undefined) profile.phone=phone ? String(phone) : null;
        if(date_of_birth!==undefined) profile.date_of_birth=date_of_birth;
        await profile.save();

        const result=await findUserProfile(user.id);
        return res.status(200).json({message:"Profile updated",data:result});
    }
    catch(error){
        console.log("Update profile error",error);
        return res.status(500).json({message:"Update profile failed"});
    }
});

// GET /auth/profile/:userId : admin only, view any user's profile
router.get("/profile/:userId",authenticate,authorize("admin"),async(req,res)=>{
    try{
        const user=await findUserProfile(req.params.userId);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        return res.status(200).json({message:"Profile",data:user});
    }
    catch(error){
        console.log("Get user profile error",error);
        return res.status(500).json({message:"Get profile failed"});
    }
});

module.exports=router;