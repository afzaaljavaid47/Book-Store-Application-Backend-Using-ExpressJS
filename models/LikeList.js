const mongoose=require('mongoose');

const likeListSchema=new mongoose.Schema({
    BookISBN:{
        type:Number,
        required:true
    },
    UserName:{
        type:String,
        required:true
    }
})

module.exports=mongoose.model("likeList",likeListSchema);