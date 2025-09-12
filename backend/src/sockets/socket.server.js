const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const { generateResponse, generateVector } = require("../services/ai.service");
const messageModel = require("../models/message.model");
const { createMemory } = require("../services/vector.service");
const { queryMemory } = require("../services/vector.service");
const {
  chat,
} = require("@pinecone-database/pinecone/dist/assistant/data/chat");
const { text } = require("express");

function InitSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

    if (!cookies.token) {
      next(new Error("athentication error: No token found"));
    }

    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);

      const user = await userModel.findById(decoded.id);

      socket.user = user;

      next();
    } catch {
      next(new Error("athentication error: token invalid"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("ai-message", async (messagePayLoad) => {
      const [message, vectors] = await Promise.all(
        [
          messageModel.create({
            chat: messagePayLoad.chat,
            user: socket.user._id,
            content: messagePayLoad.content,
            role: "user",
          }),
          generateVector(messagePayLoad.content),
        ],
      );

      await createMemory({
          vectors,
          metadata: {
            chat: messagePayLoad.chat,
            user: socket.user._id,
            text: messagePayLoad.content,
          },
          messageId: message._id,
        })

      const [memory, chatHistory] = await Promise.all([
  queryMemory({
    queryVector: vectors,
    limit: 3,
    metadata: { user: socket.user._id },
  }),
  messageModel.find({
    chat: messagePayLoad.chat,
  }).sort({ createdAt: -1 }).limit(20).lean().then(results => results.reverse())
]);


      const stm = chatHistory.map((item) => {
        return {
          role: item.role,
          parts: [{ text: item.content }],
        };
      });

      const ltm = [
        {
          role: "user",
          parts: [
            {
              text: `this are the few chats from the past use them to generate them to generate a response ${memory
                .map((item) => item.metadata.text)
                .join("\n")}`,
            },
          ],
        },
      ];

      const response = await generateResponse([...ltm, ...stm]);

      socket.emit("ai-response", {
        content: response,
        chat: messagePayLoad.chat,
      });

      const [responseMessage, responseVector] = await Promise.all([
        messageModel.create({
          chat: messagePayLoad.chat,
          user: socket.user._id,
          content: response,
          role: "model",
        }),
        generateVector(response),
      ]);

      await createMemory({
        vectors: responseVector,
        metadata: {
          chat: messagePayLoad.chat,
          user: socket.user._id,
          text: response,
        },
        messageId: responseMessage._id,
      });

      
    });
  });
}

module.exports = InitSocketServer;
