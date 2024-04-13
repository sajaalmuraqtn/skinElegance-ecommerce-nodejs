import slugify from "slugify";

import CategoryModel from "../../../../DB/model/category.model.js";
import cloudinary from "../../../Services/cloudinary.js";
import { pagination } from "../../../Services/pagination.js"; 
 import ProductModel from "../../../../DB/model/product.model.js";
import SubCategoryModel from "../../../../DB/model/subCategory.model.js";

export const getCatagories = async (req, res, next) => {
    const { limit, skip } = pagination(req.query.page, req.query.limit);
    const categories = await CategoryModel.find().limit(limit).skip(skip).populate('subCategories');
    return res.status(201).json({ message: 'success', categories })
}

export const getSpecificCategory = async (req, res, next) => {
    const { categoryId } = req.params;
    const category = await CategoryModel.findOne({ _id: categoryId }).populate('subCategories');
    if (!category) {
        return next(new Error(` category not found `, { cause: 404 }));
    }
    return res.status(200).json({ message: 'success', category })
}

export const getActiveCategory = async (req, res, next) => {
   
    const { limit, skip } = pagination(req.query.page, 6)

    const activeCatagories = await CategoryModel.find({ status: 'Active' }).limit(limit).skip(skip).populate('subCategories');
    return res.status(200).json({ message: 'success', count: activeCatagories.length, activeCatagories });

}

export const createCategory = async (req, res, next) => {
          const name = req.body.name.toLowerCase();
        if (await CategoryModel.findOne({ name }).select('name')) {
            return next(new Error("category name already exist", { cause: 409 }));
        }

        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `${process.env.APP_NAME}/categories`
        })

        const category = await CategoryModel.create({ name: name, slug: slugify(name), image: { secure_url, public_id }, createdBy: req.user._id, updatedBy: req.user._id })
        return res.status(201).json({ message: 'success', category });
 
}

export const updateCategory = async (req, res, next) => {
    const { categoryId } = req.params;
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
        return next(new Error(` invalid id ${id} `, { cause: 400 }));
    }

    if (req.body.name) {
        const name = req.body.name.toLowerCase();
        if (await CategoryModel.findOne({ name }).select('name')) {
            return next(new Error(`category name '${name}' already exist`, { cause: 409 }));
        }
        category.name = name;
        category.slug = slugify(name);
    }

    if (req.file) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `${process.env.APP_NAME}/categories`
        })
        await cloudinary.uploader.destroy(category.image.public_id);
        category.image = { secure_url, public_id };
    }
    if (req.body.status) {
        category.status = req.body.status;
         await SubCategoryModel.updateMany({categoryId},{ status:req.body.status,updatedBy:req.user._id} ); 
         await ProductModel.updateMany({categoryId},{ status:req.body.status,updatedBy:req.user._id} );
        
    }
    category.updatedBy = req.user._id;
    await category.save()

    return res.status(201).json({ message: 'success', category });

}

export const restoreCategory = async (req, res, next) => {
    const categoryId  = req.params.categoryId;
    const category = await CategoryModel.findByIdAndUpdate(categoryId,{isDeleted:false,status:'Active',updatedBy:req.user._id},{new:true});
    if (!category) {
        return next(new Error(` invalid id ${categoryId} `, { cause: 400 }));
    }
    const  restoreSubCategory=await SubCategoryModel.updateMany({categoryId},{isDeleted:false,status:'Active',updatedBy:req.user._id} ); 
    const restoreProducts= await ProductModel.updateMany({categoryId},{isDeleted:false,status:'Active',updatedBy:req.user._id} );
    
    return res.status(200).json({ message: 'success', category,restoreSubCategory,restoreProducts }); 
}

export const softDeleteCategory = async (req, res, next) => {
    const categoryId  = req.params.categoryId;
    const category = await CategoryModel.findByIdAndUpdate(categoryId,{isDeleted:true,status:'Inactive',updatedBy:req.user._id},{new:true});
    if (!category) {
        return next(new Error(` invalid id ${categoryId} `, { cause: 400 }));
    }
    const softDeleteSubCategory=await SubCategoryModel.updateMany({categoryId},{isDeleted:true,status:'Inactive',updatedBy:req.user._id} ); 
    const softDeleteProducts= await ProductModel.updateMany({categoryId},{isDeleted:true,status:'Inactive',updatedBy:req.user._id} );
    
    return res.status(200).json({ message: 'success', category,softDeleteSubCategory,softDeleteProducts }); 
}

export const hardDeleteCategory = async (req, res, next) => {
    const categoryId  = req.params.categoryId;
    const category = await CategoryModel.findByIdAndDelete(categoryId);
    if (!category) {
        return next(new Error(` invalid id ${categoryId} `, { cause: 400 }));
    }
    const hardDeleteSubCategory= await ProductModel.deleteMany({categoryId}) ;
    const hardDeleteProducts= await SubCategoryModel.deleteMany({categoryId});  
    return res.status(200).json({ message: 'success', category,hardDeleteSubCategory,hardDeleteProducts }); 
}