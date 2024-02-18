import mongoose, { Schema, model } from "mongoose";

const UserSchema=new Schema({
    userName:{
        type:String,
        required:true,
        min:4,
        max:20
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    confirmEmail:{
        type:Boolean,
        default:false
    },
    password:{
        type:String,
        required:true
    },
    address:{
        type:String
    },
    phoneNumber:{
        type:String,
    },
    image:{
        type:Object,
        required:true,
    }
    ,
    gender:{
        type:String,
        enum:['Male','Female']
    },
    status:{
        type:String,
        enum:['Active','Inactive']
    },
    role:{
        type:String,
        enum:['User','Admin'],
        default:'User'
    },
    sendCode:{
        type:String,
        default:null
    },
    changePasswordTime:{
        type:Date
    }

},{
    timestamps:true
})

const UserModel=mongoose.models.User || model('User',UserSchema);
export default UserModel;