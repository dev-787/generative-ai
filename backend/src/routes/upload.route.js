const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { authUser } = require('../middlewares/auth.middleware');
const { transcribeAudio } = require('../services/transcription.service');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // Audio types for voice recordings
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/wav',
        'audio/mp3',
        'audio/mpeg',
        'audio/ogg',
        'audio/mp4',
        'audio/x-wav',
        'audio/wave'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.log(`[Upload] Rejected file type: ${file.mimetype}`);
        cb(new Error(`Invalid file type: ${file.mimetype}. Only images, PDF, documents, and audio files are allowed.`));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Upload file endpoint
router.post('/file', authUser, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        res.status(200).json({
            message: 'File uploaded successfully',
            file: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: `/uploads/${req.file.filename}`
            }
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ message: 'Failed to upload file', error: error.message });
    }
});

// Upload voice recording endpoint
router.post('/voice', authUser, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No audio file uploaded' });
        }

        console.log('[Voice Upload] File received:', {
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
        
        const audioFilePath = path.join(__dirname, '../../uploads', req.file.filename);
        
        try {
            // Transcribe the audio using OpenAI Whisper
            console.log('[Voice Upload] Starting transcription...');
            const transcription = await transcribeAudio(audioFilePath);
            
            console.log('[Voice Upload] Transcription successful:', transcription.substring(0, 100) + '...');
            
            res.status(200).json({
                message: 'Voice recording transcribed successfully',
                transcription: transcription,
                file: {
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                    transcribed: true
                }
            });
            
        } catch (transcriptionError) {
            console.error('[Voice Upload] Transcription failed:', transcriptionError);
            
            // Return file info even if transcription fails
            res.status(200).json({
                message: 'Voice recording uploaded but transcription failed',
                transcription: `I received your voice message, but there was an issue with transcription: ${transcriptionError.message}. Could you try again or type your message instead?`,
                error: transcriptionError.message,
                file: {
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                    path: `/uploads/${req.file.filename}`,
                    transcribed: false
                }
            });
        }
        
    } catch (error) {
        console.error('[Voice Upload] Upload error:', error);
        res.status(500).json({ message: 'Failed to upload voice recording', error: error.message });
    }
});

module.exports = router;
