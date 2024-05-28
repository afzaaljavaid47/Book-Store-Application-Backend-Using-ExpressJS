const mongoose=require('mongoose');

const BookSchema=new mongoose.Schema({
    BookISBN:{
        type:Number,
        required:true
    },
    BookTitle:{
        type:String,
        required:true,
    },
    BookAuthor:{
        type:String,
        required:true,
    },
    BookGenre:{
        type:String,
        required:true
    },
    BookSummary:{
        type:String,
        required:true
    },
    BookImage:[String],
    BookLink:{
        type:String
    },
    UserName:{
        type:String,
        required:true
    }
})
const book=mongoose.model("Book",BookSchema);
module.exports=book;