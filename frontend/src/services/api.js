const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for sending cookies
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData) {
    const { firstName, lastName, email, password } = userData;
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: {
          firstName,
          lastName
        },
        email,
        password
      }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Chat endpoints
  async createChat(title) {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async getChats() {
    return this.request('/chat');
  }

  async getChat(chatId) {
    return this.request(`/chat/${chatId}`);
  }

  async getChatMessages(chatId) {
    return this.request(`/messages/chat/${chatId}`);
  }

  async cleanupEmptyChats(excludeChatId = null) {
    const url = excludeChatId ? `/chat/cleanup?excludeChatId=${excludeChatId}` : '/chat/cleanup';
    return this.request(url, {
      method: 'DELETE'
    });
  }

  async uploadFile(formData) {
    const response = await fetch(`${API_BASE_URL}/upload/file`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Upload failed');
    return data;
  }

  async uploadVoice(formData) {
    const response = await fetch(`${API_BASE_URL}/upload/voice`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Voice upload failed');
    return data;
  }
}

export default new ApiService();
