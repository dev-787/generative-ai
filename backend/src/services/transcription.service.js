const OpenAI = require('openai');
const fs = require('fs');

// Initialize OpenAI client - you'll need to add OPENAI_API_KEY to your .env file
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
});

async function transcribeAudio(audioFilePath) {
    try {
        console.log('[Transcription] Starting transcription for:', audioFilePath);
        
        // Check if file exists
        if (!fs.existsSync(audioFilePath)) {
            throw new Error('Audio file not found');
        }
        
        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
            console.log('[Transcription] OpenAI API key not configured, using browser message');
            
            // Clean up the audio file
            try {
                fs.unlinkSync(audioFilePath);
                console.log('[Transcription] Audio file cleaned up');
            } catch (cleanupError) {
                console.warn('[Transcription] Failed to cleanup audio file:', cleanupError.message);
            }
            
            // Return a message telling user to change browser
            return 'Voice transcription is not supported in your current browser. Please switch to Chrome or Edge for voice recording support, or type your message instead.';
        }
        
        // Create a readable stream from the audio file
        const audioStream = fs.createReadStream(audioFilePath);
        
        // Use OpenAI Whisper to transcribe the audio
        const transcription = await openai.audio.transcriptions.create({
            file: audioStream,
            model: 'whisper-1',
            language: 'en', // Optional: specify language
            response_format: 'text'
        });
        
        console.log('[Transcription] Transcription completed:', transcription);
        
        // Clean up the audio file after transcription
        try {
            fs.unlinkSync(audioFilePath);
            console.log('[Transcription] Audio file cleaned up');
        } catch (cleanupError) {
            console.warn('[Transcription] Failed to cleanup audio file:', cleanupError.message);
        }
        
        return transcription.trim();
        
    } catch (error) {
        console.error('[Transcription] Error transcribing audio:', error);
        
        // Clean up the audio file on error
        try {
            if (fs.existsSync(audioFilePath)) {
                fs.unlinkSync(audioFilePath);
            }
        } catch (cleanupError) {
            console.warn('[Transcription] Failed to cleanup audio file on error:', cleanupError.message);
        }
        
        // If OpenAI API key is not set or invalid, return a helpful message
        if (error.message && (
            error.message.includes('api key') || 
            error.message.includes('401') ||
            error.message.includes('quota') ||
            error.message.includes('insufficient_quota') ||
            error.code === 'insufficient_quota'
        )) {
            return 'Voice transcription failed. Your browser does not support voice recording. Please switch to Chrome or Edge browser for voice support, or type your message instead.';
        }
        
        // For other errors, return a generic browser message
        return 'Voice transcription is not supported in your current browser. Please switch to Chrome or Edge for voice recording support, or type your message instead.';
    }
}

// Alternative: Use Google Speech-to-Text (if you prefer Google services)
async function transcribeAudioWithGoogle(audioFilePath) {
    try {
        // This would require @google-cloud/speech package
        // const speech = require('@google-cloud/speech');
        // const client = new speech.SpeechClient();
        
        // For now, return a placeholder
        return '[Voice recording received - Google Speech-to-Text not implemented yet]';
        
    } catch (error) {
        console.error('[Transcription] Google Speech-to-Text error:', error);
        throw error;
    }
}

module.exports = {
    transcribeAudio,
    transcribeAudioWithGoogle
};