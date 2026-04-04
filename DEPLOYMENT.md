# Vercel Deployment Guide

This project is configured for deployment on Vercel with both frontend and backend services.

## Prerequisites

- Vercel account (sign up at https://vercel.com)
- Git repository pushed to GitHub/GitLab/Bitbucket
- Node.js and npm installed locally

## Deployment Steps

### 1. Push to Git Repository
```bash
git add .
git commit -m "Add Vercel configuration"
git push origin main
```

### 2. Deploy on Vercel

**Option A: Using Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your repository
4. Vercel will auto-detect the `vercel.json` configuration
5. Add environment variables (see below)
6. Click "Deploy"

**Option B: Using Vercel CLI**
```bash
npm i -g vercel
vercel
```

## Environment Variables

Add these environment variables in your Vercel project settings:

### Backend Environment Variables
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `OPENAI_API_KEY` - OpenAI API key (if using)
- `PINECONE_API_KEY` - Pinecone API key (if using)
- `GOOGLE_API_KEY` - Google API key (if using)
- Any other `.env` variables from your backend

### Frontend Environment Variables
- `VITE_API_URL` - Backend API URL (e.g., `https://your-domain.vercel.app/_/backend`)
- `VITE_WS_URL` - WebSocket URL for real-time features

## Project Structure

```
project-root/
├── frontend/          # React + Vite app
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── backend/          # Express.js server
│   ├── src/
│   ├── server.js
│   └── package.json
├── vercel.json       # Vercel configuration
├── .vercelignore     # Files to ignore during build
└── README.md
```

## Configuration Details

### vercel.json
- **experimentalServices**: Defines frontend and backend as separate services
- **buildCommand**: Installs dependencies and builds the frontend
- **routePrefix**: Frontend serves at `/`, backend at `/_/backend`
- **runtime**: Backend uses Node.js 20.x

### .vercelignore
Excludes node_modules, logs, and build artifacts from deployment

## Important Notes

1. **API Routes**: Frontend calls backend API at `/_/backend/` (adjust in your frontend API service)
2. **WebSocket Support**: Vercel now supports WebSocket connections
3. **Database**: Make sure your MongoDB/database is accessible from Vercel's network
4. **CORS**: Update CORS settings in backend if needed for Vercel domains
5. **Port**: Backend uses port 3000 locally, but Vercel dynamically assigns ports in production

## Update Backend API Service

In `frontend/src/services/api.js`, ensure the API URL is set correctly:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// For websocket
import io from 'socket.io-client';
const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000');
```

## Troubleshooting

- **Build fails**: Check that all dependencies are listed in package.json
- **404 errors**: Verify the API routes and routePrefix in vercel.json
- **Environment variables not found**: Confirm variables are added in Vercel dashboard
- **CORS errors**: Update your backend CORS configuration for your Vercel domain
- **WebSocket connection fails**: Ensure WebSocket URL uses `wss://` for production

## Auto-Deployment

Any push to your main branch will automatically trigger a deployment on Vercel.

## More Help

- [Vercel Documentation](https://vercel.com/docs)
- [Node.js on Vercel](https://vercel.com/docs/functions/runtimes/node-js)
- [Vite on Vercel](https://vercel.com/docs/frameworks/vite)
