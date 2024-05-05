import slugify from "slugify";
import cloudinary from "../../../Services/cloudinary.js";
import AdvertisementModel from "../../../../DB/model/advertisement.model.js";
import { pagination } from "../../../Services/pagination.js";
import ServiceModel from "../../../../DB/model/service.model.js";
import UserModel from "../../../../DB/model/user.model.js";

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

    const advertisements = await mongooseQuery.sort(req.query.sort?.replaceAll(',', ' ')).populate('Services');
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

    const advertisements = await mongooseQuery.sort(req.query.sort?.replaceAll(',', ' ')).find({ status: 'Active', expiredDate: { $gt: currentDate } }).populate('Services');
    const count = await AdvertisementModel.estimatedDocumentCount();
    return res.status(201).json({ message: 'success', page: advertisements.length, total: count, advertisements });
}

export const createAdvertisement = async (req, res, next) => {
    
     const name = req.body.name.toLowerCase();   
     if (await AdvertisementModel.findOne({ name })) {
         return next(new Error("advertisement name already exist", { cause: 409 }));
     }
     req.body.name=name;
     req.body.slug = slugify(name);
 
 
     const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
         folder: `${process.env.APP_NAME}/advertisements`
     })
     req.body.mainImage={ secure_url, public_id };
 
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
 
     req.body.createdByUser = createdByUser;
     req.body.updatedByUser = updatedByUser;
     console.log(req.body);
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
    const user = await UserModel.findById(req.user._id);

    const updatedByUser = {
        userName: user.userName,
        image: user.image,
        _id: user._id
    }

    if (req.body.name) {
        const name = req.body.name.toLowerCase();
        if (await AdvertisementModel.findOne({ name }).select('name')) {
            return next(new Error("advertisement name already exist", { cause: 409 }));
        }
        advertisement.name = name;
        advertisement.slug = slugify(name);
    }
    if (req.body.description) {
        advertisement.description = req.body.description;
    }

    if (req.body.instagramLink) {
        advertisement.instagramLink = req.body.instagramLink;
    }

    if (req.body.facebookLink) {
        advertisement.facebookLink = req.body.facebookLink;
    }

    if (req.body.expiredDate) {
        advertisement.expiredDate = req.body.expiredDate;
    }

    if (req.body.status) {
        advertisement.status = req.body.status;
        await ServiceModel.updateMany({advertisementId:req.params.advertisementId},{status:req.body.status,updatedByUser:updatedByUser});
    }

    if (req.file) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `${process.env.APP_NAME}/advertisements`
        })
        await cloudinary.uploader.destroy(advertisement.mainImage.public_id);
        advertisement.mainImage = { secure_url, public_id };
    }

    advertisement.updatedByUser=updatedByUser;
    await advertisement.save()

    return res.status(201).json({ message: 'success', advertisement });
}
 
 

export const getSpecificAdvertisement = async (req, res, next) => {
    const advertisement = await AdvertisementModel.findById(req.params.advertisementId).populate('Services') ;
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
    const user = await UserModel.findById(req.user._id);

    const updatedByUser = {
        userName: user.userName,
        image: user.image,
        _id: user._id
    }
    const advertisement = await AdvertisementModel.findByIdAndUpdate(req.params.advertisementId, { isDeleted: false, status: 'Active',updatedByUser }, { new: true });
    await ServiceModel.updateMany({advertisementId:req.params.advertisementId}, { isDeleted: false, status: 'Active',updatedByUser}, { new: true });
    return res.status(201).json({ message: 'success', advertisement });
}

export const softDeleteAdvertisement = async (req, res, next) => {
    const user = await UserModel.findById(req.user._id);

    const updatedByUser = {
        userName: user.userName,
        image: user.image,
        _id: user._id
    }

    const advertisement = await AdvertisementModel.findByIdAndUpdate(req.params.advertisementId, { isDeleted: true, status: 'Inactive',updatedByUser}, { new: true });
    if (!advertisement) {
        return next(new Error("advertisement not found", { cause: 404 }));
    } 
    
    await ServiceModel.updateMany({advertisementId:req.params.advertisementId}, { isDeleted: true, status: 'Inactive',updatedByUser}, { new: true });
    return res.status(201).json({ message: 'success', advertisement });
}

export const hardDeleteAdvertisement = async (req, res, next) => {
    const advertisement = await AdvertisementModel.findByIdAndDelete(req.params.advertisementId);
    if (!advertisement) {
        return next(new Error("advertisement not found", { cause: 404 }));
    } 
    await ServiceModel.deleteMany({advertisementId:req.params.advertisementId});
    return res.status(201).json({ message: 'success', advertisement });
}







