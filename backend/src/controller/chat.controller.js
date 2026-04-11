const chatModel = require("../models/chat.model")
const MessageModel = require("../models/message.model")

async function createChat(req,res) {
    
    const {title} = req.body;
    const user = req.user;

    const chat = await chatModel.create({
        user:user._id,
        title
    });

    res.status(201).json({
        message:"Chat created successfully",
        chat:{
            _id:chat._id,
            title:chat.title,
            lastActivity:chat.lastActivity,
            user:chat.user
        }
    })
}


async function getChat(req,res) {
    const user = req.user;

    try {
        const chats = await chatModel.find({user:user._id}).sort({ lastActivity: -1 });

        res.status(200).json({
            message:"Chats fetched successfully",
            chats:chats.map(chat => ({
                _id:chat._id,
                title:chat.title,
                lastActivity:chat.lastActivity,
                user:chat.user
            }))
        });
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({
            message: "Failed to fetch chats",
            error: error.message
        });
    }
}

// Helper function to clean up empty chats
async function cleanupEmptyChats(userId, excludeChatId = null) {
    try {
        // Find all chats for the user
        const userChats = await chatModel.find({ user: userId });
        
        // Check each chat for messages
        const emptyChats = [];
        const cutoffTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
        
        for (const chat of userChats) {
            // Skip the currently active chat
            if (excludeChatId && chat._id.toString() === excludeChatId.toString()) {
                continue;
            }
            
            // Only delete chats that are older than 5 minutes and have no messages
            if (chat.createdAt < cutoffTime) {
                const messageCount = await MessageModel.countDocuments({ 
                    chat: chat._id,
                    user: userId 
                });
                
                if (messageCount === 0) {
                    emptyChats.push(chat._id);
                }
            }
        }
        
        // Delete empty chats
        if (emptyChats.length > 0) {
            const result = await chatModel.deleteMany({ 
                _id: { $in: emptyChats },
                user: userId 
            });
            
            console.log(`Cleaned up ${result.deletedCount} empty chats for user ${userId}`);
            return result.deletedCount;
        }
        
        return 0;
    } catch (error) {
        console.error('Error cleaning up empty chats:', error);
        throw error;
    }
}

// API endpoint to manually trigger cleanup
async function cleanupEmptyChatsEndpoint(req, res) {
    const user = req.user;
    const { excludeChatId } = req.query; // Optional parameter to exclude current chat
    
    try {
        const deletedCount = await cleanupEmptyChats(user._id, excludeChatId);
        
        res.status(200).json({
            message: "Empty chats cleanup completed",
            deletedCount: deletedCount
        });
    } catch (error) {
        console.error('Error in cleanup endpoint:', error);
        res.status(500).json({
            message: "Failed to cleanup empty chats",
            error: error.message
        });
    }
}

module.exports = {
    createChat,
    getChat,
    cleanupEmptyChats,
    cleanupEmptyChatsEndpoint
}
