const express = require("express")
const { authUser } = require("../middlewares/auth.middleware")
const { getMessagesByChatId } = require("../controller/message.controller")

const router = express.Router();

// Get messages for a specific chat
router.get("/chat/:chatId", authUser, getMessagesByChatId)

module.exports = router;