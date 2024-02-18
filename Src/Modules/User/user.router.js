import { Router } from "express";
import * as UserController from './Controller/user.controller.js'
 import { asyncHandler } from "../../Services/errorHandling.js";
import { auth, roles } from "../../Middleware/auth.js";

const router=Router({mergeParams:true});

router.get('/profile',auth(Object.values(roles)),asyncHandler(UserController.profile))

export default router;