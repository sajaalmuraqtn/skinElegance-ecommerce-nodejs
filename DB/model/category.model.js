import mongoose, { Schema, Types, model } from "mongoose";

const CategorySchema=new Schema({
    name:{
        type:String, required:true, unique:true
    },
    slug:{
        type:String, required:true,
    },
    image:{
        type:Object
    },
    status:{
        type:String, enum:['Active','Inactive'], default:'Active'
    } ,
    isDeleted:{
        type:Boolean, default:false
    },
    createdBy:{
        type:Types.ObjectId,ref:'User',required:true
    },
    updatedBy:{
        type:Types.ObjectId,ref:'User',required:true
    }

},{
    timestamps:true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
})
CategorySchema.virtual('subCategories',{
    localField:'_id',
    foreignField:'categoryId',
     ref:'SubCategory'
 });
const CategoryModel=mongoose.models.Category || model('Category',CategorySchema);
export default CategoryModel;