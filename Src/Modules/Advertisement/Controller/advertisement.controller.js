import slugify from "slugify";
import CategoryModel from "../../../../DB/model/category.model.js";
import SubCategoryModel from "../../../../DB/model/subCategory.model.js";
import cloudinary from "../../../Services/cloudinary.js";
import AdvertisementModel from "../../../../DB/model/advertisement.model.js";
import { asyncHandler } from "../../../Services/errorHandling.js";
import { pagination } from "../../../Services/pagination.js";

export const getAllAdvertisement = async (req, res, next) => {

    const { limit, skip } = pagination(req.query.page, req.query.limit);

    let queryObj = { ...req.query };
    const execQuery = ['page', 'limit', 'skip', 'sort', 'search', 'fields'];
    execQuery.map((ele) => {
        delete queryObj[ele];
    })
    queryObj = JSON.stringify(queryObj);
    queryObj = queryObj.replace(/\b(gt|gte|lt|lte|in|nin|eq|neq)\b/g, match => `$${match}`);
    queryObj = JSON.parse(queryObj);

    const mongooseQuery = AdvertisementModel.find(queryObj).limit(limit).skip(skip);
    if (req.query.search) {
        mongooseQuery.find({
            $or: [
                { title: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ]
        })
    }
    if (req.query.fields) {
        mongooseQuery.select(req.query.fields?.replaceAll(',', ' '))
    }

    const advertisements = await mongooseQuery.sort(req.query.sort?.replaceAll(',', ' '));
    const count = await AdvertisementModel.estimatedDocumentCount();
    return res.status(201).json({ message: 'success', page: advertisements.length, total: count, advertisements });

}

export const getActiveAdvertisement = async (req, res, next) => {

    const { limit, skip } = pagination(req.query.page, req.query.limit);
    const currentDate = new Date();

    let queryObj = { ...req.query };
    const execQuery = ['page', 'limit', 'skip', 'sort', 'search', 'fields'];
    execQuery.map((ele) => {
        delete queryObj[ele];
    })
    queryObj = JSON.stringify(queryObj);
    queryObj = queryObj.replace(/\b(gt|gte|lt|lte|in|nin|eq|neq)\b/g, match => `$${match}`);
    queryObj = JSON.parse(queryObj);

    const mongooseQuery = AdvertisementModel.find(queryObj).limit(limit).skip(skip);
    if (req.query.search) {
        mongooseQuery.find({
            $or: [
                { title: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ]
        });
    }
    if (req.query.fields) {
        mongooseQuery.select(req.query.fields?.replaceAll(',', ' '))
    }

    const advertisements = await mongooseQuery.sort(req.query.sort?.replaceAll(',', ' ')).find({ status: 'Active', expiredDate: { $gt: currentDate } 
});
    const count = await AdvertisementModel.estimatedDocumentCount();
    return res.status(201).json({ message: 'success', page: advertisements.length, total: count, advertisements });

}

export const createAdvertisement = async (req, res, next) => {
 
    const title = req.body.title.toLowerCase();
    if (await AdvertisementModel.findOne({ title }).select('title')) {
        return next(new Error("advertisement title already exist", { cause: 409 }));
    }
    req.body.title=title;
    req.body.slug = slugify(title);

    req.body.finalPrice = (price - (price * (discount || 0) / 100)).toFixed(2);

    const { secure_url, public_id } = await cloudinary.uploader.upload(req.files.mainImage[0].path, { folder: `${process.env.APP_NAME}/advertisement/mainImage` });
    req.body.mainImage = { secure_url, public_id };
    req.body.subImages = [];
    for (const file of req.files.subImages) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, { folder: `${process.env.APP_NAME}/advertisement/subImages` });
        req.body.subImages.push({ secure_url, public_id });
    }
    req.body.createdBy = req.user._id;
    req.body.updatedBy = req.user._id;
    const advertisement = await AdvertisementModel.create(req.body);
    if (!advertisement) {
        return next(new Error("error while creating advertisement", { cause: 400 }));
    }
    return res.status(201).json({ message: 'success', advertisement });
}

export const updateAdvertisement = async (req, res, next) => {

    const advertisement = await AdvertisementModel.findById(req.params.advertisementId);
    if (!advertisement) {
        return next(new Error("advertisement not found", { cause: 404 }));
    } 

    if (req.body.title) {
        const title = req.body.title.toLowerCase();
        if (await AdvertisementModel.findOne({ title }).select('title')) {
            return next(new Error("advertisement title already exist", { cause: 409 }));
        }
        advertisement.title = title;
        advertisement.slug = slugify(title);
    }
    if (req.body.description) {
        advertisement.description = req.body.description;
    }

    if (req.body.price) {
        advertisement.price = req.body.price;
        advertisement.finalPrice = (req.body.price - (req.body.price * (discount || 0) / 100)).toFixed(2);
    }

    if (req.body.discount) {
        advertisement.discount = req.body.discount;
        advertisement.finalPrice = (advertisement.price - (advertisement.price * (req.body.discount || 0) / 100)).toFixed(2);
    }

    if (req.body.size) {
        advertisement.size = req.body.size;
    }

    if (req.body.expiredDate) {
        advertisement.expiredDate = req.body.expiredDate;
    }

    if (req.body.status) {
        const checkCategory=await CategoryModel.findById(advertisement.categoryId);
        const checkSubCategory=await CategoryModel.findById(advertisement.subCategoryId);
        if ( req.body.status=="Active" && (checkCategory.isDeleted || checkCategory.status=="Inactive" || checkSubCategory.isDeleted || checkSubCategory.status=="Inactive")) {
            return next(new Error("can not active this advertisement category or sub category not available", { cause: 400 }));
        } 
        advertisement.status = req.body.status;
    }

    if (req.file) {
        if (req.files.mainImage[0]) {
            await cloudinary.uploader.destroy(advertisement.mainImage.public_id);
            const { secure_url, public_id } = await cloudinary.uploader.upload(req.files.mainImage[0].path, { folder: `${process.env.APP_NAME}/advertisement/mainImage` });
            advertisement.mainImage = { secure_url, public_id };
        }

        if (req.files.subImages) {
            for (const file of advertisement.subImages) {
                await cloudinary.uploader.destroy(file.public_id);
            }
            for (const file of req.files.subImages) {
                const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, { folder: `${process.env.APP_NAME}/advertisement/subImages` });
                advertisement.subImages.push({ secure_url, public_id });
            }
        }
    }

    advertisement.updatedBy = req.user._id;
    await advertisement.save()

    return res.status(201).json({ message: 'success', advertisement });
}
 
 

export const getSpecificAdvertisement = async (req, res, next) => {
    const advertisement = await AdvertisementModel.findById(req.params.advertisementId) ;
     if (!advertisement) {
        return next(new Error("advertisement not found", { cause: 404 }));
    }

    return res.status(201).json({ message: 'success', advertisement });
}

export const restoreAdvertisement = async (req, res, next) => {
    const checkAdvertisement = await AdvertisementModel.findById(req.params.advertisementId);
    if (!checkAdvertisement) {
        return next(new Error("advertisement not found", { cause: 404 }));
    }
     
    const advertisement = await AdvertisementModel.findByIdAndUpdate(req.params.advertisementId, { isDeleted: false, status: 'Active',updatedBy:req.user._id }, { new: true });
    return res.status(201).json({ message: 'success', advertisement });
}
export const softDeleteAdvertisement = async (req, res, next) => {
    const advertisement = await AdvertisementModel.findByIdAndUpdate(req.params.advertisementId, { isDeleted: true, status: 'Inactive',updatedBy:req.user._id }, { new: true });
    if (!advertisement) {
        return next(new Error("advertisement not found", { cause: 404 }));
    } 
    return res.status(201).json({ message: 'success', advertisement });
}

export const hardDeleteAdvertisement = async (req, res, next) => {
    const advertisement = await AdvertisementModel.findByIdAndDelete(req.params.advertisementId);
    if (!advertisement) {
        return next(new Error("advertisement not found", { cause: 404 }));
    } 
    return res.status(201).json({ message: 'success', advertisement });
}







