var express = require('express');
var router = express.Router();
var bookModel=require('../models/Book');
var hideBookModel=require('../models/HideList');
var likeBookModel=require('../models/LikeList');
var commentModel=require('../models/BookComment');
var path = require('path');
const cors=require("cors");
var getUserInfo=require('../middlewares/getUserInfo');
const {body,validationResult}=require('express-validator');
var mongoose=require("mongoose");
 
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true })
.catch((error) => console.error(error));
mongoose.connection.on("connected", () => {
  console.log("connected to mongo");
});

router.use(cors());

router.get('/getAllBooks',getUserInfo,async (req,res)=>{
    try {
        // var allBooks=await bookModel.find({UserName:req.UserName},{UserName:false});
        // res.status(200).json({allBooks});
        console.log(req.query.page);
        var skip=(req.query.page-1)*4
        await bookModel.aggregate([
          { $lookup:
              {
                 from: "hidelists",
                 localField: "BookISBN",
                 foreignField: "BookISBN",
                 as: "hideList"
              }
          },
          { $lookup:
            {
               from: "likelists",
               localField: "BookISBN",
               foreignField: "BookISBN",
               as: "likeList"
            }
        },{
            "$project": {
              "hideList.UserName":0,
              "likeList.UserName":0
            }
          },
          {$skip: skip},
          {$limit: 4}
      ]).then((data)=>{
        console.log(data);
        console.log(data)
        res.send(data)
      });

    } catch (error) {
        res.status(500).json({messsage:"Internal Server Error 500",error:error.message});
    }
})

router.post('/searchBook',cors(),getUserInfo,async (req,res)=>{
  try {
      // var allBooks=await bookModel.find({UserName:req.UserName},{UserName:false});
      // res.status(200).json({allBooks});
console.log("Search Text: ",req.body.search)
      await bookModel.aggregate([
        { $lookup:
            {
               from: "hidelists",
               localField: "BookISBN",
               foreignField: "BookISBN",
               as: "hideList"
            }
        },
        { $lookup:
          {
             from: "likelists",
             localField: "BookISBN",
             foreignField: "BookISBN",
             as: "likeList"
          }
      },{
          "$project": {
            "hideList.UserName":0,
            "likeList.UserName":0
          }
        }
    ]).then((data)=>{
      console.log("All Data : ",data);
      res.send(data.filter(x=>x.BookTitle.includes(req.body.search)))
    });

  } catch (error) {
      res.status(500).json({messsage:"Internal Server Error 500",error:error.message});
  }
})


router.post('/getBookById',getUserInfo,async (req,res)=>{
  try {
    const BookISN=req.body.id;
    console.log("Book ISBN : ",BookISN);
    
    await bookModel.aggregate([
      { 
        $lookup:
          {
             from: "comments",
             localField: "BookISBN",
             foreignField: "BookISBN",
             as: "CommentData"
          }
       }
  ]).then((data)=>{
    console.log(data);
    res.status(200).json(data);
  });

      // await bookModel.find({_id:req.body.id},{UserName:false}).then((data)=>{
      //   console.log(data);
      //   res.status(200).json(data);
      // })  
  } catch (error) {
      res.status(500).json({messsage:"Internal Server Error 500",error:error.message});
  }
})

router.get('/getAllHideBooks',getUserInfo,async (req,res)=>{
  try {
      await hideBookModel.aggregate([
        { $lookup:
            {
               from: "books",
               localField: "BookISBN",
               foreignField: "BookISBN",
               as: "bookData"
            }
        },
        {
          "$project": {
            "bookData.UserName":0,
          }
        }
    ]).then((data)=>res.send(data));

  } catch (error) {
      res.status(500).json({messsage:"Internal Server Error 500",error:error.message});
  }
})

router.get('/getAllLikeBooks',getUserInfo,async (req,res)=>{
  try {
      await likeBookModel.aggregate([
        { $lookup:
            {
               from: "books",
               localField: "BookISBN",
               foreignField: "BookISBN",
               as: "bookData"
            }
        },
        {
          "$project": {
            "bookData.UserName":0,
          }
        }
    ]).then((data)=>res.send(data));

  } catch (error) {
      res.status(500).json({messsage:"Internal Server Error 500",error:error.message});
  }
})


router.post('/addToHideList',cors(),getUserInfo,async (req, res )=> {
  try { 
    console.log("Add to Hide list");
    const findBookInHideList=await hideBookModel.find({BookISBN:req.body.BookISBN})
    if(findBookInHideList.length>0){
      await hideBookModel.deleteOne({BookISBN:req.body.BookISBN}).then(()=>{
        res.status(200).json({message:"Book unhide successfully!"});
      })
    }
    else
    {
      const hideBook=new hideBookModel({
        BookISBN:req.body.BookISBN,
        UserName:req.UserName
    })
    await hideBook.save().then(()=>{
      res.status(200).json({message:"Book hided successfully!"});
    }).catch(()=>{
      res.status(500).json({error:error.message});
    })
  }}
  catch (error) {
    res.status(500).json({error:error.message});
  }
  });

  router.post('/deleteBook',getUserInfo,async (req, res )=> {
    try { 
      console.log("Delete Book");
      const findBookInBookList=await bookModel.find({BookISBN:req.body.BookISBN})
      if(!findBookInBookList.length>0){   
       res.status(200).json({message:"Book not exists in DB."});
      }
      else
      {
      await bookModel.deleteOne({BookISBN:req.body.BookISBN}).then(()=>{
        res.status(200).json({message:"Book deleted successfully!"});
      }).catch(()=>{
        res.status(500).json({error:error.message});
      })
    }}
    catch (error) {
      res.status(500).json({error:error.message});
    }
    });
  
router.post('/addToLikeList',getUserInfo,async (req, res )=> {
  try { 
    const findBookInLikeList=await likeBookModel.find({BookISBN:req.body.BookISBN})
    if(findBookInLikeList.length>0){
      await likeBookModel.deleteOne({BookISBN:req.body.BookISBN})
      .then(()=>{
        res.status(200).json({message:"Book unliked successfully!"});
      })
    }
    else
    {
      const likeBook=new likeBookModel({
        BookISBN:req.body.BookISBN,
        UserName:req.UserName
    })
    await likeBook.save().then(()=>{
      res.status(200).json({message:"Book liked successfully!"});
    }).catch(()=>{
      res.status(500).json({error:error.message});
    })
  }}
  catch (error) {
    res.status(500).json({error:error.message});
  }
  });


const multer=require('multer');
router.use(express.static(path.join(__dirname, 'public/uploads')))

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("File Path in : ",path.join(__dirname, '../public/uploads'));
    cb(null, path.join(__dirname, '../public/uploads'))
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now()+path.extname(file.originalname))
  }
})

var upload = multer({ storage: storage }).single('photo')


router.post('/addBook',[
  body("BookISBN","BookISBN is required").exists(),
  body("BookTitle","Book Title is required").exists(),
  body("BookAuthor","Book Author is required").exists(),
  body("BookGenre","Book Genre is required").exists(),
  body("BookSummary","Book Summary is required").exists()
],upload,getUserInfo,async (req, res, )=> {
try { 
  const findBookByISBN=await bookModel.find({BookISBN:req.body.BookISBN})
  console.log("Book Data",findBookByISBN);
  if(findBookByISBN.length>0){
    res.status(200).json({success:false,message:"Book with this ISBN already exists in db!"});
  }
  else
  {
      const book=new bookModel({
      BookISBN:req.body.BookISBN,
      BookTitle:req.body.BookTitle,
      BookAuthor:req.body.BookAuthor,
      BookGenre:req.body.BookGenre,
      BookSummary:req.body.BookSummary,
      BookImage:req.file.filename,
      BookLink:req.body.BookLink,
      UserName:req.UserName
  })
  console.log(book)
  await book.save().then((data)=>{
    res.status(200).json({success:true,message:"Book added successfully!"});
  })
  .catch((err)=>{
    res.status(500).json({error:err});
  });
}
}
catch (error) {
  res.status(500).json({error:error});
}
});

var storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("File Path in : ",path.join(__dirname, '../public/uploads'));
    cb(null, path.join(__dirname, '../public/uploads'))
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now()+path.extname(file.originalname))
  }
})

var upload1 = multer({ storage: storage1 }).array('images')

router.post('/addBookWithImage',[
  body("BookISBN","BookISBN is required").exists(),
  body("BookTitle","Book Title is required").exists(),
  body("BookAuthor","Book Author is required").exists(),
  body("BookGenre","Book Genre is required").exists(),
  body("BookSummary","Book Summary is required").exists()
],upload1,getUserInfo,async (req, res, )=> {
try { 
  const findBookByISBN=await bookModel.find({BookISBN:req.body.BookISBN})
  console.log("Book Data",findBookByISBN);
  if(findBookByISBN.length>0){
    res.status(200).json({success:false,message:"Book with this ISBN already exists in db!"});
  }
  else
  {
    const image_names = [];
    req.files.forEach(img => {
      image_names.push(img.filename)
    });
    console.log(image_names)
      const book=new bookModel({
      BookISBN:req.body.BookISBN,
      BookTitle:req.body.BookTitle,
      BookAuthor:req.body.BookAuthor,
      BookGenre:req.body.BookGenre,
      BookSummary:req.body.BookSummary,
      BookImage:image_names,
      BookLink:req.body.BookLink,
      UserName:req.UserName
  })
  console.log(book)
  await book.save().then((data)=>{
    res.status(200).json({success:true,message:"Book added successfully!"});
  })
  .catch((err)=>{
    res.status(500).json({error:err});
  });
}
}
catch (error) {
  res.status(500).json({error:error});
}
});

router.post('/addBookComment',getUserInfo,async (req, res, )=> {
try { 
  const book=new commentModel({
      UserName:req.UserName,
      BookISBN:req.body.id,
      Comment:req.body.comment
  })
  console.log(book);
  await book.save().then((data)=>{
    res.status(200).json({success:true,message:"Comment added successfully!"});
  })
  .catch((err)=>{
    res.status(500).json({success:false,message:err.message});
  });
}
catch (error) {
  res.status(500).json({success:false,message:err.message});
}
});

router.put("/updateBook/:id",[ 
  body("BookISBN","BookISBN is required").exists(),
    body("BookTitle","Book Title is required").exists(),
    body("BookAuthor","Book Author is required").exists(),
    body("BookGenre","Book Genre is required").exists(),
],getUserInfo,async (req,res)=>{
  try {
    const {BookISBN,BookTitle,BookAuthor,BookGenre}=req.body;
    const newBookNote={};
    if(BookISBN){newNote.BookISBN=BookISBN}
    if(BookTitle){newNote.BookTitle=BookTitle}
    if(BookAuthor){newNote.BookAuthor=BookAuthor}
    if(BookGenre){newNote.BookGenre=BookGenre}

  let isBookExists=await bookModel.findById({_id:req.params.id});
  console.log("Note Id:",isBookExists.user.toString())
  console.log("User Id",req.userID)
  if(!isBookExists){
    res.status(401).send("Note not exist in the database");
  }
  if(isBookExists.UserName.toString()!==req.UserName){
    res.status(401).json({error:"Unauthorized 401"});
  }

  isBookExists=await bookModel.findByIdAndUpdate({_id:req.params.id},{$set:newBookNote},{new:true});
  res.status(200).json({isBookExists})
  } catch (error) {
    res.status(500).json({error:error.message});
  }
})

router.post("/updateBook",[
  body("Title","Book Title is required").exists(),
  body("Author","Book Author is required").exists(),
  body("Gerne","Book Genre is required").exists(),
  body("Summary","Book Summary is required").exists(),
],async function (req, res, next) {
  const errors=validationResult(req);
  if(!errors.isEmpty())
  {
     res.status(400).send({success:true,message:errors})
  }
  try {  
    console.log(req.body);
  const findBook=await bookModel.find({ BookISBN:req.body.ISBN })
  console.log("Find book",findBook);
  if(!findBook.length>0)
  {
    console.log("book not exists");
    res.send({success:false,message:"Book not exists in db"});
  } 
  else
  {
    bookModel.updateOne({BookISBN:req.body.ISBN},
      {
        $set:{
          UserName:req.UserName,
          BookGenre:req.body.Gerne,
          BookAuthor:req.body.Author,
          BookTitle:req.body.Title,
          BookISBN:req.body.ISBN,
          BookSummary:req.body.Summary,
          BookLink:req.body.Link
        }
      })
  .then((data) => {
    console.log('Book Updated',data);
    res.status(200).json({success:true,message:"Book updated successfully"})})
  .catch((err)=>{console.log(err.message);});
} 
  }
catch (error) {
    res.status(500).json({success:false,message:"500 internal server error"});
}
});

router.delete("/deleteBook/:id",getUserInfo,async (req,res)=>{
  try {
  let isBookExists=await notesModel.findById({_id:req.params.id});
  if(!isBookExists){
    res.status(401).send("Note not exist in the database");
  }
  if(isBookExists.UserName.toString()!==req.UserName){
    res.status(401).json({error:"Unauthorized 401"});
  }
  isBookExists=await bookModel.findByIdAndDelete({_id:req.params.id});
  res.status(200).json({isNoteExists})
  } catch (error) {
    res.status(500).json({error:error.message});
  }
})

module.exports = router;