import mongoose, { Schema, Types, model } from "mongoose";

const CouponSchema = new Schema({
    name: {
        type: String, required: true, unique: true
    },
    amount: {
        type: Number, required: true
    }, 
    image:{
        type:Object, required: true
    }, user:{type:Object,required:true},

    usedBy: [
        {
            type: Types.ObjectId, ref: 'User'
        }
    ],
    isDeleted: {
        type: Boolean, default: false
    }
    ,
    expiredDate: {
        type: Date, required: true
    },  
    createdByUser:{type:Object},
    updatedByUser:{type:Object},

    createdBy: {
        type: Types.ObjectId, ref: 'User'
    },
    updatedBy: {
        type: Types.ObjectId, ref: 'User'
    }

}, {
    timestamps: true
})



const CouponModel = mongoose.models.Coupon || model('Coupon', CouponSchema);
export default CouponModel;