import slugify from "slugify";
import CategoryModel from "../../../../DB/model/category.model.js";
import SubCategoryModel from "../../../../DB/model/subCategory.model.js";
import cloudinary from "../../../Services/cloudinary.js";
import ProductModel from "../../../../DB/model/product.model.js";
import { asyncHandler } from "../../../Services/errorHandling.js";
import { pagination } from "../../../Services/pagination.js";

export const getAllProduct = async (req, res, next) => {

    const { limit, skip } = pagination(req.query.page, req.query.limit);

    let queryObj = { ...req.query };
    const execQuery = ['page', 'limit', 'skip', 'sort', 'search', 'fields'];
    execQuery.map((ele) => {
        delete queryObj[ele];
    })
    queryObj = JSON.stringify(queryObj);
    queryObj = queryObj.replace(/\b(gt|gte|lt|lte|in|nin|eq|neq)\b/g, match => `$${match}`);
    queryObj = JSON.parse(queryObj);

    const mongooseQuery = ProductModel.find(queryObj).limit(limit).skip(skip);
    if (req.query.search) {
        mongooseQuery.find({
            $or: [
                { name: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ]
        })
    }
    if (req.query.fields) {
        mongooseQuery.select(req.query.fields?.replaceAll(',', ' '))
    }

    const products = await mongooseQuery.sort(req.query.sort?.replaceAll(',', ' '));
    const count = await ProductModel.estimatedDocumentCount();
    return res.status(201).json({ message: 'success', page: products.length, total: count, products });

}
export const getActiveProduct = async (req, res, next) => {

    const { limit, skip } = pagination(req.query.page, req.query.limit);

    let queryObj = { ...req.query };
    const execQuery = ['page', 'limit', 'skip', 'sort', 'search', 'fields'];
    execQuery.map((ele) => {
        delete queryObj[ele];
    })
    queryObj = JSON.stringify(queryObj);
    queryObj = queryObj.replace(/\b(gt|gte|lt|lte|in|nin|eq|neq)\b/g, match => `$${match}`);
    queryObj = JSON.parse(queryObj);

    const mongooseQuery = ProductModel.find(queryObj).limit(limit).skip(skip);
    if (req.query.search) {
        mongooseQuery.find({
            $or: [
                { name: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ]
        });
    }
    if (req.query.fields) {
        mongooseQuery.select(req.query.fields?.replaceAll(',', ' '))
    }

    const products = await mongooseQuery.sort(req.query.sort?.replaceAll(',', ' ')).find({ status: 'Active' });
    const count = await ProductModel.estimatedDocumentCount();
    return res.status(201).json({ message: 'success', page: products.length, total: count, products });

}

export const createProduct = async (req, res, next) => {

    const { price, discount, categoryId, subCategoryId } = req.body;

    const checkCategory = await CategoryModel.findById(categoryId);
    if (!checkCategory) {
        return next(new Error("category not found", { cause: 404 }));
    }
    if (checkCategory.status == "Inactive" || checkCategory.isDeleted) {
        return next(new Error("category is not available", { cause: 400 }));
    }
    const checkSubCategory = await SubCategoryModel.findOne({ _id: subCategoryId, categoryId });
    if (!checkSubCategory) {
        return next(new Error("sub category not found", { cause: 404 }));
    }
    if (checkSubCategory.status == "Inactive" || checkSubCategory.isDeleted) {
        return next(new Error("subcategory is not available", { cause: 400 }));
    }
     req.body.categoryName=checkCategory.name;
    const name = req.body.name.toLowerCase();
    if (await ProductModel.findOne({ name }).select('name')) {
        return next(new Error("product name already exist", { cause: 409 }));
    }
    req.body.slug = slugify(name);

    req.body.finalPrice = (price - (price * (discount || 0) / 100)).toFixed(2);

    const { secure_url, public_id } = await cloudinary.uploader.upload(req.files.mainImage[0].path, { folder: `${process.env.APP_NAME}/product/mainImage` });
    req.body.mainImage = { secure_url, public_id };
    req.body.subImages = [];
    for (const file of req.files.subImages) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, { folder: `${process.env.APP_NAME}/product/subImages` });
        req.body.subImages.push({ secure_url, public_id });
    }
    req.body.createdBy = req.user._id;
    req.body.updatedBy = req.user._id;
    const product = await ProductModel.create(req.body);
    if (!product) {
        return next(new Error("error while creating product", { cause: 400 }));
    }
    return res.status(201).json({ message: 'success', product });
}

export const updateProduct = async (req, res, next) => {

    const product = await ProductModel.findById(req.params.productId);
    if (!product) {
        return next(new Error("product not found", { cause: 404 }));
    }
    if (req.body.categoryId) {
        const checkCategory = await CategoryModel.findById(req.body.categoryId);
        if (!checkCategory) {
            return next(new Error("category not found", { cause: 404 }));
        }
        if (checkCategory.status == "Inactive" || checkCategory.isDeleted) {
            return next(new Error("category is not available", { cause: 400 }));
        }
        product.categoryId = req.body.categoryId;
    }

    if (req.body.subCategoryId) {
        const checkSubCategory = await SubCategoryModel.findOne({ _id: req.body.subCategoryId, categoryId: product.categoryId });
        if (!checkSubCategory) {
            return next(new Error("sub category not found", { cause: 404 }));
        }
        if (checkSubCategory.status == "Inactive" || checkSubCategory.isDeleted) {
            return next(new Error("subcategory is not available", { cause: 400 }));
        }
        product.subCategoryId = req.body.subCategoryId;
    }


    if (req.body.name) {
        const name = req.body.name.toLowerCase();
        if (await ProductModel.findOne({ name }).select('name')) {
            return next(new Error("product name already exist", { cause: 409 }));
        }
        product.name = name;
        product.slug = slugify(name);
    }
    if (req.body.description) {
        product.description = req.body.description;
    }

    if (req.body.price) {
        product.price = req.body.price;
        product.finalPrice = (req.body.price - (req.body.price * (discount || 0) / 100)).toFixed(2);
    }

    if (req.body.discount) {
        product.discount = req.body.discount;
        product.finalPrice = (product.price - (product.price * (req.body.discount || 0) / 100)).toFixed(2);
    }

    if (req.body.size) {
        product.size = req.body.size;
    }

    if (req.body.expiredDate) {
        product.expiredDate = req.body.expiredDate;
    }
    if (req.body.status) {
        const checkCategory=await CategoryModel.findById(product.categoryId);
        const checkSubCategory=await CategoryModel.findById(product.subCategoryId);
        if ( req.body.status=="Active" && (checkCategory.isDeleted || checkCategory.status=="Inactive" || checkSubCategory.isDeleted || checkSubCategory.status=="Inactive")) {
            return next(new Error("can not active this product category or sub category not available", { cause: 400 }));
        } 
        product.status = req.body.status;
    }

    if (req.file) {
        if (req.files.mainImage[0]) {
            await cloudinary.uploader.destroy(product.mainImage.public_id);
            const { secure_url, public_id } = await cloudinary.uploader.upload(req.files.mainImage[0].path, { folder: `${process.env.APP_NAME}/product/mainImage` });
            product.mainImage = { secure_url, public_id };
        }

        if (req.files.subImages) {
            for (const file of product.subImages) {
                await cloudinary.uploader.destroy(file.public_id);
            }
            for (const file of req.files.subImages) {
                const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, { folder: `${process.env.APP_NAME}/product/subImages` });
                product.subImages.push({ secure_url, public_id });
            }
        }
    }

    product.updatedBy = req.user._id;
    await product.save()

    return res.status(201).json({ message: 'success', product });
}

export const getProductWithCategory = async (req, res, next) => {

    const checkCategory = await CategoryModel.findById(req.params.categoryId);
    if (!checkCategory) {
        return next(new Error("category not found", { cause: 404 }));
    }

    const { limit, skip } = pagination(req.query.page, req.query.limit);

    let queryObj = { ...req.query };
    const execQuery = ['page', 'limit', 'skip', 'sort', 'search', 'fields'];
    execQuery.map((ele) => {
        delete queryObj[ele];
    })
    queryObj = JSON.stringify(queryObj);
    queryObj = queryObj.replace(/\b(gt|gte|lt|lte|in|nin|eq|neq)\b/g, match => `$${match}`);
    queryObj = JSON.parse(queryObj);

    const mongooseQuery = ProductModel.find(queryObj).limit(limit).skip(skip);
    if (req.query.search) {
        mongooseQuery.find({
            $or: [
                { name: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ]
        });
    }
    if (req.query.fields) {
        mongooseQuery.select(req.query.fields?.replaceAll(',', ' '))
    }

    const products = await mongooseQuery.sort(req.query.sort?.replaceAll(',', ' ')).find({ categoryId: req.params.categoryId, status: 'Active' });
    const count = await ProductModel.estimatedDocumentCount();
    return res.status(201).json({ message: 'success', page: products.length, total: count, products });
}

export const getProductWithSubCategory = async (req, res, next) => {

    const checkCategory = await CategoryModel.findById(req.params.categoryId);
    if (!checkCategory) {
        return next(new Error("category not found", { cause: 404 }));
    }

    const checkSubCategory = await SubCategoryModel.findById(req.params.subCategoryId);
    if (!checkSubCategory) {
        return next(new Error("sub category not found", { cause: 404 }));
    }

    const { limit, skip } = pagination(req.query.page, req.query.limit);

    let queryObj = { ...req.query };
    const execQuery = ['page', 'limit', 'skip', 'sort', 'search', 'fields'];
    execQuery.map((ele) => {
        delete queryObj[ele];
    })
    queryObj = JSON.stringify(queryObj);
    queryObj = queryObj.replace(/\b(gt|gte|lt|lte|in|nin|eq|neq)\b/g, match => `$${match}`);
    queryObj = JSON.parse(queryObj);

    const mongooseQuery = ProductModel.find(queryObj).limit(limit).skip(skip);
    if (req.query.search) {
        mongooseQuery.find({
            $or: [
                { name: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ]
        });
    }
    if (req.query.fields) {
        mongooseQuery.select(req.query.fields?.replaceAll(',', ' '))
    }

    const products = await mongooseQuery.sort(req.query.sort?.replaceAll(',', ' ')).find({ categoryId: req.params.categoryId, subCategoryId: req.params.subCategoryId, status: 'Active' });
    const count = await ProductModel.estimatedDocumentCount();
    return res.status(201).json({ message: 'success', page: products.length, total: count, products });
}

export const getSpecificProduct = async (req, res, next) => {
    const product = await ProductModel.findById(req.params.productId).populate('reviews');
     if (!product) {
        return next(new Error("product not found", { cause: 404 }));
    }

    return res.status(201).json({ message: 'success', product });
}

export const restoreProduct = async (req, res, next) => {
    const checkProduct = await ProductModel.findById(req.params.productId);
    if (!checkProduct) {
        return next(new Error("product not found", { cause: 404 }));
    }
    const checkCategory=await CategoryModel.findById(checkProduct.categoryId);
    const checkSubCategory=await SubCategoryModel.findById(checkProduct.subCategoryId);
    if ( checkCategory.isDeleted || checkCategory.status=="Inactive" || checkSubCategory.isDeleted || checkSubCategory.status=="Inactive") {
        return next(new Error("can not restore this product category or sub category not available", { cause: 400 }));
    }

    const product = await ProductModel.findByIdAndUpdate(req.params.productId, { isDeleted: false, status: 'Active',updatedBy:req.user._id }, { new: true });
    return res.status(201).json({ message: 'success', product });
}
export const softDeleteProduct = async (req, res, next) => {
    const product = await ProductModel.findByIdAndUpdate(req.params.productId, { isDeleted: true, status: 'Inactive',updatedBy:req.user._id }, { new: true });
    return res.status(201).json({ message: 'success', product });
}

export const hardDeleteProduct = async (req, res, next) => {
    const product = await ProductModel.findByIdAndDelete(req.params.productId);
    return res.status(201).json({ message: 'success', product });
}

