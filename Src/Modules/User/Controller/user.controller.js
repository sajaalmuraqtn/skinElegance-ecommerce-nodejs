import slugify from "slugify";
import UserModel from "../../../../DB/model/user.model.js";
import cloudinary from "../../../Services/cloudinary.js";
import { pagination } from "../../../Services/pagination.js";

  
export const profile=async(req,res,next)=>{
    const user=await UserModel.findById(req.user._id)
    return res.status(201).json({message:"success",user}); 
}

export const updateProfile=async(req,res,next)=>{
    const user=await UserModel.findById(req.user._id);

    if (req.body.userName) {
        if (await UserModel.findOne({ userName:req.body.userName.toLowerCase()}).select('userName')) {
            return next(new Error("userName already exist", { cause: 409 }));
        }
        user.userName=req.body.userName.toLowerCase();
        user.slug = slugify(user.userName);
    } 
      

    if (req.body.phoneNumber) {
        user.phoneNumber=req.body.phoneNumber;
    }

    if (req.body.address) {
        user.address=req.body.address;
    }
    
    
    if (req.file) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `${process.env.APP_NAME}/User`
        })
        await cloudinary.uploader.destroy(user.image.public_id);
        user.image = { secure_url, public_id };
    }

    await user.save() 
 
    return res.status(201).json({message:"success",user}); 
}

export const getAllUsers = async (req, res, next) => {
    const { limit, skip } = pagination(req.query.page, req.query.limit);

    let queryObj = { ...req.query };
    const execQuery = ['page', 'limit', 'skip', 'sort'];
    execQuery.map((ele) => {
        delete queryObj[ele];
    })
    queryObj = JSON.stringify(queryObj);
    queryObj = queryObj.replace(/\b(gt|gte|lt|lte|in|nin|eq|neq)\b/g, match => `$${match}`);
    queryObj = JSON.parse(queryObj);
  
    const mongooseQuery = UserModel.find(queryObj).limit(limit).skip(skip);
  
    if (req.query.fields) {
        mongooseQuery.select(req.query.fields?.replaceAll(',', ' '))
    }
  
    const users = await mongooseQuery.sort(req.query.sort?.replaceAll(',', ' ')).find({role:'User'});
    return res.status(201).json({ message: 'success', users });
}

export const getSpecificUser = async (req, res, next) => {
    const { userId } = req.params;
    const user = await UserModel.findById(userId);
    if (!user) {
        return next(new Error(` user not found `, { cause: 404 }));
    }
    if (user.role!=='User') {
        return next(new Error("invalid authorization", { cause: 400 }));
    }
    return res.status(200).json({ message: 'success', user })
}

export const getUnConfirmedUsers = async (req, res, next) => { 
    const { limit, skip } = pagination(req.query.page, req.query.limit)

    const unConfirmedUsers = await UserModel.find({ confirmEmail: 'false',role:'User' }).limit(limit).skip(skip);
    if (!unConfirmedUsers) {
        return next(new Error(`error while fetching data`, { cause: 400 }));
    }
    return res.status(200).json({ message: 'success', count: unConfirmedUsers.length, unConfirmedUsers });

}
export const getActiveUsers = async (req, res, next) => { 
    const { limit, skip } = pagination(req.query.page, req.query.limit)

    const activeUsers = await UserModel.find({ confirmEmail: 'true',role:'User' }).limit(limit).skip(skip);
    if (!activeUsers) {
        return next(new Error(`error while fetching data`, { cause: 400 }));
    }
    return res.status(200).json({ message: 'success', count: activeUsers.length, activeUsers }); 
}