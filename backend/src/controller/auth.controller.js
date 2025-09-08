const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

async function registerUser(req,res) {


    const {fullName:{
        firstName,lastName
    },email,password} = req.body;


    const isUserAlreadyExist = await userModel.findOne({email})

    if(isUserAlreadyExist){
        res.status(400).json({
            message:"User already exist"
        })
    }

    const hashedPassword = await bcrypt.hash(password,10)

    const user = await userModel.create({
        fullName:{
            firstName,lastName
        },email,password:hashedPassword
    })

    const token = jwt.sign({
        id:user._id
    },process.env.JWT_SECRET)

    res.status(200).json({
        message:"User registered successful",
        user:{
            email:user.email,
            _id:user._id,
            fullName:user.fullName
        }
    })
}

async function loginUser(req,res) {
    const {email,password} = req.body;

    const user = await userModel.findOne({
        email
    })

    if(!user){
        return res.status(400).json({
            message:"invalid email address"
        });
    }

    const isPasswordValid = await bcrypt.compare(password,user.password)
    if(!isPasswordValid) res.status(400).json({message:"invalid email or password "})

    const token = jwt.sign({id:user._id},process.env.JWT_SECRET)

    res.cookie("token",token)

    res.status(200).json({
        message:"user logged in sucessful",
        user:{
            email:user.email,
            _id: user._id,
            fullName:user.fullName
        }
    })
}

module.exports = {
    registerUser,
    loginUser
};