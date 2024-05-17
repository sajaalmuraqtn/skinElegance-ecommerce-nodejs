import CartModel from "../../../../DB/model/cart.model.js";
import CouponModel from "../../../../DB/model/coupon.model.js";
import OrderModel from "../../../../DB/model/order.model.js";
import ProductModel from "../../../../DB/model/product.model.js";
import UserModel from "../../../../DB/model/user.model.js";
import moment from 'moment';
import { pagination } from "../../../Services/pagination.js";
import ContactModel from "../../../../DB/model/contact.model.js";

export const createOrder = async (req, res, next) => {
    const cart = await CartModel.findOne({ userId: req.user._id });
    if (!cart) {
        return next(new Error("cart is Empty", { cause: 400 }))
    }
    if (cart.products.length == 0) {
        return next(new Error("cart is Empty", { cause: 400 }))
    }
    req.body.products = cart.products;
    const currentDate = new Date();

    if (req.body.couponName) {
        const coupon = await CouponModel.findOne({ name: req.body.couponName.toLowerCase() });
        if (!coupon) {
            return next(new Error("coupon not found", { cause: 404 }));
        }

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
            stock: { $gte: product.quantity },
            status:"Active",
            expiredDate: { $gt:currentDate } ,
            isDeleted:'false'
        
        })
        console.log(checkProduct);
        if (!checkProduct) {
            return next(new Error( `product '${product.name}' quantity not available`, { cause: 400 }));
        }
        product = product.toObject();
        product.name = checkProduct.name;
        product.slug = checkProduct.slug;
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
        note: req.body.note ?? ''
    })
    if (req.body.coupon) {
        await CouponModel.updateOne({ _id: req.body.coupon._id }, { $addToSet: { usedBy: req.user._id } })
    }
    for (const product of req.body.products) {
        await ProductModel.updateOne({ _id: product.productId }, { $inc: { stock: -product.quantity, number_sellers: 1 } })
    }
    await CartModel.updateOne({ userId: req.user._id }, {
        products: [],
        totalPrice: 0
    })

    return res.status(201).json({ message: 'success', order });
}

export const getAllOrders = async (req, res, next) => {
    const { limit, skip } = pagination(req.query.page, req.query.limit);

    let queryObj = { ...req.query };
    const execQuery = ['page', 'limit', 'skip', 'sort', 'search', 'fields'];
    execQuery.map((ele) => {
        delete queryObj[ele];
    })
    queryObj = JSON.stringify(queryObj);
    queryObj = queryObj.replace(/\b(gt|gte|lt|lte|in|nin|eq|neq)\b/g, match => `$${match}`);
    queryObj = JSON.parse(queryObj);

    const mongooseQuery = OrderModel.find(queryObj).limit(limit).skip(skip);
    if (req.query.search) {
        mongooseQuery.find({
            $or: [
                { status: { $regex: req.query.search, $options: 'i' } },
                { city: { $regex: req.query.search, $options: 'i' } }
            ]
        });
    }
    if (req.query.fields) {
        mongooseQuery.select(req.query.fields?.replaceAll(',', ' '))
    }

    const orders = await mongooseQuery.sort(req.query.sort?.replaceAll(',', ' '));
    return res.status(201).json({ message: "success", orders });
}

export const getMyOrders = async (req, res, next) => {
    const { limit, skip } = pagination(req.query.page, req.query.limit);

    let queryObj = { ...req.query };
    const execQuery = ['page', 'limit', 'skip', 'sort', 'search', 'fields'];
    execQuery.map((ele) => {
        delete queryObj[ele];
    })
    queryObj = JSON.stringify(queryObj);
    queryObj = queryObj.replace(/\b(gt|gte|lt|lte|in|nin|eq|neq)\b/g, match => `$${match}`);
    queryObj = JSON.parse(queryObj);

    const mongooseQuery = OrderModel.find(queryObj).limit(limit).skip(skip);
    if (req.query.search) {
        mongooseQuery.find({
            $or: [
                { status: { $regex: req.query.search, $options: 'i' } }
            ]
        });
    }
    if (req.query.fields) {
        mongooseQuery.select(req.query.fields?.replaceAll(',', ' '))
    }

    const orders = await mongooseQuery.find({ userId: req.user._id }).sort(req.query.sort?.replaceAll(',', ' '));
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

export const updateStatusOrder = async (req, res, next) => {
    const orderId = req.params.orderId;
    const order = await OrderModel.findById(orderId);
    if (!order) {
        return next(new Error(`order not found`, { cause: 404 }));
    }

    if (order.status == 'cancelled' || order.status == 'delivered') {
        return next(new Error(` can not change status this order `, { cause: 404 }));
    }

    if (order.status !== 'confirmed' && req.body.status == 'onWay') {
        return next(new Error(` can not change status its should be confirmed `, { cause: 404 }));
    }

    if (order.status !== 'onWay' && req.body.status == 'delivered') {
        return next(new Error(` can not change status its should be onWay `, { cause: 404 }));
    }
    const user = await UserModel.findById(req.user._id);

    req.body.updatedByUser = {
        userName: user.userName,
        image: user.image,
        _id: user._id
    }
    const newOrder = await OrderModel.findByIdAndUpdate(orderId, req.body, { new: true });
    return res.status(201).json({ message: "success", order: newOrder });
}

export const addContactsOrder = async (req, res, next) => {
    const orderId = req.params.orderId;
    try {
        const order = await OrderModel.findById(orderId);
        if (!order) {
            return next(new Error(`Order not found`, { cause: 404 }));
        }
        if (order.status != 'confirmed' && order.status != 'onWay') {
            return next(new Error(` can not add contact the order should be confirmed or onWay `, { cause: 409 }));
        }
        const user = await UserModel.findById(req.user._id);
        order.updatedByUser = {
            userName: user.userName,
            image: user.image,
            _id: user._id
        };
        const addedContact = await ContactModel.findOne({ _id: req.body.contactId, confirmEmail: "true" });
        if (!addedContact) {
            return next(new Error(`Contact not found`, { cause: 404 }));
        }
        const contact = {
            adminEmail: addedContact.email,
            adminPhoneNumber: addedContact.phoneNumber,
            _id: addedContact._id
        }

        order.contact = contact;

        // Save the updated order document
        await order.save();

        return res.status(201).json({ message: "Success", order });
    } catch (error) {
        return next(error);
    }
};


export const cancelOrder = async (req, res, next) => {
    const orderId = req.params.orderId;
    const order = await OrderModel.findOne({ _id: orderId });

    if (!order) {
        return next(new Error(`Invalid order`, { cause: 404 }));
    }

    // Calculate the difference in days between the current time and the order's creation time
    const orderCreationTime = moment(order.createdAt);
    const currentTime = moment();
    const daysDifference = currentTime.diff(orderCreationTime, 'days');

    // Check if the order is older than 3 days
    if (daysDifference > 3) {
        return next(new Error(`Cannot cancel order: more than 3 days have passed since its creation`, { cause: 403 }));
    }

    if (order.status !== 'pending') {
        return next(new Error(`Cannot cancel order: order status is not pending`, { cause: 403 }));
    }

    req.body.status = 'cancelled';

    const user = await UserModel.findById(req.user._id);

    req.body.updatedByUser = {
        userName: user.userName,
        image: user.image,
        _id: user._id
    }

    for (const product of order.products) {
        await ProductModel.updateOne({ _id: product.productId }, { $inc: { stock: product.quantity, number_sellers: -1 } });
    }

    if (order.couponName) {
        await CouponModel.updateOne({ name: order.couponName }, { $pull: { usedBy: req.user._id } });
    }

    const newOrder = await OrderModel.findByIdAndUpdate(orderId, req.body, { new: true });
    return res.status(200).json({ message: "Order canceled successfully", newOrder });
}


export const confirmOrder = async (req, res, next) => {
    const orderId = req.params.orderId;
    const order = await OrderModel.findOne({ _id: orderId });

    if (!order) {
        return next(new Error(`Invalid order`, { cause: 404 }));
    }

    // Calculate the difference in days between the current time and the order's creation time
    const orderCreationTime = moment(order.createdAt);
    const currentTime = moment();
    const daysDifference = currentTime.diff(orderCreationTime, 'days');

    // Check if the order is older than 3 days
    if (daysDifference < 3) {
        return next(new Error(`Cannot confirm order: less than 3 days have passed since its creation`, { cause: 403 }));
    }

    if (order.status == 'cancelled') {
        return next(new Error(`Cannot confirm order the order is cancelled`, { cause: 403 }));
    }

    if (order.status !== 'pending') {
        return next(new Error(`Cannot confirm order: order status is not pending`, { cause: 403 }));
    }

    req.body.status = 'confirmed';
    const user = await UserModel.findById(req.user._id);

    req.body.updatedByUser = {
        userName: user.userName,
        image: user.image,
        _id: user._id
    }
    const newOrder = await OrderModel.findByIdAndUpdate(orderId, req.body, { new: true });
    return res.status(200).json({ message: "Order Confirmed successfully", newOrder });
}
