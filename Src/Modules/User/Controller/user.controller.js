import UserModel from "../../../../DB/model/user.model.js";

 

export const profile=async(req,res,next)=>{
    const user=await UserModel.findById(req.user._id)
    return res.status(201).json({message:"success",user}); 
}
