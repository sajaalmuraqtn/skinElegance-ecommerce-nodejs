import { Router } from "express";
import * as AuthController from './Controller/auth.controller.js'
import fileUpload, { fileValidation } from "../../Services/multer.js";
import { asyncHandler } from "../../Services/errorHandling.js";
const router=Router();

router.post('/signUp',fileUpload(fileValidation.image).single('image'),asyncHandler(AuthController.signUp));
router.post('/signIn',asyncHandler(AuthController.signIn));
router.get('/confirmEmail/:token',asyncHandler(AuthController.confirmEmail));
router.patch('/sendCode',asyncHandler(AuthController.sendCode));
router.patch('/forgotPassword',asyncHandler(AuthController.forgotPassword));
router.delete('/deleteInvalidConfirm',asyncHandler(AuthController.deleteInvalidConfirm));



export default router;