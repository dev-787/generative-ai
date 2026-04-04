const MessageModel = require("../models/message.model")

async function getMessagesByChatId(req, res) {
    const { chatId } = req.params;
    const user = req.user;

    try {
        const messages = await MessageModel.find({ 
            chat: chatId,
            user: user._id 
        }).sort({ createdAt: 1 }); // Sort by creation time ascending

        res.status(200).json({
            message: "Messages fetched successfully",
            messages: messages.map(msg => ({
                _id: msg._id,
                content: msg.content,
                role: msg.role,
                createdAt: msg.createdAt,
                updatedAt: msg.updatedAt
            }))
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({
            message: "Failed to fetch messages",
            error: error.message
        });
    }
}

module.exports = {
    getMessagesByChatId
}