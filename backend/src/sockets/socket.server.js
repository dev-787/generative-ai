const { Server } = require("socket.io");
const cookie = require("cookie")
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model")
const { generateResponse,generateVector } = require("../services/ai.service")
const messageModel = require("../models/message.model")
const { createMemory } = require("../services/vector.service")
const { queryMemory } = require("../services/vector.service");
const { chat } = require("@pinecone-database/pinecone/dist/assistant/data/chat");
const { text } = require("express");

function InitSocketServer(httpServer){

    const io = new Server(httpServer,{})

    io.use( async (socket,next)=>{
        const cookies =  cookie.parse(socket.handshake.headers?.cookie || "");

        if(!cookies.token){
            next(new Error("athentication error: No token found"));
        } 

        try{
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET)

            const user = await userModel.findById(decoded.id)

            socket.user = user

            next()

        }catch{
            next(new Error("athentication error: token invalid"))
        }
    })

    io.on("connection",(socket)=>{

        socket.on("ai-message", async (messagePayLoad)=>{   

            const message = await messageModel.create({
                chat:messagePayLoad.chat,
                user:socket.user._id,
                content:messagePayLoad.content,
                role:"user"
            })

            const vectors = await generateVector(messagePayLoad.content)
            
            const memory = await queryMemory({queryVector:vectors,limit:3,metadata:{}})

            await createMemory({vectors,metadata:{chat:messagePayLoad.chat,user:socket.user._id,text:messagePayLoad.content},messageId:message._id})

            console.log(memory)

            const chatHistory = (await messageModel.find({
                chat: messagePayLoad.chat
            }).sort({createdAt: -1}).limit(20).lean()).reverse()


            const response = await generateResponse(chatHistory.map(item=>{
                return {
                    role: item.role,
                    parts:[{text:item.content}]
                }
            }))

            const responseMessage = await messageModel.create({
                chat:messagePayLoad.chat,
                user:socket.user._id,
                content: response,
                role:"model"
            })

            const responseVector = await generateVector(response)

            await createMemory({vectors:responseVector,
                metadata:{chat:messagePayLoad.chat,user:socket.user._id,text:response},
                messageId:responseMessage._id})


            socket.emit("ai-response",{
                content:response,
                chat:messagePayLoad.chat
            })
        })
    })
}

module.exports = InitSocketServer;