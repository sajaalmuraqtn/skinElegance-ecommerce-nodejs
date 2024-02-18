import { globalErrorHandler } from '../Services/errorHandling.js'

import AuthRouter from './Auth/auth.router.js'
import UserRouter from './User/user.router.js'

import ConnectDB from '../../DB/connection.js';

const initApp=(app,express)=>{

app.use(express.json());

app.get('/',(req,res)=>{
    return res.json('welcome...')
});
ConnectDB();
app.use('/auth',AuthRouter);
app.use('/user',UserRouter);

app.get('*',(req,res)=>{
    return res.json({message:'page not found'})
});
app.use(globalErrorHandler);
}


export default initApp