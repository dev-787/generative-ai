import React, { useState, useEffect, useCallback } from 'react'
import './ChatHistory.scss'
import apiService from '../services/api'
import websocketService from '../services/websocket'

const ChatHistory = ({ isOpen, onClose, onSelectChat }) => {
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadChatHistory = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      // Trigger cleanup of empty chats first (runs automatically on getChats, but we can also manual trigger)
      try {
        await apiService.cleanupEmptyChats()
        console.log('Empty chats cleanup triggered')
      } catch (cleanupError) {
        console.warn('Cleanup failed, continuing with chat load:', cleanupError)
      }
      
      const response = await apiService.getChats()
      
      // Sort chats by last activity (most recent first)
      const sortedChats = response.chats.sort((a, b) => 
        new Date(b.lastActivity) - new Date(a.lastActivity)
      )
      
      setChats(sortedChats)
    } catch (err) {
      console.error('Error loading chat history:', err)
      setError('Failed to load chat history')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadChatMessages = useCallback(async (chatId) => {
    try {
      setLoading(true)
      const response = await apiService.getChatMessages(chatId)
      setMessages(response.messages)
    } catch (err) {
      console.error('Error loading chat messages:', err)
      setError('Failed to load chat messages')
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Real-time chat history update handler
  const handleChatHistoryUpdate = useCallback((data) => {
    console.log('Chat history update received:', data);
    
    // Refresh the chat list to get latest activity times and ordering
    if (isOpen) {
      loadChatHistory();
    }
    
    // If the updated chat is currently selected, refresh its messages too
    if (selectedChat && selectedChat._id === data.chatId) {
      loadChatMessages(data.chatId);
    }
  }, [isOpen, selectedChat, loadChatHistory, loadChatMessages]);

  // Real-time message update handler for current chat
  const handleMessageUpdate = useCallback((data) => {
    console.log('Message update received:', data);
    
    // If the updated chat is currently selected, refresh its messages
    if (selectedChat && selectedChat._id === data.chatId) {
      loadChatMessages(data.chatId);
    }
  }, [selectedChat, loadChatMessages]);

  // Real-time chat title update handler
  const handleChatTitleUpdate = useCallback((data) => {
    console.log('Chat title update received:', data);
    
    // Update the chat title in the local state immediately
    setChats(prevChats => 
      prevChats.map(chat => 
        chat._id === data.chatId 
          ? { ...chat, title: data.title, lastActivity: new Date() }
          : chat
      )
    );
    
    // Also update the selected chat if it matches
    if (selectedChat && selectedChat._id === data.chatId) {
      setSelectedChat(prev => ({ ...prev, title: data.title }));
    }
    
    // Refresh the full chat list to get proper sorting by activity
    setTimeout(() => {
      if (isOpen) {
        loadChatHistory();
      }
    }, 500); // Small delay to ensure backend is updated
  }, [selectedChat, isOpen, loadChatHistory]);

  // Load chat list when modal opens
  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
      
      // Set up real-time listeners
      websocketService.onMessage('chat-history-update', handleChatHistoryUpdate);
      websocketService.onMessage('message-update', handleMessageUpdate);
      websocketService.onMessage('chat-title-update', handleChatTitleUpdate);
    } else {
      // Clean up listeners when modal closes
      websocketService.offMessage('chat-history-update');
      websocketService.offMessage('message-update');
      websocketService.offMessage('chat-title-update');
    }
    
    // Cleanup on unmount
    return () => {
      websocketService.offMessage('chat-history-update');
      websocketService.offMessage('message-update');
      websocketService.offMessage('chat-title-update');
    };
  }, [isOpen, handleChatHistoryUpdate, handleMessageUpdate, handleChatTitleUpdate])

  const handleChatSelect = (chat) => {
    setSelectedChat(chat)
    loadChatMessages(chat._id)
  }

  const handleContinueChat = () => {
    if (selectedChat && onSelectChat) {
      onSelectChat(selectedChat, messages)
      onClose()
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now - date
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getPreviewText = (chat) => {
    // For now, show title. Later we can show first message content
    return chat.title || 'New Chat'
  }

  if (!isOpen) return null

  return (
    <div className="chat-history-overlay">
      <div className="chat-history-modal">
        <div className="chat-history-header">
          <h2>Chat History</h2>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="chat-history-content">
          <div className="chat-list">
            <div className="chat-list-header">
              <h3>Your Conversations</h3>
              {chats.length > 0 && (
                <span className="chat-count">{chats.length} chats</span>
              )}
            </div>

            {loading && !selectedChat && (
              <div className="loading-state">
                <div className="spinner"></div>
                <span>Loading chats...</span>
              </div>
            )}

            {error && (
              <div className="error-state">
                <span>{error}</span>
                <button onClick={loadChatHistory}>Retry</button>
              </div>
            )}

            {!loading && chats.length === 0 && (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <h4>No chat history</h4>
                <p>Your conversations will appear here</p>
              </div>
            )}

            <div className="chat-items">
              {chats.map((chat) => (
                <div
                  key={chat._id}
                  className={`chat-item ${selectedChat?._id === chat._id ? 'selected' : ''}`}
                  onClick={() => handleChatSelect(chat)}
                >
                  <div className="chat-item-main">
                    <h4 className="chat-title">{getPreviewText(chat)}</h4>
                    <span className="chat-date">{formatDate(chat.lastActivity)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chat-preview">
            {selectedChat ? (
              <>
                <div className="chat-preview-header">
                  <h3>{selectedChat.title || 'Chat Preview'}</h3>
                  <button className="continue-chat-btn" onClick={handleContinueChat}>
                    Continue Chat
                  </button>
                </div>

                <div className="chat-preview-messages">
                  {loading ? (
                    <div className="loading-state">
                      <div className="spinner"></div>
                      <span>Loading messages...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="empty-messages">
                      <p>No messages in this chat</p>
                    </div>
                  ) : (
                    <div className="messages-list">
                      {messages.map((message) => (
                        <div
                          key={message._id}
                          className={`message-item ${message.role}`}
                        >
                          <div className="message-content">
                            {message.content}
                          </div>
                          <div className="message-time">
                            {new Date(message.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="no-chat-selected">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <h4>Select a chat</h4>
                <p>Choose a conversation to view its messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatHistory