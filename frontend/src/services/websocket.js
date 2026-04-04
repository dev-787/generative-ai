import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageHandlers = new Map();
    this.connectionPromise = null;
  }

  connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Connect to your backend WebSocket server
        this.socket = io('http://localhost:3000', {
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
          console.log('Received AI response:', data);
          const handler = this.messageHandlers.get('ai-response');
          if (handler) {
            handler(data);
          }
        });
        
        // Listen for chat history updates
        this.socket.on('chat-history-update', (data) => {
          console.log('Chat history update:', data);
          const handler = this.messageHandlers.get('chat-history-update');
          if (handler) {
            handler(data);
          }
        });
        
        // Listen for message updates in current chat
        this.socket.on('message-update', (data) => {
          console.log('Message update:', data);
          const handler = this.messageHandlers.get('message-update');
          if (handler) {
            handler(data);
          }
        });
        
        // Listen for general chat updates
        this.socket.on('chat-update', (data) => {
          console.log('Chat update:', data);
          const handler = this.messageHandlers.get('chat-update');
          if (handler) {
            handler(data);
          }
        });
        
        // Listen for chat title updates
        this.socket.on('chat-title-update', (data) => {
          console.log('Chat title update:', data);
          const handler = this.messageHandlers.get('chat-title-update');
          if (handler) {
            handler(data);
          }
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
      try {
        // Send message to backend
        this.socket.emit('ai-message', messageData);
        
        // Set up one-time listener for the response
        const responseHandler = (response) => {
          if (response.chat === messageData.chat) {
            this.socket.off('ai-response', responseHandler);
            resolve(response);
          }
        };
        
        this.socket.on('ai-response', responseHandler);
        
        // Set timeout for response
        setTimeout(() => {
          this.socket.off('ai-response', responseHandler);
          reject(new Error('Response timeout'));
        }, 30000); // 30 seconds timeout
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Register message handler
  onMessage(event, handler) {
    this.messageHandlers.set(event, handler);
  }

  // Remove message handler
  offMessage(event) {
    this.messageHandlers.delete(event);
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