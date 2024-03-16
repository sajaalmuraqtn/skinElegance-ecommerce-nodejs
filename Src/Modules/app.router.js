import { globalErrorHandler } from '../Services/errorHandling.js'

import AuthRouter from './Auth/auth.router.js'
import UserRouter from './User/user.router.js'
import CatagoriesRouter from './Catagories/catagories.router.js'
import SubCatagoriesRouter from './SubCatagories/subcatagories.router.js'
import ProductRouter from './Product/product.router.js'
import CouponRouter from './Coupon/coupon.router.js'
import CartRouter from './Cart/cart.router.js' 

import ConnectDB from '../../DB/connection.js';

const initApp=(app,express)=>{

app.use(express.json());

app.get('/',(req,res)=>{
    return res.json('welcome...')
});
ConnectDB();
app.use('/auth',AuthRouter);
app.use('/user',UserRouter);
app.use('/catagories', CatagoriesRouter);
app.use('/subCatagories', SubCatagoriesRouter);
app.use('/products', ProductRouter);
app.use('/coupon', CouponRouter);
app.use('/cart', CartRouter);

app.get('*',(req,res)=>{ 
    return res.json({message:'page not found'})
});
app.use(globalErrorHandler);
}


export default initApp