import PaymentMethodModel from "../../../../DB/model/paymentmethod.model.js";
import UserModel from "../../../../DB/model/user.model.js";


export const createPaymentMethod = async (req, res, next) => {
    const Payment = await PaymentMethodModel.findOne({
        'createdByUser._id': req.user._id,
        'cardDetails.cardNumber': req.body.cardNumber
    });
    
    if (Payment) {
        return next(new Error("Payment card already exists", { cause: 400 }));
    }

    const user = await UserModel.findById(req.user._id);

    const createdByUser = {
        userName: user.userName,
        image: user.image,
        _id: user._id
    }

    const cardDetails = {
        cardNumber: req.body.cardNumber,
        cardType: req.body.cardType,
        expiryDate: req.body.expiryDate,
        cvc: req.body.cvc,
        cardholderName: req.body.cardholderName
    }

    
    const paymentMethod = await PaymentMethodModel.create({ createdByUser,cardDetails});

    return res.status(201).json({ message: 'success', paymentMethod }) ;
}

export const getPaymentMethod = async (req, res, next) => {
    const PaymentMethods = await PaymentMethodModel.find({
        'createdByUser._id': req.user._id,
        'cardDetails.cardNumber': req.body.cardNumber
    });
     
    return res.status(201).json({ message: 'success', PaymentMethods }) ;
}

export const getSpecificPaymentMethod = async (req, res, next) => {
    const paymentMethod = await PaymentMethodModel.findById(req.params.paymentMethodId);
    
    if (!Payment) {
        return next(new Error("Payment card Not Found", { cause: 404 }));
    } 
     
    return res.status(201).json({ message: 'success', paymentMethod }) ;
}