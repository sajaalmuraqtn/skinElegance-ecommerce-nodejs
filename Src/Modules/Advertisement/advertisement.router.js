import { Router } from "express";
import * as AdvertisementController from './Controller/advertisement.controller.js'
import { auth, roles } from "../../Middleware/auth.js";
 import fileUpload, { fileValidation } from "../../Services/multer.js";
import { asyncHandler } from "../../Services/errorHandling.js";
import { validation } from "../../Middleware/validation.js";
 import * as validators from './advertisement.validation.js'
const router = Router()
 router.get('/', auth(roles.Admin), asyncHandler(AdvertisementController.getAllAdvertisement));
router.get('/:advertisementId', validation(validators.getSpecificAdvertisement), asyncHandler(AdvertisementController.getSpecificAdvertisement));
router.get('/allAdvertisements/active', asyncHandler(AdvertisementController.getActiveAdvertisement));
  router.post('/', auth(roles.Admin), fileUpload(fileValidation.image).fields([{
    name: 'mainImage', maxCount: 1
} , { name: 'subImages', maxCount: 4 }]), validation(validators.createAdvertisement), asyncHandler(AdvertisementController.createAdvertisement));
router.put('/:advertisementId', auth(roles.Admin), fileUpload(fileValidation.image).fields([{
    name: 'mainImage', maxCount: 1
}
    , { name: 'subImages', maxCount: 4 }]), validation(validators.updateAdvertisement), asyncHandler(AdvertisementController.updateAdvertisement));
router.put('/restore/:advertisementId', auth(roles.Admin), asyncHandler(AdvertisementController.restoreAdvertisement));
router.put('/softDelete/:advertisementId', auth(roles.Admin), asyncHandler(AdvertisementController.hardDeleteAdvertisement));
router.delete('/hardDelete/:advertisementId', auth(roles.Admin), asyncHandler(AdvertisementController.softDeleteAdvertisement));
export default router;