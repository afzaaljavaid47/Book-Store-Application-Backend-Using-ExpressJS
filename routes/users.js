var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const UserModel=require('../models/User');
const {body,validationResult}=require('express-validator');

var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var getUserInfo=require("../middlewares/getUserInfo");

require('dotenv').config();

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true })
.catch((error) => console.error(error));
mongoose.connection.on("connected", () => {
  console.log("connected to mongo");
});

router.post("/signup",[
  body("UserName",'Please enter a valid UserName').isLength({min:3}),
  body("UserPW","Please enter a valid email").isLength({min:8}),
  body("UserFName","Please enter a valid email").isLength({min:3}),
  body("UserLName","Please enter a valid email").isLength({min:3}),
  body("UserEmail","Please enter a valid email").isEmail(),
  body("UserContactNo","Please enter a valid email").notEmpty()
],async function (req, res, next) {
  const errors=validationResult(req);
  if(!errors.isEmpty())
  {
     res.status(400).json({errors:errors.array()})
  }
  try {  
  const findUser=await UserModel.find({ $or: [{ UserName:req.body.UserName }, {UserEmail : req.body.UserEmail }]})
  console.log("Find user",findUser);
  if(findUser.length>0)
  {
    console.log("User already exists");
    res.send({success:false,message:"User already exists with this username or email"});
  } 
  else
  {
  var salt = bcrypt.genSaltSync(10);
  var hashPass=await bcrypt.hash(req.body.UserPW,salt);
  console.log(salt);

  var token = await jwt.sign({ 
    UserName:req.body.UserName,
    UserFName:req.body.UserFName,
    UserLName:req.body.UserLName,
    UserEmail:req.body.UserEmail,
    UserContactNo:req.body.UserContactNo,
    UserPW:hashPass
  }, process.env.JWT_SECRET);
console.log(token);
  const user=new UserModel({
    UserName:req.body.UserName,
    UserFName:req.body.UserFName,
    UserLName:req.body.UserLName,
    UserEmail:req.body.UserEmail,
    UserContactNo:req.body.UserContactNo,
    UserPW:hashPass
  })

  await user.save()
  .then(() => {
    console.log('User Save to DB');
    res.status(200).json({success:true,message:"User created successfully",token:token})})
  .catch((err)=>{console.log(err.message);});
} 
  }
catch (error) {
    res.status(500).json({success:false,message:"500 internal server error"});
}
});

router.post("/updateProfile",[
  body("UserFName","Please enter a valid first Name").isLength({min:3}),
  body("UserLName","Please enter a valid Last Name").isLength({min:3}),
  body("UserContactNo","Please enter a valid Contact Number").notEmpty()
],async function (req, res, next) {
  const errors=validationResult(req);
  if(!errors.isEmpty())
  {
     res.status(400).json({errors:errors})
  }
  try {  
    console.log(req.body);
  const findUser=await UserModel.find({ UserName:req.body.UserName })
  console.log("Find user",findUser);
  if(!findUser.length>0)
  {
    console.log("User not exists");
    res.send({success:false,message:"User not exists with this username or email"});
  } 
  else
  {
    const user=new UserModel({
      UserName:req.body.UserName,
      UserFName:req.body.UserFName,
      UserLName:req.body.UserLName,
      UserEmail:findUser[0].UserEmail,
      UserContactNo:req.body.UserContactNo,
      UserPW:findUser[0].UserPW
    });
  console.log("New Data: ",user);
    UserModel.updateOne({UserName:req.body.UserName},
      {
        $set:{
          UserName:req.body.UserName,
          UserFName:req.body.UserFName,
          UserLName:req.body.UserLName,
          UserEmail:findUser[0].UserEmail,
          UserContactNo:req.body.UserContactNo,
          UserPW:findUser[0].UserPW
    }})
  .then((data) => {
    console.log('User Updated',data);
    res.status(200).json({success:true,message:"Profile updated successfully"})})
  .catch((err)=>{console.log(err.message);});
} 
  }
catch (error) {
    res.status(500).json({success:false,message:"500 internal server error"});
}
});


router.post("/login",[
  body("UserEmail","Please enter a valid email").isEmail(),
  body('UserPW',"Please enter valid password").isLength({min:8})
],async (req,res)=>{

  const errors=validationResult(req);
  if(!errors.isEmpty())
  {
      return res.status(400).json({status:false,message:"User email or password does not meet basic requirements",message:errors.array()})
  }
  try 
  {
    let FindUser=await UserModel.findOne({UserEmail:req.body.UserEmail});
    console.log(FindUser);
    if(!FindUser){
    return res.status(400).json({status:false,message:"Invalid user name or password"});
    }
    const comparePassword=bcrypt.compareSync(req.body.UserPW,FindUser.UserPW);
    if(!comparePassword){
      return res.status(400).json({status:false,message:"Invalid user name or password"});
    }
    const UserData={
      UserName:FindUser.UserName
    }
    const userToken=jwt.sign(UserData,process.env.JWT_SECRET);
    res.status(200).json({status:true,userToken});
      
  } 
  catch (error) {
    return res.status(500).json({status:false,message:"500 internal server error"});
  }
})

router.get("/getUserProfile",getUserInfo,async (req,res)=>{
  try {
    const user=await UserModel.find({UserName:req.UserName});

    if(!user)
    {
      res.status(401).json({error:"401 unauthorized"});
    }
    res.status(200).json({data:user});
  } 
  catch (error) {
    res.status(500).json({error:"Internal Server Error"});
  }
})

module.exports = router;
