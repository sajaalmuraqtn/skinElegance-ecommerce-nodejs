import mongoose, { Schema, Types, model } from "mongoose";

const CategorySchema = new Schema({
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
    },createdByUser: {
        image: Object,
        _id: { type: Types.ObjectId, ref: 'User' },
        userName: String
    },
    updatedByUser: {
        image: Object,
        _id: { type: Types.ObjectId, ref: 'User' },
        userName: String
    },

    isDeleted: {
        type: Boolean, default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})
CategorySchema.virtual('subCategories', {
    localField: '_id',
    foreignField: 'categoryId',
    ref: 'SubCategory'
});
const CategoryModel = mongoose.models.Category || model('Category', CategorySchema);
export default CategoryModel;