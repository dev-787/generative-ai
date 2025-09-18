const express = require("express")
const {authUser} = require("../middlewares/auth.middleware")
const {createChat,getChat} = require("../controller/chat.controller")

const router = express.Router();

router.post("/",authUser,createChat)
router.get("/",authUser,getChat)

module.exports = router;