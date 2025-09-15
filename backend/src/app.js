const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser")

//Routes
const authRoutes = require("./routes/auth.routes")
const chatRoutes = require("./routes/chat.routes")

const app = express();


//using middlewares
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5173'], // Vite ports
    credentials: true
}));
app.use(express.json())
app.use(cookieParser())

//using Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat",chatRoutes);

module.exports = app;