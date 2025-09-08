const express = require("express")
const {authUser} = require("../middlewares/auth.middleware")
const {createChat} = require("../controller/chat.controller")

const router = express.Router();

router.post("/",authUser,createChat)


module.exports = router;