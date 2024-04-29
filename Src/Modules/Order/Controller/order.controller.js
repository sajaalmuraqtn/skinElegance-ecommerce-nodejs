import CartModel from "../../../../DB/model/cart.model.js";
import CouponModel from "../../../../DB/model/coupon.model.js";
import OrderModel from "../../../../DB/model/order.model.js";
import ProductModel from "../../../../DB/model/product.model.js";
import UserModel from "../../../../DB/model/user.model.js";

export const createOrder = async (req, res, next) => {
    const cart = await CartModel.findOne({ userId: req.user._id }); 
    if (!cart) {
        return next(new Error("cart is Empty", { cause: 400 }))
    }
    if (cart.products.length == 0) {
        return next(new Error("cart is Empty", { cause: 400 }))
    }
    req.body.products = cart.products;
 
    if (req.body.couponName) {
        const coupon = await CouponModel.findOne({ name: req.body.couponName.toLowerCase() });
        if (!coupon) {
            return next(new Error("coupon not found", { cause: 404 }));
        }
        const currentDate = new Date();

        if (coupon.expiredDate <= currentDate) {
            return next(new Error("this coupon has expired", { cause: 400 })); 
        }

        if (coupon.usedBy.includes(req.user._id)) {
            return next(new Error(" coupon already used", { cause: 400 })); 
        }
    }

    let subTotals = 0;
    let finalProductList = [];
    for (let product of req.body.products) {
        const checkProduct = await ProductModel.findOne({
            _id: product.productId,
            stock: { $gte: product.quantity }
        })
        console.log(checkProduct);
        if (!checkProduct) {
            return next(new Error(" product quantity not available", { cause: 400 }));
        }
        product = product.toObject();
        product.name = checkProduct.name;
        product.unitPrice = checkProduct.price;
        product.discount = checkProduct.discount;
        product.finalPrice = product.quantity * checkProduct.finalPrice;

        subTotals += product.finalPrice;
        finalProductList.push(product);

    }
    const user = await UserModel.findById(req.user._id);

    if (!req.body.address) {
        req.body.address = user.address;
    }
    if (!req.body.phoneNumber) {
        req.body.phoneNumber = user.phoneNumber;
    }
    if (req.body.note) {
        req.body.note = user.phoneNumber;
    }
    const order = await OrderModel.create({
        userId: req.user._id,
        products: finalProductList,
        finalPrice: subTotals - (subTotals * (req.body.couponName?.amount || 0) / 100),
        address: req.body.address,
        phoneNumber: req.body.phoneNumber,
        couponName: req.body.couponName ?? '',
        city: req.body.city,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        note: req.body.note?? ''
    })
    if (req.body.coupon) {
        await CouponModel.updateOne({ _id: req.body.coupon._id }, { $addToSet: { usedBy: req.user._id } })
    }
    for (const product of req.body.products) {
        await ProductModel.updateOne({ _id: product.productId }, { $inc: { stock: -product.quantity } })
    }
    await CartModel.updateOne({ userId: req.user._id }, {
        products: [],
        totalPrice:0
    })

    return res.status(201).json({ message: 'success', order }); 
}

export const getAllOrders = async (req, res, next) => {
    
    const orders = await OrderModel.find( ); 
    return res.status(201).json({ message: "success", orders });
}

export const getMyOrders = async (req, res, next) => {
    const orders = await OrderModel.find({ userId: req.user._id });
    if (!orders) {
        return next(new Error(` invalid order `, { cause: 404 }));
    }
    return res.status(201).json({ message: "success", orders });
}

export const getSpecificOrder = async (req, res, next) => {
    const order = await OrderModel.findById(req.params.orderId);
    if (!order) {
        return next(new Error(` order not found `, { cause: 404 }));
    }
    return res.status(201).json({ message: "success", order });
}

export const updateOrder = async (req, res, next) => {
    const orderId = req.params.orderId; 
    const order = await OrderModel.findById(orderId);
    if (!order) {
        return next(new Error(`order not found`, { cause: 404 }));
    }
    if (order.status == 'cancelled' || order.status == 'delivered') {
        return next(new Error(` can not cancelled this order `, { cause: 404 }));
    }
    const newOrder = await OrderModel.findByIdAndUpdate(orderId, { status: req.body.status, updatedBy: req.user._id }, { new: true });
 
    if (req.body.phoneNumber) {
        await CouponModel.updateOne({ name: order.couponName }, { $push: { contacts:req.body.phoneNumber } })
    }
    return res.status(201).json({ message: "success", order: newOrder });
}

export const cancelOrder = async (req, res, next) => {
    const orderId = req.params.orderId;
    const order = await OrderModel.findOne({ _id: orderId, userId: req.user._id });

    if (!order) {
        return next(new Error(` invalid order `, { cause: 404 }));
    }

    if (order.status != 'pending') {
        return next(new Error(` can not cancel order `, { cause: 404 }));
    }
    req.body.status = 'cancelled';
    req.body.updatedBy = req.user._id;
    for (const product of order.products) {
        await ProductModel.updateOne({ _id: product.productId }, { $inc: { stock: product.quantity } })
    }
    if (order.couponName) {
        await CouponModel.updateOne({ name: order.couponName }, { $pull: { usedBy: req.user._id } })
    }
    const newOrder = await OrderModel.findByIdAndUpdate(orderId, req.body, { new: true });
    return res.status(201).json({ message: "success", newOrder });
} 