import Joi from "joi"
import { generalFieldValidation } from "../../Middleware/validation.js"

export const createProduct = Joi.object(
    {
        name: Joi.string().min(3).max(50).required(),
        description: Joi.string().min(2).max(150000).required(),
        stock: Joi.number().integer().required(),
        price: Joi.number().positive().required(),
        size: Joi.string(),
        discount: Joi.number().positive().min(1),
        file: generalFieldValidation.file.required(),
        status: Joi.string().valid('Active', 'Inactive'),
        categoryId: Joi.string().required().min(24).max(24),
        // subCategoryId: Joi.string().required().min(24).max(24),
        expiredDate: Joi.date().greater('now').required()
    }
)

export const updateProduct = Joi.object(
    {
        name: Joi.string().min(3).max(50),
        description: Joi.string().min(2).max(150000),
        stock: Joi.number().integer().positive(),
        price: Joi.number().positive(),
        size: Joi.string(),
        discount: Joi.number().positive().min(1),
        file: generalFieldValidation.file,
        status: Joi.string().valid('Active', 'Inactive'),
        categoryId: Joi.string().min(24).max(24),
        // subCategoryId: Joi.string().min(24).max(24),
        expiredDate: Joi.date().greater('now'),
        productId: Joi.string().min(24).max(24).required()
    }
)
export const getProductWithCategory = Joi.object(
    {
        categoryId: Joi.string().min(24).max(24).required(),
        page: Joi.number().min(1).positive()
    }
)
// export const getProductWithSubCategory = Joi.object(
//     {
//         categoryId: Joi.string().min(24).max(24).required(),
//         subCategoryId: Joi.string().min(24).max(24).required(),
//         page: Joi.number().min(1).positive()
//     }
// )
export const getSpecificProduct = Joi.object(
    {
        productId: Joi.string().min(24).max(24).required(),
    }
)
export const deleteProduct = Joi.object(
    {
        productId: Joi.string().min(24).max(24).required(),
    }
)

