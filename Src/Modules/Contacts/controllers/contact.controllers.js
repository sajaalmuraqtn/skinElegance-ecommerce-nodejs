import jwt from 'jsonwebtoken'
 import UserModel from "../../../../DB/model/user.model.js";
 import ContactModel from "../../../../DB/model/contact.model.js";
import { sendEmail } from "../../../Services/email.js";

export const addContact = async (req, res,next) => {
  console.log(req.body);
    const {email, phoneNumber } = req.body;
    if (await ContactModel.findOne({ email: email})) {
        return next(new Error("email Already exist",{cause:409}));
     }
  
    if (await ContactModel.findOne({ phoneNumber:phoneNumber })) {
        return next(new Error("Phone Number Already exist",{cause:409}));
     }
  
     const token = jwt.sign({ email }, process.env.CONFIRMEMAILSECRET);
    await sendEmail(email, "confirm Email", `<a href='${req.protocol}://${req.headers.host}/contact/confirmEmail/${token}'>verify</a>`);
    const user =await UserModel.findById(req.user._id);
    const createdByUser={
        userName:user.userName,
        image:user.image,
        _id:user._id
    } 
    req.body.createdByUser=createdByUser;
    const createContact = await ContactModel.create(req.body);
    if (!createContact) {
        return next(new Error(`error while create Contact `, { cause: 400 }));
    }
    return res.status(201).json({ message: 'success', createContact })
}
  
export const confirmEmail = async (req, res,next) => {
    const token = req.params.token;
    const decoded = await jwt.verify(token, process.env.CONFIRMEMAILSECRET);
    if (!decoded) {
        return next(new Error("invalid token",{cause:404}));
    }
    const user = await ContactModel.findOneAndUpdate({ email: decoded.email, confirmEmail:false },{ confirmEmail: true });
    if (!user) {
        return next(new Error("Invalid Verify Email Or Your Email is Verified",{cause:400 }));
    
    }
    return res.redirect(process.env.LOGINFRONTEND)
    // return res.status(200).json({ message: 'Your Email Verified Successfully' });
}

export const getAllContacts = async (req, res, next) => {
   
    const contacts = await  ContactModel.find();
    return res.status(201).json({ message: 'success', contacts });
}
 
export const getConfirmedContacts = async (req, res, next) => { 
 
    const contacts = await ContactModel.find({ confirmEmail: 'true'  });
    if (!contacts) {
        return next(new Error(`error while fetching data`, { cause: 400 }));
    }
    return res.status(200).json({ message: 'success', contacts }); 
}
 
 
export const deleteUnConfirmedContacts=async(req,res,next)=>{
    const invalidConfirmsContacts=await ContactModel.deleteMany({confirmEmail:false});
    return res.status(201).json({ message: 'success', invalidConfirmsContacts })
    
}

export const deleteContact=async(req,res,next)=>{
    if (!await ContactModel.findById(req.params.contactId)) {
        return next(new Error("Contact not found",{cause:404})); 
    }
    const contact=await ContactModel.findByIdAndDelete(req.params.contactId);
    return res.status(201).json({ message: 'success', contact })
    
}