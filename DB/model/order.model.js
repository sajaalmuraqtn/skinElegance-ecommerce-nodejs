import mongoose, { Schema, Types, model } from "mongoose";
import multer from "multer";

const OrderSchema=new Schema({
    userId:{
        type:Types.ObjectId,ref:'User',required:true
    },products:[{
        productId:{type:Types.ObjectId,ref:'Product',required:true},
        name:{type:String,required:true}, 
        quantity:{type:Number,default:1,required:true},
        unitPrice:{type:Number,required:true},
        finalPrice:{type:Number,required:true}
    }],
     contacts:[{
        type:Types.ObjectId,ref:'User' ,
        phoneNumber:String
    }],
    finalPrice:{
        type: Number, required:true
     },
     address:{
        type:String,required:true
     },
     phoneNumber:{
        type:String,required:true
     },
    couponName:{
        type:String, 
        required:true
    },
    paymentType:{
        type:String, default:'cash'
    },
    status:{
        type:String,default:'pending',
        enum:['pending','cancelled','confirmed','onWay','delivered']
    },
    reasonRejected:String,
    note:String
    ,
    updatedBy:{
        type:Types.ObjectId,ref:'User' 
    }

},{
    timestamps:true
})



const OrderModel=mongoose.models.Order || model('Order',OrderSchema);
export default OrderModel;