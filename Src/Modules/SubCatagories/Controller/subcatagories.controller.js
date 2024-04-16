import slugify from "slugify";
import CategoryModel from "../../../../DB/model/category.model.js";
import SubCategoryModel from "../../../../DB/model/subCategory.model.js";
import ProductModel from "../../../../DB/model/product.model.js";
import cloudinary from "../../../Services/cloudinary.js";

export const getSubCategory = async (req, res, next) => {
    const categoryId = req.params.categoryId;
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
        return res.status(409).json({ message: `Category not found` });
    }
    const subCatagories = await SubCategoryModel.find({ categoryId });
    return res.status(201).json({ message: "success", subCatagories, category });
}

export const getActiveSubCategory = async (req, res, next) => {
    const categoryId = req.params.categoryId;
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
        return res.status(409).json({ message: `Category not found` });
    }
    const subCatagories = await SubCategoryModel.find({ categoryId, status: 'Active' });
    return res.status(201).json({ message: "success", subCatagories });
}

export const getSpecificSubCategory = async (req, res, next) => {
    const subCategoryId = req.params.subCategoryId;
    const categoryId = req.params.categoryId;
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
        return res.status(409).json({ message: `Category not found` });
    }
    const subCategory = await SubCategoryModel.findById(subCategoryId);
    if (!subCategory) {
        return res.status(409).json({ message: `subCategory not found` });
    }
    return res.status(201).json({ message: "success", subCategory });
}

export const createSubCategory = async (req, res, next) => {
    const SubCategoryName = req.body.name.toLowerCase();
    const categoryId = req.params.categoryId;
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
        return next(new Error("category not found", { cause: 404 }));
    }

    if (await SubCategoryModel.findOne({ name: SubCategoryName })) {
        return next(new Error(`Sub Category Name "${SubCategoryName}" already exist`, { cause: 409 }));
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
        folder: `${process.env.APP_NAME}/${category.name}/SubCategories`
    });
    const user = await UserModel.findById(req.user._id);
    const createdByUser = {
        userName: user.userName,
        image: user.image,
        _id: user._id
    }
    const updatedByUser = {
        userName: user.userName,
        image: user.image,
        _id: user._id
    }
    const subCategory = await SubCategoryModel.create({ name: SubCategoryName, slug: slugify(SubCategoryName), categoryId, image: { secure_url, public_id }, createdBy: req.user._id, categoryName: category.name, updatedBy: req.user._id, createdByUser, updatedByUser })
    return res.status(201).json({ message: "success", subCategory });

}
export const updateSubCategory = async (req, res, next) => {

    const { categoryId } = req.params;
    const { subCategoryId } = req.params;
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
        return next(new Error(` category not found`, { cause: 404 }));
    }
    
    const subCategory = await SubCategoryModel.findById(subCategoryId);
    if (!subCategory) {
        return next(new Error(` subCategory not found`, { cause: 404 }));
    }
    
        const user = await UserModel.findById(req.user._id);
    
        const updatedByUser = {
            userName: user.userName,
            image: user.image,
            _id: user._id
        }
    if (req.body.name) {
        const name = req.body.name.toLowerCase();
        if (await SubCategoryModel.findOne({ name }).select('name')) {
            return next(new Error(`subCategory name '${name}' already exist`, { cause: 409 }));
        }
        subCategory.name = name.toLowerCase();
        subCategory.slug = slugify(subCategory.name);
        const Products = await ProductModel.updateMany({ subCategoryId }, { updatedBy: req.user._id, updatedByUser,subCategoryName:subCategory.name }, { new: true });

    }

    if (req.file) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `${process.env.APP_NAME}/${subCategory.name}/SubCategories`
        })
        await cloudinary.uploader.destroy(subCategory.image.public_id);
        subCategory.image = { secure_url, public_id };
    }
    if (req.body.status) {
        const checkCategory = await CategoryModel.findById(subCategory.categoryId);
        if (req.body.status == "Active" && (checkCategory.isDeleted || checkCategory.status == "Inactive" || checkSubCategory.isDeleted || checkSubCategory.status == "Inactive")) {
            return next(new Error("can not active this sub category, category not available", { cause: 400 }));
        }
        subCategory.status = req.body.status;

        await ProductModel.updateMany({ subCategoryId }, { status: req.body.status, updatedBy: req.user._id, updatedByUser: updatedByUser });
    }
    subCategory.updatedByUser = updatedByUser;
    subCategory.updatedBy = req.user._id;
    await subCategory.save()

    return res.status(201).json({ message: 'success', subCategory });
}

export const restoreSubCategory = async (req, res, next) => {
    const subCategoryId = req.params.subCategoryId;

    const checkSubCategory = await SubCategoryModel.findById(subCategoryId);
    if (!checkSubCategory) {
        return next(new Error(` invalid id ${subCategoryId} `, { cause: 400 }));
    }

    const checkCategory = await CategoryModel.findById(checkSubCategory.categoryId);
    if (checkCategory.isDeleted || checkCategory.status == "Inactive") {
        return next(new Error("can not restore this sub category, category not available", { cause: 400 }));
    }
    const user = await UserModel.findById(req.user._id);

    const updatedByUser = {
        userName: user.userName,
        image: user.image,
        _id: user._id
    }

    const SubCategory = await SubCategoryModel.findByIdAndUpdate(subCategoryId, { isDeleted: false, status: 'Active', updatedBy: req.user._id, updatedByUser }, { new: true });
    const restoreProducts = await ProductModel.updateMany({ subCategoryId }, { isDeleted: false, status: 'Active', updatedBy: req.user._id, updatedByUser }, { new: true });

    return res.status(200).json({ message: 'success', SubCategory, restoreProducts });

}

export const softDeleteSubCategory = async (req, res, next) => {
    const subCategoryId = req.params.subCategoryId;
    const user = await UserModel.findById(req.user._id);

    const updatedByUser = {
        userName: user.userName,
        image: user.image,
        _id: user._id
    }
    const SubCategory = await SubCategoryModel.findByIdAndUpdate(subCategoryId, { isDeleted: true, status: 'Inactive', updatedBy: req.user._id, updatedByUser }, { new: true });
    if (!SubCategory) {
        return next(new Error(` invalid id ${subCategoryId} `, { cause: 400 }));
    }

    const softDeleteProducts = await ProductModel.updateMany({ subCategoryId }, { isDeleted: true, status: 'Inactive', updatedBy: req.user._id, updatedByUser }, { new: true });

    return res.status(200).json({ message: 'success', SubCategory, softDeleteProducts });

}

export const hardDeleteSubCategory = async (req, res, next) => {
    const subCategoryId = req.params.subCategoryId;
    const SubCategory = await SubCategoryModel.findByIdAndDelete(subCategoryId);
    if (!SubCategory) {
        return next(new Error(` invalid id ${subCategoryId} `, { cause: 400 }));
    }
    const hardDeleteProducts = await ProductModel.deleteMany({ subCategoryId });
    return res.status(200).json({ message: 'success', SubCategory, hardDeleteProducts });
}