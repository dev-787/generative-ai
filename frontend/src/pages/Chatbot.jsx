import React, { useEffect, useState } from 'react'
import './Chatbot.scss'
import Sidebar from '../components/Sidebar.jsx'
import searchIcon from '../assets/search.svg'
import settingIcon from '../assets/setting.svg'
import logoutIcon from '../assets/logout.svg'
import websocketService from '../services/websocket.js'
import apiService from '../services/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'

const Chatbot = () => {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [messages, setMessages] = useState([])
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [currentChat, setCurrentChat] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  
  const { user, logout } = useAuth()
  
  // Initialize WebSocket connection and create default chat
  useEffect(() => {
    const initializeChat = async () => {
      if (!user) return
      
      try {
        setConnectionStatus('connecting')
        
        // Connect to WebSocket
        await websocketService.connect()
        setConnectionStatus('connected')
        
        // Create or get default chat
        const chatResponse = await apiService.createChat('New Chat')
        setCurrentChat(chatResponse.chat)
        
        console.log('Chat initialized:', chatResponse.chat)
        
      } catch (error) {
        console.error('Failed to initialize chat:', error)
        setConnectionStatus('error')
        
        // If WebSocket fails, still try to create a chat for demo purposes
        if (error.message && error.message.includes('WebSocket')) {
          console.warn('WebSocket failed, creating demo chat...')
          try {
            const chatResponse = await apiService.createChat('New Chat')
            setCurrentChat(chatResponse.chat)
            console.log('Demo chat created:', chatResponse.chat)
          } catch (chatError) {
            console.error('Failed to create demo chat:', chatError)
            // Create a mock chat for demo purposes
            setCurrentChat({ _id: 'demo-chat-' + Date.now(), title: 'Demo Chat' })
          }
        }
      }
    }
    
    initializeChat()
    
    // Cleanup on unmount
    return () => {
      websocketService.disconnect()
    }
  }, [user])
  
  const handleSearch = () => {
    console.log('Search clicked')
  }

  const handleSettings = () => {
    console.log('Settings clicked')
  }

  const handleLogout = async () => {
    console.log('Logout clicked')
    websocketService.disconnect()
    await logout()
  }
  
  const handleNewChat = async () => {
    try {
      const chatResponse = await apiService.createChat('New Chat')
      setCurrentChat(chatResponse.chat)
      setMessages([])
      setMessage('')
      console.log('New chat created:', chatResponse.chat)
    } catch (error) {
      console.error('Failed to create new chat:', error)
    }
  }
  
  const handleHistory = () => {
    console.log('Chat history clicked')
  }
  
  const handleUpgrade = () => {
    console.log('Upgrade clicked')
  }
  
  const handleSidebarExpandedChange = (expanded) => {
    setIsSidebarExpanded(expanded)
  }
  
  const handleSendMessage = async () => {
    if (!message.trim() || !currentChat || isLoading) {
      return
    }
    
    const userMessage = {
      id: Date.now(),
      content: message.trim(),
      type: 'user',
      timestamp: new Date()
    }
    
    // Add user message to local state immediately
    setMessages(prev => [...prev, userMessage])
    const currentMessage = message.trim()
    setMessage('')
    setIsLoading(true)
    
    // Auto-resize textarea back to initial state
    setTimeout(() => {
      const textarea = document.querySelector('.chat-input')
      if (textarea) {
        textarea.style.height = 'auto'
      }
    }, 0)
    
    try {
      let response;
      
      // Try WebSocket first, fallback to HTTP if needed
      if (connectionStatus === 'connected' && websocketService.isSocketConnected()) {
        try {
          response = await websocketService.sendMessage({
            content: currentMessage,
            chat: currentChat._id
          })
          console.log('Received AI response via WebSocket:', response)
        } catch (wsError) {
          console.warn('WebSocket failed, trying HTTP fallback:', wsError)
          // For now, create a mock response
          response = {
            content: `Echo: "${currentMessage}" (Demo response - backend connection needed for AI)`,
            chat: currentChat._id
          }
        }
      } else {
        console.warn('WebSocket not connected, using demo response')
        // Create a mock response for demo
        response = {
          content: `Echo: "${currentMessage}" (Demo response - please ensure backend is running on port 3000)`,
          chat: currentChat._id
        }
      }
      
      // Add AI response to messages
      const aiMessage = {
        id: Date.now() + 1,
        content: response.content,
        type: 'assistant',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
      
    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        content: 'Sorry, I encountered an error. Please ensure the backend server is running on port 3000 and try again.',
        type: 'assistant',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFileAttach = () => {
    console.log('File attach clicked')
  }
  
  const handleVoiceRecord = () => {
    setIsRecording(!isRecording)
    console.log('Voice record clicked:', !isRecording)
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="chatbot-container">
      <Sidebar 
        onSearch={handleSearch}
        onSettings={handleSettings}
        onLogout={handleLogout}
        onNewChat={handleNewChat}
        onHistory={handleHistory}
        onUpgrade={handleUpgrade}
        onExpandedChange={handleSidebarExpandedChange}
      />
      
      {/* Top navbar with essential actions */}
      <nav className="top-navbar">
        <div className="navbar-left">
          <div className={`connection-status ${connectionStatus}`}>
            <div className="status-dot"></div>
            <span className="status-text">
              {connectionStatus === 'connected' && 'Connected'}
              {connectionStatus === 'connecting' && 'Connecting...'}
              {connectionStatus === 'disconnected' && 'Disconnected'}
              {connectionStatus === 'error' && 'Connection Error'}
            </span>
          </div>
        </div>
        <div className="navbar-right">
          <button onClick={handleSearch} className="nav-btn" data-tooltip="true">
            <img src={searchIcon} alt="Search" className="nav-icon" />
            <div className="tooltip">
              <span className="tooltip-text">Search</span>
              <span className="tooltip-shortcut">Ctrl+K</span>
            </div>
          </button>
          <button onClick={handleSettings} className="nav-btn" data-tooltip="true">
            <img src={settingIcon} alt="Settings" className="nav-icon" />
            <div className="tooltip">
              <span className="tooltip-text">Settings</span>
            </div>
          </button>
          <button onClick={handleLogout} className="nav-btn" data-tooltip="true">
            <img src={logoutIcon} alt="Logout" className="nav-icon" />
            <div className="tooltip">
              <span className="tooltip-text">Logout</span>
            </div>
          </button>
        </div>
      </nav>
      
      <main className={`main-content ${messages.length === 0 ? 'no-messages' : 'has-messages'} ${isSidebarExpanded ? 'sidebar-expanded' : ''}`}>
        {/* Chat messages */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.type}`}>
              <div className="message-content">
                {msg.content}
              </div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Custom Input Component */}
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            {/* Text Input Line */}
            <div className="input-text-line">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isLoading ? "AI is thinking..." : "What do you want to know?"}
                className="chat-input"
                rows="1"
                style={{ height: 'auto', minHeight: '24px', maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
                disabled={isLoading || connectionStatus !== 'connected'}
              />
            </div>
            
            {/* Actions Line */}
            <div className="input-actions-line">
              <div className="left-actions">
                <button 
                  onClick={handleFileAttach}
                  className="input-action-btn file-btn"
                  title="Attach file"
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M10 9V15C10 16.1046 10.8954 17 12 17V17C13.1046 17 14 16.1046 14 15V7C14 4.79086 12.2091 3 10 3V3C7.79086 3 6 4.79086 6 7V15C6 18.3137 8.68629 21 12 21V21C15.3137 21 18 18.3137 18 15V8" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
                
                <div className="auto-indicator">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.5 12.5L11.5 17.5M6.5 12.5L11.8349 6.83172C13.5356 5.02464 15.9071 4 18.3887 4H20V5.61135C20 8.09292 18.9754 10.4644 17.1683 12.1651L11.5 17.5M6.5 12.5L2 11L5.12132 7.87868C5.68393 7.31607 6.44699 7 7.24264 7H11M11.5 17.5L13 22L16.1213 18.8787C16.6839 18.3161 17 17.553 17 16.7574V13" stroke="currentColor" strokeLinecap="square"/>
                    <path d="M4.5 16.5C4.5 16.5 4 18 4 20C6 20 7.5 19.5 7.5 19.5" stroke="currentColor"/>
                  </svg>
                  <span>Auto</span>
                </div>
              </div>
              
              <div className="right-actions">
                <button 
                  onClick={handleVoiceRecord}
                  className={`input-action-btn voice-btn ${isRecording ? 'recording' : ''}`}
                  title="Voice input"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 10v3"/>
                    <path d="M6 6v11"/>
                    <path d="M10 3v18"/>
                    <path d="M14 8v7"/>
                    <path d="M18 5v13"/>
                    <path d="M22 10v3"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Chatbot
