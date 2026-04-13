import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageHandlers = new Map(); // event -> Set of handlers
    this.connectionPromise = null;
  }

  connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Connect to your backend WebSocket server
        this.socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000', {
          withCredentials: true, // This sends cookies for authentication
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          console.log('Connected to WebSocket server');
          this.isConnected = true;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Disconnected from WebSocket server:', reason);
          this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.isConnected = false;
          
          // Check if it's an authentication error
          if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            error.isAuthError = true;
          }
          
          reject(error);
        });
        
        // Handle authentication errors specifically
        this.socket.on('connect_error', (error) => {
          if (error.type === 'UnauthorizedError' || error.data?.type === 'UnauthorizedError') {
            console.error('WebSocket authentication failed');
            error.isAuthError = true;
          }
        });

        // Listen for AI responses
        this.socket.on('ai-response', (data) => {
          this._emit('ai-response', data);
        });
        
        // Listen for chat history updates
        this.socket.on('chat-history-update', (data) => {
          this._emit('chat-history-update', data);
        });
        
        // Listen for message updates in current chat
        this.socket.on('message-update', (data) => {
          this._emit('message-update', data);
        });
        
        // Listen for general chat updates
        this.socket.on('chat-update', (data) => {
          this._emit('chat-update', data);
        });
        
        // Listen for chat title updates
        this.socket.on('chat-title-update', (data) => {
          this._emit('chat-title-update', data);
        });

        // Listen for lazy chat creation confirmation
        this.socket.on('chat-created', (data) => {
          this._emit('chat-created', data);
        });

      } catch (error) {
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionPromise = null;
      this.messageHandlers.clear();
    }
  }

  // Join a specific chat room
  joinChat(chatId) {
    if (!this.isConnected || !this.socket) {
      console.warn('WebSocket not connected, cannot join chat');
      return;
    }
    
    console.log('Joining chat:', chatId);
    this.socket.emit('join-chat', chatId);
  }

  // Send message to AI
  async sendMessage(messageData) {
    if (!this.isConnected || !this.socket) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Response timeout'));
      }, 30000);

      // One-shot: next ai-response is ours
      this.socket.once('ai-response', (response) => {
        clearTimeout(timeout);
        resolve(response);
      });

      // If new chat, capture the created chatId before emitting
      if (!messageData.chat) {
        this.socket.once('chat-created', (data) => {
          messageData.chat = data.chatId;
        });
      }

      this.socket.emit('ai-message', messageData);
    });
  }

  // Register message handler (supports multiple handlers per event)
  onMessage(event, handler) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set())
    }
    this.messageHandlers.get(event).add(handler)
  }

  // Remove a specific handler, or all handlers if none specified
  offMessage(event, handler) {
    if (!this.messageHandlers.has(event)) return
    if (handler) {
      this.messageHandlers.get(event).delete(handler)
    } else {
      this.messageHandlers.delete(event)
    }
  }

  _emit(event, data) {
    const handlers = this.messageHandlers.get(event)
    if (handlers) handlers.forEach(h => h(data))
  }

  // Check connection status
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Reconnect if needed
  async ensureConnection() {
    if (!this.isSocketConnected()) {
      await this.connect();
    }
  }
}

// Create singleton instance
export default new WebSocketService();