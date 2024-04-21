import FavoriteModel from "../../../../DB/model/favourite.model.js";
import ProductModel from "../../../../DB/model/product.model.js";

export const createFavorite = async (req, res, next) => {
    const products = req.body; // new product that that we want to add
    const product = await ProductModel.findById(products.productId);// product information from product model    
    if (!product) {
        return next(new Error("product not found", { cause: 404 }));
    }
    products.price = product.finalPrice;
    products.mainImage = product.mainImage;
    products.productName = product.name;
    products.productSlug = product.slug;


    const Favorite = await FavoriteModel.findOne({ userId: req.user._id });
    if (!Favorite) {
        const newFavorite = await FavoriteModel.create({
            userId: req.user._id,
            products
        });
        return res.status(201).json({ message: 'success', newFavorite });
    }

    for (let index = 0; index < Favorite.products.length; index++) {
        if (Favorite.products[index].productId == products.productId) {
            return next(new Error("product Already exist in your favorite list", { cause: 409 }));
        }
    }

    Favorite.products.push(products);
    await Favorite.save();
    return res.status(201).json({ message: 'success', Favorite });

}

export const removeItem = async (req, res, next) => {
    const { productId } = req.body;
    const Favorite = await FavoriteModel.findOne({ userId: req.user._id });
    if (!Favorite || Favorite.products.length == 0) {
        return next(new Error(" your favorite list is empty", { cause: 409 }));
    }
    let matched = false;
    for (let index = 0; index < Favorite.products.length; index++) {
        if (Favorite.products[index].productId == productId) {
            console.log(Favorite.products[index].productId);
            console.log(matched);
            matched = true;
            break;
        }
    }
    if (matched) {
        const updateFavorite = await FavoriteModel.findOneAndUpdate({ userId: req.user._id }, {
            $pull:
            {
                products: { productId }
            },
        }, { new: true });
        return res.status(201).json({ message: 'success', updateFavorite });
    }
    return next(new Error("product not exist in your favorite list", { cause: 409 }));
}

export const clearFavorite = async (req, res, next) => {
    const Favorite = await FavoriteModel.findOneAndDelete({ userId: req.user._id });

    return res.status(200).json({ message: 'success', Favorite });
}

export const getFavorite = async (req, res, next) => {
    const Favorite = await FavoriteModel.findOne({ userId: req.user._id });
    if (!Favorite) {
        return next(new Error("you do not have a Favorite list yet", { cause: 404 }));
    }
    return res.status(201).json({ message: 'success', Favorite });
}


