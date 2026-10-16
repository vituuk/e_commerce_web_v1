const {Op}=require("sequelize");
const {Address,sequelize}=require("../../models");
const AppError=require("../util/app-error");
const {paginate}=require("../util/paginate");

const TEXT_FIELDS=["receiver_name","phone","street","city"];
const PHONE_REGEX=/^\+?[0-9]{6,15}$/;

// partial=true for update (only check fields that were sent)
const validate=(body,partial)=>{
    for(const field of TEXT_FIELDS){
        const value=body[field];
        if(!partial || value!==undefined){
            if(typeof value!=="string" || !value.trim()) return `${field} is required`;
        }
    }
    if(body.phone!==undefined && !PHONE_REGEX.test(String(body.phone).trim())) return "phone must be 6-15 digits, optional leading +";
    if(body.status!==undefined && typeof body.status!=="boolean") return "status must be true or false";
    return null;
};

const findAddress=async(userId,id,transaction)=>{
    const address=await Address.findOne({where:{id,userId},transaction});
    if(!address) throw new AppError(404,"Address not found");
    return address;
};

// unset default on all other addresses of this user
const clearDefault=(userId,transaction)=>
    Address.update({status:false},{where:{userId,status:true},transaction});

// default first, then newest
// ?city=phnom&q=dara&page=1&limit=10  (q matches receiver_name, phone or street)
const list=async(userId,query={})=>{
    const where={userId};
    if(query.city) where.city={[Op.iLike]:`%${query.city}%`};
    if(query.q){
        const like={[Op.iLike]:`%${query.q}%`};
        where[Op.or]=[{receiver_name:like},{phone:like},{street:like}];
    }
    return paginate(Address,{where,order:[["status","DESC"],["createdAt","DESC"]]},query);
};

const getOne=async(userId,id)=>findAddress(userId,id);

const getDefault=async(userId)=>{
    const address=await Address.findOne({where:{userId,status:true}});
    if(!address) throw new AppError(404,"No default address");
    return address;
};

const create=async(userId,body)=>{
    const error=validate(body,false);
    if(error) throw new AppError(400,error);

    return sequelize.transaction(async(t)=>{
        // first address is always default
        const count=await Address.count({where:{userId},transaction:t});
        const makeDefault=count===0 || body.status===true;
        if(makeDefault) await clearDefault(userId,t);

        return Address.create({
            userId,
            receiver_name:body.receiver_name.trim(),
            phone:body.phone.trim(),
            street:body.street.trim(),
            city:body.city.trim(),
            status:makeDefault
        },{transaction:t});
    });
};

const update=async(userId,id,body)=>{
    const error=validate(body,true);
    if(error) throw new AppError(400,error);

    return sequelize.transaction(async(t)=>{
        const address=await findAddress(userId,id,t);

        for(const field of TEXT_FIELDS){
            if(body[field]!==undefined) address[field]=body[field].trim();
        }
        if(body.status===true && !address.status){
            await clearDefault(userId,t);
            address.status=true;
        }
        // status:false on the default is ignored: use set-default on another address instead
        await address.save({transaction:t});
        return address;
    });
};

const setDefault=async(userId,id)=>sequelize.transaction(async(t)=>{
    const address=await findAddress(userId,id,t);
    if(!address.status){
        await clearDefault(userId,t);
        address.status=true;
        await address.save({transaction:t});
    }
    return address;
});

// if the default is deleted, the newest remaining address becomes default
const remove=async(userId,id)=>sequelize.transaction(async(t)=>{
    const address=await findAddress(userId,id,t);
    const wasDefault=address.status;
    await address.destroy({transaction:t});

    if(wasDefault){
        const next=await Address.findOne({where:{userId},order:[["createdAt","DESC"]],transaction:t});
        if(next){
            next.status=true;
            await next.save({transaction:t});
        }
    }
});

module.exports={list,getOne,getDefault,create,update,setDefault,remove};
