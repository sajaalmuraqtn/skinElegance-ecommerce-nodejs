import Joi from "joi"
import { generalFieldValidation } from "../../Middleware/validation.js"
 
export const createOrder= Joi.object(
    {
        firstName:Joi.string().min(3).max(30).required(),
        lastName:Joi.string().min(3).max(30).required(),
        couponName: Joi.string().min(3).max(30), 
        phoneNumber: Joi.string().min(10).max(10),
        note: Joi.string().min(10).max(100),
        address: Joi.string().min(10).max(100),
        city: Joi.string().valid('Hebron','Nablus','Jerusalem','Ramallah','Tulkarm','Jenin','Al-Bireh','Jericho','Yatta','Beit Jala').required()
     }
   )


export const addContactsOrder= Joi.object(
    {
        orderId:Joi.string().required().min(24).max(24),
        adminPhoneNumber: Joi.string().min(10).max(10).required() , 
        adminEmail:generalFieldValidation.email, 
    }
)

export const updateStatusOrder= Joi.object(
    {
        orderId:Joi.string().required().min(24).max(24),
        status: Joi.string().valid('onWay','delivered').required(),  
    }
)

export const cancelOrder = Joi.object(
    { 
        orderId:Joi.string().required().min(24).max(24),
        reasonRejected:Joi.string().required().min(24).max(50) 
    }
   )
export const confirmOrder = Joi.object(
    { 
        orderId:Joi.string().required().min(24).max(24)
    }
   )

export const getSpecificOrders= Joi.object(
    { 
        orderId:Joi.string().required().min(24).max(24)
    }
   ) 