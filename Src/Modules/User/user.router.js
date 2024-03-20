import { Router } from "express";
import * as UserController from './Controller/user.controller.js'
 import { asyncHandler } from "../../Services/errorHandling.js";
import { auth, roles } from "../../Middleware/auth.js";
import fileUpload, { fileValidation } from "../../Services/multer.js";

const router=Router({mergeParams:true});

router.get('/profile',auth(Object.values(roles)),asyncHandler(UserController.profile))
router.get('/update',auth(Object.values(roles)),fileUpload(fileValidation.image).single('image'),asyncHandler(UserController.updateProfile))

export default router;