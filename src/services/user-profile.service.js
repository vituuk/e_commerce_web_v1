const {User,Role,UserProfile}=require("../../models");
const AppError=require("../util/app-error");

// user (no password) + profile + roles
const findUserProfile=async(id)=>{
    const user=await User.findByPk(id,{
        attributes:{exclude:["password"]},
        include:[
            {model:UserProfile,as:"profile",attributes:{exclude:["userId"]}},
            {model:Role,attributes:["code","name"],through:{attributes:[]}}
        ]
    });
    if(!user) throw new AppError(404,"User not found");
    return user;
};

const findUser=async(id)=>{
    const user=await User.findByPk(id);
    if(!user) throw new AppError(404,"User not found");
    return user;
};

const validate=({phone,date_of_birth})=>{
    if(date_of_birth && isNaN(Date.parse(date_of_birth))){
        throw new AppError(400,"date_of_birth must be a valid date (YYYY-MM-DD)");
    }
    if(phone && !/^\+?[0-9]{6,15}$/.test(String(phone))){
        throw new AppError(400,"phone must be 6-15 digits, optional leading +");
    }
};

// firstName / lastName are on the Users table
const saveNames=async(user,{firstName,lastName})=>{
    if(firstName!==undefined) user.firstName=firstName;
    if(lastName!==undefined) user.lastName=lastName;
    await user.save();
};

// create own profile (only once); userId comes from the token, never from the body
const create=async(userId,body)=>{
    const user=await findUser(userId);
    const {avatar,bio,phone,date_of_birth}=body;
    validate(body);

    const existing=await UserProfile.findOne({where:{userId:user.id}});
    if(existing) throw new AppError(409,"Profile already exists, use PUT to update");

    await saveNames(user,body);
    await UserProfile.create({
        userId:user.id,
        avatar,
        bio,
        phone:phone ? String(phone) : null,
        date_of_birth
    });
    return findUserProfile(user.id);
};

// update own existing profile (send only fields to change)
const update=async(userId,body)=>{
    const user=await findUser(userId);
    const {avatar,bio,phone,date_of_birth}=body;
    validate(body);

    const profile=await UserProfile.findOne({where:{userId:user.id}});
    if(!profile) throw new AppError(404,"Profile not found, use POST to create");

    await saveNames(user,body);
    if(avatar!==undefined) profile.avatar=avatar;
    if(bio!==undefined) profile.bio=bio;
    if(phone!==undefined) profile.phone=phone ? String(phone) : null;
    if(date_of_birth!==undefined) profile.date_of_birth=date_of_birth;
    await profile.save();
    return findUserProfile(user.id);
};

module.exports={findUserProfile,create,update};
