import Joi from "joi"
import { generalFieldValidation } from "../../Middleware/validation.js"

export const createAdvertisement = Joi.object(
    {
        name: Joi.string().min(3).max(25).required(),
        description: Joi.string().min(2).max(150000).required(),
        stock: Joi.number().integer().required(),
        price: Joi.number().positive().required(),
        size: Joi.number().positive().required(), 
        discount: Joi.number().positive().min(1),
        file: Joi.object({
            mainImage: Joi.array().items(generalFieldValidation.file.required()).length(1),
            subImages: Joi.array().items(generalFieldValidation.file.required()).min(2).max(4)
        }),
        status: Joi.string().valid('Active', 'Inactive'),
        categoryId: Joi.string().required().min(24).max(24),
        subCategoryId: Joi.string().required().min(24).max(24),
        expiredDate: Joi.date().greater('now').required()
    }
)

export const updateAdvertisement = Joi.object(
    {
        name: Joi.string().min(3).max(25),
        description: Joi.string().min(2).max(150000),
        stock: Joi.number().integer().positive(),
        price: Joi.number().positive(),
        size: Joi.number().positive(),
        discount: Joi.number().positive().min(1),
        file: Joi.object({
            mainImage: Joi.array().items(generalFieldValidation.file).length(1),
            subImages: Joi.array().items(generalFieldValidation.file).min(2).max(4)
        }),
        status: Joi.string().valid('Active', 'Inactive'),
        categoryId: Joi.string().min(24).max(24),
        subCategoryId: Joi.string().min(24).max(24),
        expiredDate: Joi.date().greater('now'),
        advertisementId: Joi.string().min(24).max(24).required()
    }
)
 
export const getSpecificAdvertisement = Joi.object(
    {
        advertisementId: Joi.string().min(24).max(24).required(),
    }
)

