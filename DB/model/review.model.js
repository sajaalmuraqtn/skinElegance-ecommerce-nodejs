import mongoose, { Schema, Types, model } from "mongoose";

const ReviewsSchema=new Schema({
    comment:{
        type:String, required:true
    },
    rating:{
        type: Number, required:true
     },
     orderId:{
        type:Types.ObjectId,ref:'Order' 
     }
     ,
    productId:{
        type:Types.ObjectId,ref:'Product' 
    }
    ,
    createdBy:{
        type:Types.ObjectId,ref:'User' 
    }

},{
    timestamps:true
})

const ReviewModel=mongoose.models.Review || model('Review',ReviewsSchema);
export default ReviewModel;