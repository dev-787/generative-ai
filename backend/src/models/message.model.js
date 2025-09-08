const mongoose = require("mongoose")

const MessageSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },chat:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"chat"
    },content:{
        type:String,
        required:true
    },content:{
        type:String,
        required: true
    },role:{
        type:String,
        enum: ["user","model","system"],
        default:"user"
    }
},{
    timestamps:true
})

const MessageModel = mongoose.model("message",MessageSchema)

module.exports = MessageModel 