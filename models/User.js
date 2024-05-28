const mongoose=require('mongoose');

const UserSchema=new mongoose.Schema({
    UserName:{
        type:String,
        required:true
    }, 
    UserPW:{
        type:String,
        required:true,
    },
    UserFName:{
        type:String,
        required:true,
    },
    UserLName:{
        type:String,
        required:true
    },
    UserEmail:{
        type:String,
        required:true
    },
    UserContactNo:{
        type:String,
        required:true
    }
})
const user=mongoose.model("User",UserSchema);
module.exports=user;