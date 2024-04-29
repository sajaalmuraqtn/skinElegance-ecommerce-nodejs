import Joi from "joi"
 
export const createOrder= Joi.object(
    {
        firstName:Joi.string().min(3).max(30),
        lastName:Joi.string().min(3).max(30),
        couponName: Joi.string().min(3).max(30), 
        phoneNumber: Joi.string().min(10).max(10),
        note: Joi.string().min(10).max(100),
        address: Joi.string().min(10).max(100),
        city: Joi.string().valid('Hebron','Nablus','Jerusalem','Ramallah','Tulkarm','Jenin','Al-Bireh','Jericho','Yatta','Beit Jala'),
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