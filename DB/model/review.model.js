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
    }  ,
    createdByUser: {
        image: Object,
        _id: { type: Types.ObjectId, ref: 'User',required:true},
        userName: String
    },
},{
    timestamps:true
})

const ReviewModel=mongoose.models.Review || model('Review',ReviewsSchema);
export default ReviewModel;