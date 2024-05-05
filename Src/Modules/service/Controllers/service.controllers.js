import slugify from "slugify";
import cloudinary from "../../../Services/cloudinary.js";
import { asyncHandler } from "../../../Services/errorHandling.js";
import { pagination } from "../../../Services/pagination.js";
import UserModel from "../../../../DB/model/user.model.js";
import ServiceModel from "../../../../DB/model/service.model.js";
import AdvertisementModel from "../../../../DB/model/advertisement.model.js";

export const getAllServices = async (req, res, next) => {
    const services = await ServiceModel.find({advertisementId: req.params.advertisementId});
    return res.status(201).json({ message: 'success', services });
}

export const getActiveService = async (req, res, next) => {
    const services = await ServiceModel.find({ status: 'Active',advertisementId: req.params.advertisementId });
    return res.status(201).json({ message: 'success', services });

}

export const createService = async (req, res, next) => {
    const { price, discount} = req.body;
    const advertisementId=req.params.advertisementId;
    const checkAdvertisement = await AdvertisementModel.findById(req.params.advertisementId);
   
    if (!checkAdvertisement) {
        return next(new Error("Advertisement not found", { cause: 404 }));
    }
   
    if (checkAdvertisement.status == "Inactive" || checkAdvertisement.isDeleted) {
        return next(new Error("Advertisement is not available", { cause: 400 }));
    }

    req.body.advertisementId = checkAdvertisement._id;
    req.body.advertisementName = checkAdvertisement.name;

    const name = req.body.name.toLowerCase();
    if (await ServiceModel.findOne({ name,advertisementId:advertisementId }).select('name')) {
        return next(new Error("Service name already exist in this Advertisement", { cause: 409 }));
    }
    req.body.slug = slugify(name);

    req.body.finalPrice = (price - (price * (discount || 0) / 100)).toFixed(2);
    
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
        folder: `${process.env.APP_NAME}/Services`
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
    const service = await ServiceModel.create(req.body);
    if (!service) {
        return next(new Error("error while creating service", { cause: 400 }));
    }
    return res.status(201).json({ message: 'success',service });
}

export const updateService = async (req, res, next) => {
    const advertisementId=req.params.advertisementId;

    const service = await ServiceModel.findById(req.params.serviceId);
    if (!service) {
        return next(new Error("service not found", { cause: 404 }));
    }

    if (req.body.name) {
        const name = req.body.name.toLowerCase();
        if (await ServiceModel.findOne({ name,advertisementId:advertisementId }).select('name')) {
            return next(new Error("Service name already exist in this Advertisement", { cause: 409 }));
        }
        req.body.slug = slugify(name);
    }

    if (req.body.description) {
        service.description = req.body.description;
    }

    if (req.body.price) {
        service.price = req.body.price;
        service.finalPrice = (req.body.price - (req.body.price * (discount || 0) / 100)).toFixed(2);
    }

    if (req.body.discount) {
        service.discount = req.body.discount;
        service.finalPrice = (service.price - (service.price * (req.body.discount || 0) / 100)).toFixed(2);
    }
    
    if (req.body.status) {
        const checkAdvertisement = await CategoryModel.findById(service.categoryId);
        if (req.body.status == "Active" && (checkAdvertisement.isDeleted || checkAdvertisement.status == "Inactive" )) {
            return next(new Error("can not active this service advertisement not available", { cause: 400 }));
        }
        service.status = req.body.status;
    }
           

    if (req.file) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `${process.env.APP_NAME}/Services`
        })
        await cloudinary.uploader.destroy(service.mainImage.public_id);
        service.mainImage = { secure_url, public_id };
    }
    

    const user = await UserModel.findById(req.user._id);

    const updatedByUser = {
        userName: user.userName,
        image: user.image,
        _id: user._id
    }
    service.updatedByUser = updatedByUser;
    await service.save()

    return res.status(201).json({ message: 'success', service });
}

export const getSpecificService = async (req, res, next) => {
    const service = await ServiceModel.findById(req.params.serviceId);
    if (!service) {
        return next(new Error("service not found", { cause: 404 }));
    }
    return res.status(201).json({ message: 'success', service });
}

export const restoreService = async (req, res, next) => {
    const checkService = await ServiceModel.findById(req.params.serviceId);
    if (!checkService) {
        return next(new Error("service not found", { cause: 404 }));
    }
    const checkAdvertisement = await AdvertisementModel.findById(checkService.advertisementId);
    if (checkAdvertisement.isDeleted || checkAdvertisement.status == "Inactive") {
        return next(new Error("can not restore this service Advertisement not available", { cause: 400 }));
    }
    const user = await UserModel.findById(req.user._id);

    const updatedByUser = {
        userName: user.userName,
        image: user.image,
        _id: user._id
    }
    const service = await ServiceModel.findByIdAndUpdate(req.params.serviceId, { isDeleted: false, status: 'Active', updatedByUser: updatedByUser }, { new: true });
    return res.status(201).json({ message: 'success',service });
}

export const softDeleteService = async (req, res, next) => {
    const checkService = await ServiceModel.findById(req.params.serviceId);
    if (!checkService) {
        return next(new Error("service not found", { cause: 404 }));
    }

    const user = await UserModel.findById(req.user._id);

    const updatedByUser = {
        userName: user.userName,
        image: user.image,
        _id: user._id
    }
    const service = await ServiceModel.findByIdAndUpdate(req.params.serviceId, { isDeleted: true, status: 'Inactive',updatedByUser: updatedByUser }, { new: true });
    return res.status(201).json({ message: 'success', service });
}

export const hardDeleteService = async (req, res, next) => {
    const checkService = await ServiceModel.findById(req.params.serviceId);
    if (!checkService) {
        return next(new Error("service not found", { cause: 404 }));
    }

    const service = await ServiceModel.findOneAndDelete({ _id: req.params.serviceId, isDeleted: true }, { new: true });
    if (!service) {
        return next(new Error("service not deleted", { cause: 404 }));
    }
    return res.status(201).json({ message: 'success',service });
}

