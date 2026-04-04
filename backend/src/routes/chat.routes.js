const express = require("express")
const {authUser} = require("../middlewares/auth.middleware")
const {createChat,getChat,cleanupEmptyChatsEndpoint} = require("../controller/chat.controller")

const router = express.Router();

router.post("/",authUser,createChat)
router.get("/",authUser,getChat)
router.delete("/cleanup",authUser,cleanupEmptyChatsEndpoint)

module.exports = router;