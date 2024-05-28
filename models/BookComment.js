const mongoose=require('mongoose');

const commentSchema=new mongoose.Schema({
    Comment:{
        type:String,
        required:true
    },
    BookISBN:{
        type:Number,
        required:true
    },
    UserName:{
        type:String,
        required:true
    }
})

module.exports=mongoose.model("comments",commentSchema);