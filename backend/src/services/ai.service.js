const { GoogleGenAI } =  require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Safe helper to extract text from a Gemini response
function extractText(response) {
    if (response.text) return response.text
    // Fallback: concatenate all text parts manually
    try {
        return response.candidates?.[0]?.content?.parts
            ?.filter(p => p.text)
            ?.map(p => p.text)
            ?.join('') || ''
    } catch {
        return ''
    }
}

async function generateResponse(content, imagePath = null){
    let contents = content;

    // If an image path is provided, add it as inline image data
    if (imagePath) {
        const fs = require('fs');
        const path = require('path');
        const fullPath = path.join(__dirname, '../../uploads', path.basename(imagePath));
        
        if (fs.existsSync(fullPath)) {
            const imageData = fs.readFileSync(fullPath);
            const base64Image = imageData.toString('base64');
            const mimeType = imagePath.match(/\.(png)$/i) ? 'image/png' :
                             imagePath.match(/\.(gif)$/i) ? 'image/gif' :
                             imagePath.match(/\.(webp)$/i) ? 'image/webp' : 'image/jpeg';

            // Append image part to the last user message
            const lastMsg = contents[contents.length - 1];
            if (lastMsg && lastMsg.role === 'user') {
                lastMsg.parts.push({
                    inlineData: { mimeType, data: base64Image }
                });
            }
        }
    }

    const response = await ai.models.generateContent({
        model:"gemini-flash-latest",
        contents,
        config:{
            temperature:0.7,
            systemInstruction:`You are Aurora, a helpful and friendly AI assistant.

Your personality:
- Playful but professional with Gen-Z energy
- Supportive and encouraging, never condescending
- Concise and clear - get to the point quickly
- Use light emojis sparingly (max one per short paragraph)

Core rules:
- Focus ONLY on what the user is asking RIGHT NOW
- Never reference past conversations, chat history, or context you don't have
- Never mention attachments, files, or information that wasn't provided in the current message
- If you're unsure, admit it and provide best-effort guidance
- Don't invent facts, code, APIs, or prices
- Complete what you can now - never say you'll work in the background

Response format:
- Start with a quick answer or summary
- Use clear headings and short paragraphs
- Provide runnable, minimal code with brief comments
- End with "Next steps" when relevant

For how-to questions:
1. State the goal
2. List prerequisites
3. Give step-by-step commands/snippets
4. Add a quick verification check
5. Mention common pitfalls

For debugging:
- Ask for minimal details (env, versions, error text)
- Offer hypothesis → test → fix plan

Stay honest, practical, and user-first. Make coding feel approachable and fun! 🚀`
        }
    })

    return extractText(response);
}

async function generateVector(content) {
    
    const response = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: content,
        config:{
            outputDimensionality:768
        }
    })

    return response.embeddings[0].values
}

// Generate a short chat title based on the first user message
async function generateChatTitle(userMessage, aiResponse = null) {
    try {
        const content = [
            {
                role: "user",
                parts: [{
                    text: `Generate a short, descriptive title (2-5 words) for a chat that started with this message: "${userMessage}"${
                        aiResponse ? ` and got this AI response: "${aiResponse.substring(0, 200)}..."` : ''
                    }
                    
                    Rules:
                    - Keep it concise (2-5 words max)
                    - Make it descriptive of the topic
                    - No quotes or special characters
                    - Examples: "JavaScript Array Methods", "Recipe Ideas", "Travel Planning", "Math Problem Help"
                    
                    Return ONLY the title, nothing else.`
                }]
            }
        ];

        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: content,
            config: {
                temperature: 0.3, // Lower temperature for more consistent titles
                maxOutputTokens: 20 // Limit tokens to ensure short titles
            }
        });

        let title = extractText(response).trim();
        
        // Clean up the title - remove quotes, extra whitespace, etc.
        title = title.replace(/["'`]/g, '').trim();
        
        // Ensure it's not too long (fallback)
        if (title.length > 50) {
            const words = title.split(' ');
            title = words.slice(0, 4).join(' ');
        }
        
        // Fallback if generation fails
        if (!title || title.length === 0) {
            const words = userMessage.split(' ');
            title = words.slice(0, 3).join(' ');
        }
        
        console.log(`[AI Service] Generated chat title: "${title}"`);
        return title;
        
    } catch (error) {
        console.error('[AI Service] Error generating chat title:', error);
        // Fallback: use first few words of user message
        const words = userMessage.split(' ');
        return words.slice(0, 3).join(' ');
    }
}

module.exports = { generateResponse, generateVector, generateChatTitle }
