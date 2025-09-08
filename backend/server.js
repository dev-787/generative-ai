require("dotenv").config();
const app = require("./src/app")
const connectToDb = require("./src/db/db")
const InitSocketServer = require("./src/sockets/socket.server")
const httpServer = require("http").createServer(app)

connectToDb();
InitSocketServer(httpServer);

httpServer.listen(3000,()=>{
    console.log("server is running on port 3000")
})