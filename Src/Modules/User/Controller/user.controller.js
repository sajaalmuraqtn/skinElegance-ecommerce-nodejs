import UserModel from "../../../../DB/model/user.model.js";
import cloudinary from "../../../Services/cloudinary.js";

  
export const profile=async(req,res,next)=>{
    const user=await UserModel.findById(req.user._id)
    return res.status(201).json({message:"success",user}); 
}

export const updateProfile=async(req,res,next)=>{
    const user=await UserModel.findById(req.user._id)
    if (req.body.userName) {
        user.userName=req.body.userName;
    }
    if (req.body.phoneNumber) {
        user.phoneNumber=req.body.phoneNumber;
    }
    if (req.body.address) {
        user.phoneNumber=req.body.address;
    }
    if (req.body.gender) {
        user.gender=req.body.gender;
    } 
     
    if (req.file) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `${process.env.APP_NAME}/User`
        })
        await cloudinary.uploader.destroy(user.image.public_id);
        user.image = { secure_url, public_id };
    }

    await subCategory.save() 
 
    return res.status(201).json({message:"success",user}); 
}

