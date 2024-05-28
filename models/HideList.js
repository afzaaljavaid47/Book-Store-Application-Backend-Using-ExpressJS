const mongoose=require('mongoose');

const hideListSchema=new mongoose.Schema({
    BookISBN:{
        type:Number,
        required:true
    },
    UserName:{
        type:String,
        required:true
    }
})

module.exports=mongoose.model("hideList",hideListSchema);