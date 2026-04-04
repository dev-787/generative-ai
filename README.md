# 🚀 Generative AI Chat Platform

> A real-time, multi-modal Generative AI platform for text, image, voice, and file-based conversations — built on a persistent WebSocket architecture for instant, low-latency communication.

![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Language](https://img.shields.io/badge/language-JavaScript-yellow)
![Framework](https://img.shields.io/badge/framework-React.js%20%7C%20Express.js-orange)
![GitHub](https://img.shields.io/badge/GitHub-dev--787/generative--ai-black?logo=github)

---

## 📖 Overview

This is a **full-stack Generative AI product** that enables real-time, intelligent conversations across multiple input modalities — text, images, voice recordings, and file attachments.

Unlike traditional request-response chat systems, this platform maintains a **persistent WebSocket connection** between the client and server, delivering AI responses with minimal latency and no repeated API handshakes. All interactions are routed through a central AI Processing Engine that dispatches to the appropriate model based on input type.

---

## ✨ Features

- **Multi-modal input** — chat using text, images, voice recordings, or file attachments (PDF, DOCX, TXT, images up to 10MB)
- **Real-time streaming** — AI responses delivered instantly over WebSocket, no page reloads
- **Persistent connection** — single authenticated connection maintained for the entire session
- **Chat history** — all conversations stored and accessible across sessions
- **Search** — keyword search across current and past conversations
- **Secure auth** — JWT-based authentication gates the WebSocket connection
- **File uploads** — paperclip icon for attachments, microphone icon for voice (WebM format)
- **Voice recording** — in-browser recording with visual feedback; MediaRecorder API

---

## 🏗️ Architecture

```
User
 │
 ▼
Authentication (JWT)
 │
 ▼
WebSocket Connection
 │
 ▼
WebSocket Server (Node.js)
 │
 ▼
AI Processing Engine
 ├── Text  ──────► LLM (text response)
 ├── Image ──────► Image understanding model
 ├── Voice ──────► Voice processing / speech-to-text
 └── Text  ──────► Text-to-image generation
 │
 ▼
Response streamed to Frontend UI
 │
 ▼
Chat Storage (MongoDB)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js, SCSS, CSS, WebSocket Client |
| **Backend** | Node.js, Express.js, WebSocket Server |
| **File Uploads** | Multer (multipart middleware) |
| **AI Models** | LLMs, Image Processing, Voice APIs, Text-to-Image |
| **Database** | MongoDB (chat history + user data) |
| **Auth** | JWT (JSON Web Tokens) |

> The repo is ~53% JavaScript, ~26% SCSS, ~17% CSS, ~3% HTML.

---

## 📁 Project Structure

```
generative-ai/
├── frontend/               # React UI — chat interface, input controls, WebSocket client
├── backend/
│   ├── src/
│   │   └── routes/
│   │       └── upload.route.js   # File & voice upload endpoints
│   └── uploads/            # Uploaded files (gitignored)
└── FILE_UPLOAD_FEATURES.md # Feature docs for file & voice upload
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload/file` | Upload a file attachment (images, PDF, DOCX, TXT — max 10MB) |
| `POST` | `/api/upload/voice` | Upload a WebM voice recording |

Uploaded files are served statically at `/uploads`. Authentication middleware is required for both endpoints.

---

## 🚀 Getting Started

### Prerequisites

- Node.js
- MongoDB instance (local or Atlas)
- API keys for your AI models

### Installation

```bash
# Clone the repo
git clone https://github.com/dev-787/generative-ai.git
cd generative-ai

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the App

```bash
# Start backend
cd backend
npm start

# Start frontend (new terminal)
cd frontend
npm start
```

---

## 🔐 Security Notes

- File type validation enforced on both frontend and backend
- 10MB file size limit per upload
- Uploaded files stored outside the public directory
- JWT required for WebSocket connection and all upload endpoints
- MediaRecorder API requires HTTPS in production

---

## 🗺️ Roadmap

- [ ] Image preview rendered inside chat messages
- [ ] Audio playback controls for voice messages
- [ ] Speech-to-text transcription for voice recordings
- [ ] Multiple file attachments per message
- [ ] File download from chat
- [ ] Virus scanning for uploaded files
- [ ] File compression for larger uploads

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Dev Tailor**
GitHub: [github.com/dev-787](https://github.com/dev-787)
