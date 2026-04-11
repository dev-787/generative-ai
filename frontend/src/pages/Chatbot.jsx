import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MarkdownMessage from '../components/MarkdownMessage.jsx'
import './Chatbot.scss'
import Sidebar from '../components/Sidebar.jsx'
import ChatHistory from '../components/ChatHistory.jsx'
import AuthModal from '../components/AuthModal.jsx'
import SearchOverlay from '../components/SearchOverlay.jsx'
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = React.useRef(null)
  const messagesEndRef = React.useRef(null)
  
  // Keep a ref to currentChat to avoid stale closures in socket handlers
  const currentChatRef = React.useRef(currentChat)
  useEffect(() => { currentChatRef.current = currentChat }, [currentChat])
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle chat-created event from server (lazy chat creation)
  useEffect(() => {
    if (!websocketService.isSocketConnected()) return
    const handleChatCreated = (data) => {
      setCurrentChat({ _id: data.chatId, title: 'New Chat' })
      websocketService.joinChat(data.chatId)
    }
    websocketService.onMessage('chat-created', handleChatCreated)
    return () => websocketService.offMessage('chat-created', handleChatCreated)
  }, [connectionStatus])

  // Handle real-time chat title updates
  useEffect(() => {
    if (!websocketService.isSocketConnected()) return
    const handleTitleUpdate = (data) => {
      const cur = currentChatRef.current
      if (cur && (cur._id === data.chatId || cur._id?.toString() === data.chatId?.toString())) {
        setCurrentChat(prev => ({ ...prev, title: data.title }))
      }
    }
    websocketService.onMessage('chat-title-update', handleTitleUpdate)
    return () => websocketService.offMessage('chat-title-update', handleTitleUpdate)
  }, [connectionStatus])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Initialize WebSocket connection and create default chat
  useEffect(() => {
    const initializeChat = async () => {
      if (!user) return
      
      try {
        setConnectionStatus('connecting')

        // Probe auth/session with a simple authorized endpoint
        try {
          await apiService.getChats()
        } catch (authErr) {
          if (authErr.message && (authErr.message.includes('401') || authErr.message.includes('Unauthorized'))) {
            // Local user exists but cookie/session missing -> force re-login
            await logout()
            navigate('/login', { replace: true, state: { from: '/chatbot' } })
            return
          }
        }
        
        // Connect to WebSocket
        await websocketService.connect()
        setConnectionStatus('connected')
        
        // Start with a clean empty state — chat is created lazily on first message
        
      } catch (error) {
        console.error('Failed to initialize chat:', error)
        setConnectionStatus('error')
        
        // Check for authentication errors first
        const isAuthError = (
          error.isAuthError || 
          (error.message && (
            error.message.includes('401') || 
            error.message.includes('Unauthorized') ||
            error.message.includes('fetch') ||
            error.message.includes('Failed to fetch')
          ))
        )
        
        if (isAuthError) {
          console.warn('Authentication/connection issue detected, showing auth modal')
          // Show auth modal instead of immediate logout
          setTimeout(() => {
            setShowAuthModal(true)
          }, 1000) // Small delay to let user see the error status
          return
        }
        
        // For any other connection error, also show the modal after some time
        console.warn('General connection error detected')
        setTimeout(() => {
          if (connectionStatus === 'error') {
            setShowAuthModal(true)
          }
        }, 2000)
        
        // If WebSocket fails, still allow the user to see the UI
        if (error.message && error.message.includes('WebSocket')) {
          console.warn('WebSocket failed, running in offline mode')
        }
      }
    }
    
    initializeChat()
    
    // Cleanup on unmount
    return () => {
      websocketService.disconnect()
    }
  }, [user])
  
  // Monitor connection status and show auth modal when needed
  useEffect(() => {
    if (connectionStatus === 'error' && user && !showAuthModal) {
      // Add a delay to avoid immediate popup during initial connection attempts
      const timer = setTimeout(() => {
        if (connectionStatus === 'error') {
          console.log('Connection error detected, showing auth modal')
          setShowAuthModal(true)
        }
      }, 3000) // 3 second delay to allow for connection attempts
      
      return () => clearTimeout(timer)
    }
  }, [connectionStatus, user, showAuthModal])
  
  const handleSearch = () => {
    setIsSearchOpen(true)
  }

  const handleSettings = () => {
    console.log('Settings clicked')
  }

  const handleLogout = async () => {
    console.log('Logout clicked')
    websocketService.disconnect()
    await logout()
  }
  
  const handleNewChat = () => {
    setCurrentChat(null)
    setMessages([])
    setMessage('')
  }
  
  const handleHistory = () => {
    console.log('Chat history clicked')
    setIsHistoryOpen(true)
  }
  
  const handleCloseHistory = () => {
    setIsHistoryOpen(false)
  }
  
  const handleCloseSearch = () => {
    setIsSearchOpen(false)
  }
  
  const handleNavigateToChat = async (chatId) => {
    try {
      setIsSearchOpen(false)
      
      // Get the chat and its messages
      const [chatResponse, messagesResponse] = await Promise.all([
        apiService.getChats().then(result => 
          result.chats.find(chat => chat._id === chatId)
        ),
        apiService.getChatMessages(chatId)
      ])
      
      if (chatResponse && messagesResponse) {
        setCurrentChat(chatResponse)
        
        // Join the chat room for real-time updates
        if (websocketService.isSocketConnected()) {
          websocketService.joinChat(chatId)
        }
        
        // Convert messages to the expected format
        const formattedMessages = messagesResponse.messages.map(msg => ({
          id: msg._id,
          content: msg.content,
          type: msg.role === 'user' ? 'user' : 'assistant',
          timestamp: new Date(msg.createdAt)
        }))
        
        setMessages(formattedMessages)
        console.log('Navigated to chat:', chatResponse.title || chatId)
      }
    } catch (error) {
      console.error('Failed to navigate to chat:', error)
    }
  }
  
  const handleSelectHistoryChat = (chat, chatMessages) => {
    // Load the selected chat into the current chat interface
    setCurrentChat(chat)
    
    // Join the selected chat room for real-time updates
    if (websocketService.isSocketConnected()) {
      websocketService.joinChat(chat._id)
    }
    
    // Convert messages to the expected format
    const formattedMessages = chatMessages.map(msg => ({
      id: msg._id,
      content: msg.content,
      type: msg.role === 'user' ? 'user' : 'assistant',
      timestamp: new Date(msg.createdAt)
    }))
    
    setMessages(formattedMessages)
    console.log('Selected chat:', chat, 'with', formattedMessages.length, 'messages')
  }
  
  const handleCloseAuthModal = () => {
    setShowAuthModal(false)
  }
  
  const handleRetryConnection = async () => {
    console.log('Retrying connection...')
    setConnectionStatus('connecting')
    setShowAuthModal(false)
    
    try {
      // Try to reconnect WebSocket
      await websocketService.connect()
      setConnectionStatus('connected')
      console.log('Connection retry successful')
    } catch (error) {
      console.error('Connection retry failed:', error)
      setConnectionStatus('error')
      // Show modal again after a brief delay
      setTimeout(() => {
        setShowAuthModal(true)
      }, 2000)
    }
  }
  
  const handleUpgrade = () => {
    console.log('Upgrade clicked')
  }
  
  const handleSidebarExpandedChange = (expanded) => {
    setIsSidebarExpanded(expanded)
  }
  
  const handleSendMessage = async () => {
    if ((!message.trim() && !attachedFile) || isLoading) return
    
    const userMessage = {
      id: Date.now(),
      content: message.trim() || '[Sent an attachment]',
      type: 'user',
      timestamp: new Date(),
      attachment: attachedFile
    }
    
    setMessages(prev => [...prev, userMessage])
    const currentMessage = message.trim()
    const currentAttachment = attachedFile
    setMessage('')
    setAttachedFile(null)  // don't revoke blob URL — it's still needed in the message
    setIsLoading(true)
    
    setTimeout(() => {
      const textarea = document.querySelector('.chat-input')
      if (textarea) textarea.style.height = 'auto'
    }, 0)
    
    try {
      let response
      const messageData = {
        content: currentMessage || '[Sent an attachment]',
        chat: currentChat?._id || null
      }
      if (currentAttachment) {
        messageData.attachment = {
          filename: currentAttachment.filename,
          originalName: currentAttachment.originalName,
          mimetype: currentAttachment.mimetype,
          size: currentAttachment.size,
          path: currentAttachment.path
        }
      }
      
      if (connectionStatus === 'connected' && websocketService.isSocketConnected()) {
        try {
          response = await websocketService.sendMessage(messageData)
        } catch (wsError) {
          response = { content: `Echo: "${currentMessage}" (Demo response)`, chat: currentChat._id }
        }
      } else {
        response = { content: `Echo: "${currentMessage}" (Demo response - backend not connected)`, chat: currentChat._id }
      }
      
      setMessages(prev => [...prev, { id: Date.now() + 1, content: response.content, type: 'assistant', timestamp: new Date() }])
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, content: 'Sorry, I encountered an error. Please try again.', type: 'assistant', timestamp: new Date() }])
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFileAttach = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('File size must be less than 10MB'); return }
    
    // Create local preview URL immediately
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await apiService.uploadFile(formData)
      setAttachedFile({ 
        filename: response.file.filename, 
        originalName: response.file.originalName, 
        mimetype: response.file.mimetype, 
        size: response.file.size, 
        path: response.file.path,
        previewUrl  // local blob URL for instant preview
      })
    } catch (error) {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      alert('Failed to upload file. Please try again.')
    }
    e.target.value = ''
  }

  const handleRemoveAttachment = () => {
    if (attachedFile?.previewUrl) URL.revokeObjectURL(attachedFile.previewUrl)
    setAttachedFile(null)
  }

  const handleVoiceRecord = async () => {
    if (!isRecording) {
      try {
        if (!navigator.mediaDevices?.getUserMedia) { alert('Your browser does not support voice recording.'); return }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
        
        let recognition = null
        let speechWorking = false
        
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SR = window.SpeechRecognition || window.webkitSpeechRecognition
          recognition = new SR()
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = 'en-US'
          recognition.onstart = () => { speechWorking = true }
          recognition.onresult = (event) => {
            let final = '', interim = ''
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const t = event.results[i][0].transcript
              event.results[i].isFinal ? final += t : interim += t
            }
            setMessage(prev => prev.replace(/\[Speaking: .*?\]/g, '') + (final || (interim ? `[Speaking: ${interim}]` : '')))
          }
          recognition.onerror = () => { speechWorking = false }
          recognition.onend = () => { speechWorking = false }
          recognition.start()
        }

        let recorder = null, chunks = []
        if (window.MediaRecorder) {
          const opts = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : {}
          recorder = new MediaRecorder(stream, opts)
          recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
          recorder.start(1000)
        }

        setMediaRecorder({ recorder, recognition, stream, chunks, getSpeechWorking: () => speechWorking })
        setIsRecording(true)
      } catch (error) {
        alert(`Microphone error: ${error.message}`)
      }
    } else {
      if (mediaRecorder) {
        const { recorder, recognition, stream, chunks, getSpeechWorking } = mediaRecorder
        if (recognition) recognition.stop()
        if (recorder?.state !== 'inactive') recorder.stop()
        stream.getTracks().forEach(t => t.stop())

        setTimeout(async () => {
          setMessage(prev => prev.replace(/\[Speaking: .*?\]/g, ''))
          const currentMsg = document.querySelector('.chat-input')?.value || ''
          const hasTranscript = currentMsg.trim().length > 0 && !currentMsg.includes('[Speaking:')

          if (!hasTranscript && chunks.length > 0) {
            setMessage(prev => prev + '[Transcribing...]')
            const blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' })
            if (blob.size > 0) {
              const formData = new FormData()
              formData.append('audio', blob, `recording-${Date.now()}.webm`)
              try {
                const response = await apiService.uploadVoice(formData)
                setMessage(prev => prev.replace('[Transcribing...]', ''))
                if (response.transcription?.trim()) {
                  setMessage(prev => prev + response.transcription.trim())
                } else {
                  setMessage(prev => prev + '[Transcription failed - please type your message]')
                }
              } catch {
                setMessage(prev => prev.replace('[Transcribing...]', '[Transcription failed - please type your message]'))
              }
            }
          }
        }, 1000)

        setIsRecording(false)
        setMediaRecorder(null)
      }
    }
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
        onSelectChat={handleSelectHistoryChat}
      />
      
      {/* Top navbar with essential actions */}
      <nav className="top-navbar">
        <div className="navbar-left">
          {currentChat && currentChat.title && currentChat.title !== 'New Chat' && (
            <span className="chat-title-text">
              {currentChat.title}
            </span>
          )}
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
                {msg.attachment?.mimetype?.startsWith('image/') && (msg.attachment?.previewUrl || msg.attachment?.path) && (
                  <img
                    src={msg.attachment.previewUrl || `http://localhost:3000${msg.attachment.path}`}
                    alt={msg.attachment.originalName}
                    className="message-image"
                  />
                )}
                {msg.content && msg.content !== '[Sent an attachment]' && (
                  <div className="message-text">
                    {msg.type === 'assistant'
                      ? <MarkdownMessage content={msg.content} />
                      : <span>{msg.content}</span>
                    }
                  </div>
                )}
              </div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Custom Input Component */}
        <div className="chat-input-container">
          {messages.length === 0 && (
            <h2 className="chat-welcome-heading">Where should we begin?</h2>
          )}
          <div className="chat-input-wrapper">
            {/* Hidden file input */}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*,.pdf,.txt,.doc,.docx" />

            {/* Attached file display */}
            {attachedFile && (
              <div className="attached-file">
                {attachedFile.mimetype?.startsWith('image/') ? (
                  <div className="attached-image-preview">
                    <img src={attachedFile.previewUrl || `http://localhost:3000${attachedFile.path}`} alt={attachedFile.originalName} className="preview-img" />
                    <button onClick={handleRemoveAttachment} className="remove-file-btn" title="Remove">✕</button>
                  </div>
                ) : (
                  <div className="file-info">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
                    <span className="file-name">{attachedFile.originalName}</span>
                    <span className="file-size">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
                    <button onClick={handleRemoveAttachment} className="remove-file-btn" title="Remove">✕</button>
                  </div>
                )}
              </div>
            )}

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
      
      {/* Chat History Modal */}
      <ChatHistory 
        isOpen={isHistoryOpen}
        onClose={handleCloseHistory}
        onSelectChat={handleSelectHistoryChat}
      />
      
      {/* Authentication Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={handleCloseAuthModal}
        onRetry={handleRetryConnection}
      />
      
      {/* Search Overlay */}
      <SearchOverlay 
        isOpen={isSearchOpen}
        onClose={handleCloseSearch}
        currentChat={currentChat}
        currentMessages={messages}
        onNavigateToChat={handleNavigateToChat}
      />
    </div>
  )
}

export default Chatbot
