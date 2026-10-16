const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const {User,Role}=require("../../models");
const AppError=require("../util/app-error");

const JWT_SECRET=process.env.JWT_SECRET || "sala-express";

// create an account with the given role codes
// allowBodyRoles: if true, body.roles (array of role codes) overrides the default roleCodes
const register=async(body,roleCodes,allowBodyRoles=false)=>{
    const {firstName,lastName,email,password,status}=body;
    if(!email || !password) throw new AppError(400,"Email and password are required");

    let codes=roleCodes;
    if(allowBodyRoles && body.roles!==undefined){
        if(!Array.isArray(body.roles) || body.roles.length===0){
            throw new AppError(400,"roles must be a non-empty array of role codes");
        }
        codes=[...new Set(body.roles)];
    }
    const roles=await Role.findAll({where:{code:codes,status:true}});
    if(roles.length!==codes.length){
        const found=roles.map(r=>r.code);
        const error=new AppError(400,"Invalid role(s)");
        error.extra={invalid:codes.filter(c=>!found.includes(c))};
        throw error;
    }
    const existing=await User.findOne({where:{email}});
    if(existing) throw new AppError(409,"Email already registered");

    const hashedPassword=await bcrypt.hash(password,10);
    const user=await User.create({firstName,lastName,email,password:hashedPassword,status});
    await user.addRoles(roles);

    const {password:_,...userData}=user.toJSON();
    return {...userData,roles:roles.map(r=>r.code)};
};

// if requiredRole is given, account must have it
const login=async(body,requiredRole)=>{
    const {email,password}=body;
    if(!email || !password) throw new AppError(400,"Email and password are required");

    const user=await User.findOne({
        where:{email},
        include:[{model:Role,attributes:["code"],through:{attributes:[]}}]
    });
    if(!user) throw new AppError(404,"Email user not found");

    const isMatch=await bcrypt.compare(password,user.password);
    if(!isMatch) throw new AppError(401,"Invalid password");

    const roles=(user.Roles || []).map(r=>r.code);
    if(requiredRole && !roles.includes(requiredRole)){
        throw new AppError(403,`This account is not ${requiredRole}`);
    }
    const token=jwt.sign({
        id:user.id,
        email:user.email,
        fullName:user.firstName + " " + user.lastName,
        roles
    },JWT_SECRET,{expiresIn:"1d"});
    return {token,roles};
};

// all users without passwords
const listUsers=()=>User.findAll({
    attributes:{exclude:["password"]},
    include:[{model:Role,attributes:["code","name"],through:{attributes:[]}}]
});

module.exports={register,login,listUsers};
