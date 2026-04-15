const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser")

//Routes
const authRoutes = require("./routes/auth.routes")
const chatRoutes = require("./routes/chat.routes")
const messageRoutes = require("./routes/message.routes")
const uploadRoutes = require("./routes/upload.route")

const app = express();


//using middlewares
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (curl, Postman, mobile apps)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json())
app.use(cookieParser())

// Serve static files for demo/testing
app.use('/demo', express.static('../frontend/src/demo'))

//using Routes
app.get('/', (req, res) => res.json({ message: 'API is running 🚀' }))
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use('/uploads', express.static(require('path').join(__dirname, '../../uploads')));

module.exports = app;