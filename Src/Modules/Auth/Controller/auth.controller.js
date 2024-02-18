import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import UserModel from '../../../../DB/model/user.model.js'
import cloudinary from '../../../Services/cloudinary.js';
import { sendEmail } from '../../../Services/email.js';
import { customAlphabet, nanoid } from 'nanoid';

export const signUp = async (req, res,next) => {
    try {

        const { userName, email, password } = req.body;
        if (await UserModel.findOne({ email: email })) {
            return next(new Error("email Already exist",{cause:409}));
         }
        const hashPassword = await bcrypt.hashSync(password, parseInt(process.env.SALTROUND));

        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `${process.env.APP_NAME}/User`
        });

        const token = jwt.sign({ email }, process.env.CONFIRMEMAILSECRET);

        await sendEmail(email, "confirm Email", `<a href='${req.protocol}://${req.headers.host}/auth/confirmEmail/${token}'>verify</a>`);

        const createUser = await UserModel.create({ userName, email, password: hashPassword, image: { secure_url, public_id } });
        return res.status(201).json({ message: 'success', createUser })
    } catch (error) {
        return res.json({ error: error.stack });

    }
}

export const confirmEmail = async (req, res,next) => {
    const token = req.params.token;
    const decoded = await jwt.verify(token, process.env.CONFIRMEMAILSECRET);
    if (!decoded) {
        return next(new Error("invalid token",{cause:404}));
    }
    const user = await UserModel.findOneAndUpdate({ email: decoded.email, confirmEmail:false },{ confirmEmail: true });
    if (!user) {
        return next(new Error("Invalid Verify Email Or Your Email is Verified",{cause:400 }));
    
    }
    return res.redirect(process.env.LOGINFRONTEND)
    // return res.status(200).json({ message: 'Your Email Verified Successfully' });
}


export const sendCode = async (req, res,next) => {
    const { email} = req.body;
    if (!await UserModel.findOne({ email: email })) {
        return next(new Error("not register account",{cause:404})); 
    }
    let code=customAlphabet('123456789abcdzABCDZ',4);
    code=code();
    
    const html=`<h2>reset code : ${code}</h2>`
    sendEmail(email,'reset Password',html);
    const user = await UserModel.findOneAndUpdate({email},{sendCode:code},{new:true});
    return res.redirect(process.env.FORGOTPASSWORDFORM)
    
    // return res.status(200).json({ message: 'success', user})
}

export const forgotPassword = async (req, res,next) => {
    const { email,password,code} = req.body;
    const user = await UserModel.findOne({ email: email })
    if (!user) {
        return next(new Error("not register account",{cause:404})); 
    }
    if (user.sendCode!=code) {
        return next(new Error("invalid code",{cause:400})); 
    }
    let match=await bcrypt.compare(password,user.password);
    if (match) {
        return next(new Error("same password",{cause:409})); 
    }
    user.password=await bcrypt.hashSync(password,parseInt(process.env.SALTROUND));
    user.sendCode=null;
    user.changePasswordTime=Date.now();
    user.save();
    return res.status(200).json({ message: 'success', user})
}


export const signIn = async (req, res,next) => {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email: email });
    
    if (!user) {
        return next(new Error("data invalid",{cause:400}));  
    }
    if (!user.confirmEmail) {
        return next(new Error("please confirm your email!!!",{cause:400}));  
    }
    const match = await bcrypt.compareSync(password, user.password);
    if (!match) {
        return next(new Error("data invalid",{cause:400}));  
    }
    const token = await jwt.sign({ id: user._id, role: user.role, status: user.status }, process.env.LOGINSECRET,
        // {expiresIn:'5m'}
    );
    const refreshToken = await jwt.sign({ id: user._id, role: user.role, status: user.status }, process.env.LOGINSECRET, { expiresIn:60*60*24*30 });

    return res.status(201).json({ message: 'success', token, refreshToken })
}


export const deleteInvalidConfirm=async(req,res,next)=>{
    const invalidConfirmsUsers=await UserModel.deleteMany({confirmEmail:false});
    return res.status(201).json({ message: 'success', invalidConfirmsUsers })
    
}