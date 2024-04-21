import CartModel from "../../../../DB/model/cart.model.js";
import ProductModel from "../../../../DB/model/product.model.js";

export const createCart = async (req, res, next) => {
    const products = req.body; // new product that that we want to add
    const product = await ProductModel.findById(products.productId);// product information from product model    
    if (!product) {
        return next(new Error("product not found", { cause: 404 }));
    }
    products.price = product.finalPrice * products.quantity;
    products.mainImage=product.mainImage;
    products.productName=product.name;
    products.productSlug=product.slug;

    const cart = await CartModel.findOne({ userId: req.user._id });
    if (!cart) {
        const newCart = await CartModel.create({
            userId: req.user._id,
            products,
            totalPrice: products.price
        });
        return res.status(201).json({ message: 'success', newCart });
    }

    let matched = false;
    for (let index = 0; index < cart.products.length; index++) {
        if (cart.products[index].productId == products.productId) {
            products.quantity= cart.products[index].quantity+products.quantity;
            cart.products[index].quantity = products.quantity;
            cart.products[index].price = products.price * products.quantity;
            matched = true;
            break;
        }
    }
    if (!matched) {
        cart.products.push(products);
    }
    let totalPrice = 0;
    for (let index = 0; index < cart.products.length; index++) {
        totalPrice = totalPrice + cart.products[index].price;
    }
    cart.totalPrice = totalPrice; 
    await cart.save();
    return res.status(201).json({ message: 'success', cart });

}

export const removeItem = async (req, res, next) => {
    const { productId } = req.body;
    const cart = await CartModel.findOneAndUpdate({ userId: req.user._id }, {
        $pull:
        {
            products: { productId }
        },
    },{new:true});
    let totalPrice = 0;
    for (let index = 0; index < cart.products.length; index++) {
        totalPrice = totalPrice + cart.products[index].price;
    }
    cart.totalPrice = totalPrice; 
    await cart.save();   
 
    return res.status(201).json({ message: 'success', cart });
}

export const clearCart = async (req, res, next) => {
    const cart = await CartModel.findOneAndUpdate({ userId: req.user._id }, { products: [] });
    let totalPrice = 0;
    for (let index = 0; index < cart.products.length; index++) {
        totalPrice = totalPrice + cart.products[index].price;
    }
    cart.totalPrice = totalPrice; 
    await cart.save();   

    return res.status(200).json({ message: 'success', cart });
}

export const getCart = async (req, res, next) => {
    const cart = await CartModel.findOne({ userId: req.user._id });
    if (!cart) {
        return next(new Error("you do not have a cart yet", { cause: 404 }));
    }
    return res.status(201).json({ message: 'success', cart });
}


