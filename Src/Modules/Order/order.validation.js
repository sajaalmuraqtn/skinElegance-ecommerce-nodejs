import Joi from "joi"
 
export const createOrder= Joi.object(
    {
        couponName: Joi.string().min(3).max(30).required(), 
        phoneNumber: Joi.string().min(10).max(10) ,
        address: Joi.string().min(10).max(100) ,
     }
   )

export const updateOrder= Joi.object(
    {
        couponName: Joi.string().min(3).max(30).required(), 
        phoneNumber: Joi.string().min(10).max(10) , 
        status: Joi.string().valid( 'confirmed','onWay','delivered'),  
     }
   )

export const cancelOrder = Joi.object(
    { 
        orderId:Joi.string().required().min(24).max(24),
        reasonRejected:Joi.string().required().min(24).max(50) 
    }
   )

export const getSpecificOrders= Joi.object(
    { 
        orderId:Joi.string().required().min(24).max(24)
    }
   ) 