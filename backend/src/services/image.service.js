const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI client (lazy initialization to avoid env issues)
let openai = null;

function getOpenAIClient() {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
            throw new Error('OpenAI API key not configured');
        }
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    return openai;
}

async function generateImage(prompt, options = {}) {
    try {
        console.log('[Image Service] Generating image with OpenAI for:', prompt);
        
        // Get OpenAI client (with lazy initialization)
        const openaiClient = getOpenAIClient();
        
        // Use OpenAI Images API for text-to-image generation
        const response = await openaiClient.images.generate({
            model: "dall-e-2",
            prompt: prompt,
            n: 1,
            size: "512x512",
            response_format: "b64_json"
        });
        
        // Get base64 image data
        const base64Image = response.data[0].b64_json;
        
        // Convert base64 to buffer and save as PNG
        const imageBuffer = Buffer.from(base64Image, 'base64');
        const imageFileName = `generated-${Date.now()}.png`;
        const imagePath = path.join(__dirname, '../../uploads', imageFileName);
        
        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        fs.writeFileSync(imagePath, imageBuffer);
        
        console.log('[Image Service] Image generated and saved successfully');
        
        return {
            success: true,
            imageUrl: null,
            localPath: `/uploads/${imageFileName}`,
            fileName: imageFileName,
            prompt: prompt,
            revisedPrompt: response.data[0].revised_prompt || prompt
        };
        
    } catch (error) {
        console.error('[Image Service] OpenAI generation failed:', error.message);
        
        // Return the actual error message for better debugging
        let errorMessage = `I'm sorry, but I can't generate images right now.`;
        
        if (error.message.includes('Billing hard limit')) {
            errorMessage = `I encountered an issue generating your image: 400 Billing hard limit has been reached. Please try again with a different description! 🎨`;
        } else if (error.message.includes('quota')) {
            errorMessage = `I encountered an issue generating your image: API quota exceeded. Please try again later! 🎨`;
        } else if (error.message.includes('API key')) {
            errorMessage = `I encountered an issue generating your image: API key issue. Please check your OpenAI configuration! 🎨`;
        } else {
            errorMessage = `I encountered an issue generating your image: ${error.message}. Please try again! 🎨`;
        }
        
        return {
            success: false,
            message: errorMessage,
            prompt: prompt
        };
    }
}

// Function to detect if a message is requesting image generation
function isImageGenerationRequest(message) {
    const imageKeywords = [
        'generate image', 'create image', 'make image', 'draw image',
        'generate picture', 'create picture', 'make picture', 'draw picture',
        'generate photo', 'create photo', 'make photo',
        'show me', 'visualize', 'illustrate',
        'dall-e', 'dalle', 'image of', 'picture of', 'photo of',
        'create art', 'generate art', 'make art', 'draw art'
    ];
    
    const lowerMessage = message.toLowerCase();
    return imageKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Extract image prompt from message
function extractImagePrompt(message) {
    const lowerMessage = message.toLowerCase();
    
    // Common patterns to extract the actual prompt
    const patterns = [
        /(?:generate|create|make|draw)\s+(?:an?\s+)?(?:image|picture|photo)\s+of\s+(.+)/i,
        /(?:generate|create|make|draw)\s+(?:an?\s+)?(?:image|picture|photo)\s+(.+)/i,
        /(?:show me|visualize|illustrate)\s+(.+)/i,
        /(?:image|picture|photo)\s+of\s+(.+)/i,
        /dall-?e\s+(.+)/i
    ];
    
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    // If no pattern matches, return the original message (user might have just written the prompt)
    return message.trim();
}

module.exports = {
    generateImage,
    isImageGenerationRequest,
    extractImagePrompt
};