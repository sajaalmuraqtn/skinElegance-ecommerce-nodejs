import mongoose, { Schema, Types, model } from "mongoose";

const AdvertisementSchema = new Schema({
    title: {
        type: String, required: true, unique: true, trim: true
    },
    slug: {
        type: String, required: true,
    },
    services: [{
        price: { type: Number, required: true },
        serviceTitle: { type: String, required: true, unique: true },
    }],
    phoneNumber: [{
        type: String, required: true,
    }],
    address: [{
        type: String, required: true,
    }],
    socialMediaLinks: [{
        type: String, required: true,
    }],
    description: {
        type: String, required: true
    }, discount: {
        type: Number, default: 0
    },
    mainImage: {
        type: Object, required: true
    }
    ,
    subImages: [
        {
            type: Object, required: true
        }
    ], address: [{
        type: String, required: true
    }],
    status: {
        type: String, enum: ['Active', 'Inactive'], default: 'Active'
    }, 
    expiredDate: {
        type: Date, required: true
    },
    note: String
    ,
    isDeleted: {
        type: Boolean, default: false
    },
    createdBy: {
        type: Types.ObjectId, ref: 'User', required: true
    },
    updatedBy: {
        type: Types.ObjectId, ref: 'User', required: true
    }

}, {
    timestamps: true
})




const AdvertisementModel = mongoose.models.Advertisement || model('Advertisement', AdvertisementSchema);
export default AdvertisementModel;