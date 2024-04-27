import Joi from "joi"
 
export const createOrder= Joi.object(
    {
        couponName: Joi.string().min(3).max(30), 
        phoneNumber: Joi.string().min(10).max(10) ,
        address: Joi.string().min(10).max(100) ,
        city: Joi.string().valid('Hebron','Nablus','Jerusalem','Ramallah','Tulkarm','Jenin','Al-Bireh','Jericho','Yatta','Beit Jala').required(),
        firstName:Joi.string().min(3).max(30).required(),
        lastName:Joi.string().min(3).max(30).required()
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