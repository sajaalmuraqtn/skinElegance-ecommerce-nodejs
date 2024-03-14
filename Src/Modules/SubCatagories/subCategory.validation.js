import Joi from "joi"
import { generalFieldValidation } from "../../Middleware/validation.js"

export const createSubCategory= Joi.object(
    {
        categoryId: Joi.string().required().min(24).max(24),
        status: Joi.string().valid('Active', 'Inactive'), 
        name: Joi.string().required().min(5).max(20),
        file:generalFieldValidation.file.required()
    }
   )
export const updateSubCategory= Joi.object(
    {
        categoryId: Joi.string().required().min(24).max(24),
        subCategoryId: Joi.string().required().min(24).max(24),
        name: Joi.string().min(5).max(20),
        status: Joi.string().valid('Active', 'Inactive'), 
        file:generalFieldValidation.file 
    }
   )
export const getActiveSubCategory= Joi.object(
    {
        categoryId: Joi.string().required().min(24).max(24),
 
    }
   )
export const getSpecificSubCategory= Joi.object(
    {
         subCategoryId: Joi.string().required().min(24).max(24), 
    }
   )
export const deleteSubCategory= Joi.object(
    {
        categoryId: Joi.string().required().min(24).max(24), 
        subCategoryId: Joi.string().required().min(24).max(24)  
    }
   )
