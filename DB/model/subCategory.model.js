import mongoose, { Schema, Types, model } from "mongoose";

const SubCategorySchema = new Schema({
    name: {
        type: String, required: true, unique: true
    },
    slug: {
        type: String, required: true,
    },
    image: {
        type: Object
    },
    status: {
        type: String, enum: ['Active', 'Inactive'], default: 'Active'
    },
    isDeleted: {
        type: Boolean, default: false
    },
    categoryName: {
        type: String,
        required: true
    },

    categoryId: {
        type: Types.ObjectId, ref: 'Category'
    }
    ,
    createdBy: {
        type: Types.ObjectId, ref: 'User'
    },
    updatedBy: {
        type: Types.ObjectId, ref: 'User'
    }

}, {
    timestamps: true
});



const SubCategoryModel = mongoose.models.SubCategory || model('SubCategory', SubCategorySchema);
export default SubCategoryModel;