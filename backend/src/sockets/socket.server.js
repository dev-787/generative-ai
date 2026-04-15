const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const chatModel = require("../models/chat.model");
const { generateResponse, generateVector, generateChatTitle } = require("../services/ai.service");
const messageModel = require("../models/message.model");
const { createMemory } = require("../services/vector.service");
const { queryMemory } = require("../services/vector.service");

// Function to clean up empty chats when user disconnects
async function cleanupEmptyChatsOnDisconnect(userId, currentChatId = null) {
  try {
    // Find all chats for the user
    const userChats = await chatModel.find({ user: userId });
    
    // Check each chat for messages
    const emptyChats = [];
    
    for (const chat of userChats) {
      // Skip the currently active chat if specified
      if (currentChatId && chat._id.toString() === currentChatId.toString()) {
        continue;
      }
      
      // Count messages in this chat
      const messageCount = await messageModel.countDocuments({ 
        chat: chat._id,
        user: userId 
      });
      
      // If no messages, mark for deletion
      if (messageCount === 0) {
        emptyChats.push(chat._id);
      }
    }
    
    // Delete empty chats
    if (emptyChats.length > 0) {
      const result = await chatModel.deleteMany({ 
        _id: { $in: emptyChats },
        user: userId 
      });
      
      console.log(`[Socket Cleanup] Deleted ${result.deletedCount} empty chats for user ${userId}`);
      return result.deletedCount;
    }
    
    return 0;
  } catch (error) {
    console.error('[Socket Cleanup] Error cleaning up empty chats:', error);
    return 0;
  }
}

function InitSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true
    }
  });

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
    console.log(`[Socket] User ${socket.user._id} connected`);
    
    // Store current chat ID for cleanup purposes
    socket.currentChatId = null;
    
    socket.on("join-chat", (chatId) => {
      // Leave previous chat room if any
      if (socket.currentChatId) {
        socket.leave(`chat_${socket.currentChatId}`);
      }
      
      socket.currentChatId = chatId;
      socket.join(`chat_${chatId}`);
      console.log(`[Socket] User ${socket.user._id} joined chat ${chatId}`);
    });
    
    // Join user's personal room for general updates
    socket.join(`user_${socket.user._id}`);
    console.log(`[Socket] User ${socket.user._id} joined personal room`);
    
    socket.on("ai-message", async (messagePayLoad) => {
      try {
        console.log(`[Socket] Processing message from user ${socket.user._id}`);
        
        // Lazily create chat if not provided (new chat with no messages yet)
        if (!messagePayLoad.chat) {
          const newChat = await chatModel.create({
            user: socket.user._id,
            title: 'New Chat'
          });
          messagePayLoad.chat = newChat._id.toString();
          // Notify client of the new chat ID so it can track it
          socket.emit("chat-created", { chatId: messagePayLoad.chat });
          console.log(`[Socket] Created new chat ${messagePayLoad.chat}`);
        }

        // Update current chat ID when user sends a message
        socket.currentChatId = messagePayLoad.chat;
        
        const [message, vectors] = await Promise.all([
          messageModel.create({
            chat: messagePayLoad.chat,
            user: socket.user._id,
            content: messagePayLoad.content,
            role: "user",
          }),
          generateVector(messagePayLoad.content),
        ]);
        
        // Update chat's last activity
        await chatModel.findByIdAndUpdate(messagePayLoad.chat, {
          lastActivity: new Date()
        });

        await createMemory({
          vectors,
          metadata: {
            chat: messagePayLoad.chat,
            user: socket.user._id,
            text: messagePayLoad.content,
          },
          messageId: message._id,
        });

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

        console.log(`[Socket] Generating AI response...`);
        const response = await generateResponse([...ltm, ...stm], messagePayLoad.attachment?.path || null);
        console.log(`[Socket] AI response generated`);

        // Emit AI response IMMEDIATELY to the user
        socket.emit("ai-response", {
          content: response,
          chat: messagePayLoad.chat,
        });
        
        // Broadcast message updates to the chat room for real-time updates
        socket.to(`chat_${messagePayLoad.chat}`).emit("message-update", {
          chatId: messagePayLoad.chat,
          type: "new_messages"
        });
        
        // Also emit to user's personal room for chat list updates
        socket.to(`user_${socket.user._id}`).emit("chat-update", {
          chatId: messagePayLoad.chat,
          type: "activity_update",
          lastActivity: new Date()
        });

        // Do all the heavy lifting in the background without blocking
        setImmediate(async () => {
          try {
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
            
            // Check if we need to generate a title for this chat
            const messageCount = await messageModel.countDocuments({
              chat: messagePayLoad.chat,
              user: socket.user._id
            });
            
            // Generate title after first AI response (when we have user message + AI response)
            if (messageCount === 2) {
              console.log(`[Socket] Generating title for chat ${messagePayLoad.chat} after first exchange`);
              
              const newTitle = await generateChatTitle(messagePayLoad.content, response);
              
              // Update the chat with the new title
              await chatModel.findByIdAndUpdate(
                messagePayLoad.chat,
                { 
                  title: newTitle,
                  lastActivity: new Date()
                },
                { new: true }
              );
              
              console.log(`[Socket] Updated chat title to: "${newTitle}"`);
              
              // Emit title update to user's room for immediate UI refresh
              io.to(`user_${socket.user._id}`).emit("chat-title-update", {
                chatId: messagePayLoad.chat,
                title: newTitle,
                type: "title_generated"
              });
            }
            
            // Final broadcast to update chat history with all messages
            io.to(`user_${socket.user._id}`).emit("chat-history-update", {
              chatId: messagePayLoad.chat,
              type: "messages_added",
              messageCount: 2 // user message + AI response
            });
          } catch (error) {
            console.error('[Socket] Error in background processing:', error);
          }
        });
        
      } catch (error) {
        console.error('[Socket] Error processing message:', error);
        socket.emit("ai-response", {
          content: "Sorry, I encountered an error. Please try again.",
          chat: messagePayLoad.chat,
          error: true
        });
      }
    });
    
    // Handle disconnect event to cleanup empty chats
    socket.on("disconnect", async (reason) => {
      console.log(`[Socket] User ${socket.user._id} disconnected. Reason: ${reason}`);
      
      try {
        // Clean up empty chats when user disconnects
        const deletedCount = await cleanupEmptyChatsOnDisconnect(
          socket.user._id, 
          socket.currentChatId
        );
        
        if (deletedCount > 0) {
          console.log(`[Socket] Cleaned up ${deletedCount} empty chats on disconnect for user ${socket.user._id}`);
        }
      } catch (error) {
        console.error(`[Socket] Error during disconnect cleanup for user ${socket.user._id}:`, error);
      }
    });
  });
}

module.exports = InitSocketServer;
