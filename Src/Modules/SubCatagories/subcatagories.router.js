import { Router } from "express";
import * as SubCatagoriesController from './Controller/subcatagories.controller.js'
import { validation } from "../../Middleware/validation.js";
import * as validators from "./subCategory.validation.js";
import fileUpload, { fileValidation } from "../../Services/multer.js";
import { asyncHandler } from "../../Services/errorHandling.js";
import { auth, roles } from "../../Middleware/auth.js";


const router=Router({mergeParams:true});

router.post('/create',auth(roles.Admin),fileUpload(fileValidation.image).single('image'),validation(validators.createSubCategory),asyncHandler(SubCatagoriesController.createSubCategory));
router.get('/',auth(roles.Admin),validation(validators.getActiveSubCategory),asyncHandler(SubCatagoriesController.getSubCategory));
router.get('/active',validation(validators.getActiveSubCategory),asyncHandler(SubCatagoriesController.getActiveSubCategory));
router.get('/:subCategoryId',auth(roles.Admin),validation(validators.updateSubCategory),asyncHandler(SubCatagoriesController.getSpecificSubCategory));
router.put('/update/:subCategoryId',auth(roles.Admin),fileUpload(fileValidation.image).single('image'),validation(validators.updateSubCategory),asyncHandler(SubCatagoriesController.updateSubCategory));
router.put('/restore/:subCategoryId',auth(roles.Admin),validation(validators.deleteSubCategory),asyncHandler(SubCatagoriesController.restoreSubCategory));
router.put('/softDelete/:subCategoryId',auth(roles.Admin),validation(validators.deleteSubCategory),asyncHandler(SubCatagoriesController.softDeleteSubCategory));
router.delete('/hardDelete/:subCategoryId',auth(roles.Admin),validation(validators.deleteSubCategory) ,asyncHandler(SubCatagoriesController.hardDeleteSubCategory));

export default router;