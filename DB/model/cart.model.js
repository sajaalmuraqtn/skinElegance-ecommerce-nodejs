import mongoose, { Schema, Types, model } from "mongoose";

const CartSchema=new Schema({
    userId:{
        type:Types.ObjectId,ref:'User',required:true
    },
    products:[
        {
            productId:{ type:Types.ObjectId,ref:'Product',required:true},
            quantity:{type:Number,default:1,required:true},
            price:{type:Number ,required:true}
          
        }
    ],
    totalPrice: {
        type:Number,default:1,required:true
    }

},{
    timestamps:true
})
 
const CartModel=mongoose.models.Cart || model('Cart',CartSchema);
export default CartModel;