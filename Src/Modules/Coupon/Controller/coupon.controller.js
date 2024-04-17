import CouponModel from "../../../../DB/model/coupon.model.js";
import UserModel from "../../../../DB/model/user.model.js";
import cloudinary from "../../../Services/cloudinary.js";

export const CreateCoupon = async (req, res, next) => {
  req.body.name = req.body.name.toLowerCase();
  if (await CouponModel.findOne({ name: req.body.name })) {
    return next(new Error("coupon name already exist", { cause: 409 }));
  }
  req.body.expiredDate = new Date(req.body.expiredDate);
  
  const user =await UserModel.findById(req.user._id);
  const createdByUser={
      userName:user.userName,
      image:user.image,
      _id:user._id
  }
  const updatedByUser={
      userName:user.userName,
      image:user.image,
      _id:user._id
  }   

req.body.createdByUser=createdByUser;
  req.body.updatedByUser=updatedByUser;
  const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
    folder: `${process.env.APP_NAME}/coupons`
  })
  
  req.body.image = { secure_url, public_id };

  const coupon = await CouponModel.create(req.body);
  return res.status(201).json({ message: 'success', coupon });
}

export const GetSpecificCoupons = async (req, res, next) => {
  const coupon = await CouponModel.findById(req.params.couponId);
  if (!coupon) {
    return next(new Error("coupon not found", { cause: 404 }));

  }
  return res.status(200).json({ message: 'success', coupon });
}

export const GetAllCoupons = async (req, res, next) => {
  const coupons = await CouponModel.find();
  return res.status(200).json({ message: 'success', coupons });
}

export const getActiveCoupons = async (req, res, next) => {
  const coupons = await CouponModel.find({ isDeleted: false });
  return res.status(200).json({ message: 'success', coupons });
}

export const UpdateCoupon = async (req, res, next) => {

  const couponId = req.params.couponId;
  const coupon = await CouponModel.findById(couponId);

  if (!coupon) {
    return next(new Error("coupon not found", { cause: 404 }));
  }
  if (req.body.name) {
    const name = req.body.name.toLowerCase();

    if (await CouponModel.findOne({ name }).select('name')) {
      return next(new Error(`coupon name '${req.body.name}' already exist`, { cause: 409 }));
    }
    coupon.name = name;
  }

  if (req.body.amount) {
    coupon.amount = req.body.amount;
  }
  if (req.body.expiredDate) {
    coupon.expiredDate = req.body.expiredDate;
  }

  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
      folder: `${process.env.APP_NAME}/coupons`
    })
    await cloudinary.uploader.destroy(coupon.image.public_id);
    coupon.image = { secure_url, public_id };
  }

  const user =await UserModel.findById(req.user._id);

  const updatedByUser={
      userName:user.userName,
      image:user.image,
      _id:user._id
  } 
  coupon.updatedByUser = updatedByUser;

  await coupon.save()
  return res.status(200).json({ message: 'success', coupon });

}

export const SoftDelete = async (req, res, next) => {
  const couponId = req.params.couponId;
  if (! await CouponModel.findById(couponId)) {
    return res.status(404).json({ message: 'coupon not found' });
  }
  const user =await UserModel.findById(req.user._id);

  const updatedByUser={
      userName:user.userName,
      image:user.image,
      _id:user._id
  } 
  const coupon = await CouponModel.findOneAndUpdate({ _id: couponId, isDeleted: false }, { isDeleted: true,updatedByUser}, { new: true });
  if (!coupon) {
    return res.status(400).json({ message: 'can not delete this coupon ' });
  }
  return res.status(200).json({ message: 'success', coupon });

}

export const HardDelete = async (req, res, next) => {
  const couponId = req.params.couponId;
  if (! await CouponModel.findById(couponId)) {
    return res.status(404).json({ message: 'coupon not found' });
  }
  const coupon = await CouponModel.findOneAndDelete({ _id: couponId, isDeleted: true }, { new: true });
  if (!coupon) {
    return res.status(400).json({ message: 'can not delete this coupon ' });
  }
  return res.status(200).json({ message: 'success', coupon });
}


export const Restore = async (req, res, next) => {
  const couponId = req.params.couponId;
  if (! await CouponModel.findById(couponId)) {
    return res.status(404).json({ message: 'coupon not found' });
  }
  const user =await UserModel.findById(req.user._id);

  const updatedByUser={
      userName:user.userName,
      image:user.image,
      _id:user._id
  } 
  const coupon = await CouponModel.findOneAndUpdate({ _id: couponId, isDeleted: true }, { isDeleted: false,updatedByUser }, { new: true });
  if (!coupon) {
    return res.status(400).json({ message: 'can not restore this coupon ' });
  }
  return res.status(200).json({ message: 'success', coupon });

}