const userService=require("../services/user.service");
const handleError=require("../util/handle-error");

// ---------- handler factories ----------

// Returns a register handler that gives the new account the given roles
// allowBodyRoles: if true, req.body.roles (array of role codes) overrides the default roleCodes
const register=(roleCodes,successMessage,allowBodyRoles=false)=>async(req,res)=>{
    try{
        const data=await userService.register(req.body || {},roleCodes,allowBodyRoles);
        return res.status(201).json({message:successMessage,data});
    }
    catch(error){
        return handleError(res,error,"Register");
    }
};

// Returns a login handler; if requiredRole is given, account must have it
const login=(requiredRole)=>async(req,res)=>{
    try{
        const {token,roles}=await userService.login(req.body || {},requiredRole);
        return res.status(200).json({message:"Login successful",token,roles});
    }
    catch(error){
        if(!error.status){
            console.log("login error",error);
            return res.status(500).json({message:"Login error"});
        }
        return handleError(res,error,"Login");
    }
};

// GET /auth/getData : admin only, list users (without passwords)
const listUsers=async(req,res)=>{
    try{
        const data=await userService.listUsers();
        return res.json({message:"Data is finding",data});
    }
    catch(error){
        return handleError(res,error,"Get data");
    }
};

// GET /auth/me : own data from token
const me=(req,res)=>res.json({message:"Current user",data:req.user});

module.exports={register,login,listUsers,me};
