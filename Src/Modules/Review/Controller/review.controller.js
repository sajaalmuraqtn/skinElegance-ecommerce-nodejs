import OrderModel from "../../../../DB/model/order.model.js";
import ReviewModel from "../../../../DB/model/review.model.js";

export const createReview = async (req, res, next) => {
    const { productId } = req.params;
    const { comment, rating } = req.body;
    const order = await OrderModel.findOne({
        userId: req.user._id,
        status: 'delivered',
        "products.productId": productId
    });
    if (!order) {
        return next(new Error(" can not review this product", { cause: 400 }));
    }
    const checkReview = await ReviewModel.findOne({
        createdBy: req.user._id,
        productId: productId.toString()
    });

    if (checkReview) {
        return next(new Error("already review", { cause: 400 }));
    }
    const review = await ReviewModel.create({
        comment,
        rating,
        createdBy: req.user._id,
        orderId:order._id,
        productId:productId.toString()
    });
    if (!review) {
        return next(new Error("error while adding review", { cause: 400 }));
    }
    return res.status(201).json({ message: 'success', review });

}