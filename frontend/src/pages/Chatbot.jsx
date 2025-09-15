import React from 'react'
import './Chatbot.scss'

const Chatbot = () => {
  const [message, setMessage] = React.useState('')
  const [isRecording, setIsRecording] = React.useState(false)
  const [messages, setMessages] = React.useState([])
  
  const handleSearch = () => {
    console.log('Search clicked')
  }

  const handleSettings = () => {
    console.log('Settings clicked')
  }

  const handleLogout = () => {
    console.log('Logout clicked')
    // Add logout functionality here
  }
  
  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now(),
        text: message.trim(),
        type: 'user',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, newMessage])
      setMessage('')
      console.log('Message sent:', newMessage)
      
      // Auto-resize textarea back to initial state
      setTimeout(() => {
        const textarea = document.querySelector('.chat-input')
        if (textarea) {
          textarea.style.height = 'auto'
        }
      }, 0)
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
      <nav className="navbar">
        <div className="navbar-left">
          {/* AI Logo */}
          <div className="ai-logo">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A2,2 0 0,1 14,4C14,5.1 13.1,6 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2ZM16.5,8.5C17.9,8.5 19,9.6 19,11V15A6,6 0 0,1 13,21H11A6,6 0 0,1 5,15V11C5,9.6 6.1,8.5 7.5,8.5H16.5ZM7.5,10.5A0.5,0.5 0 0,0 7,11V15A4,4 0 0,0 11,19H13A4,4 0 0,0 17,15V11A0.5,0.5 0 0,0 16.5,10.5H7.5ZM9,12H15A1,1 0 0,1 16,13A1,1 0 0,1 15,14H9A1,1 0 0,1 8,13A1,1 0 0,1 9,12ZM9,15H11A1,1 0 0,1 12,16A1,1 0 0,1 11,17H9A1,1 0 0,1 8,16A1,1 0 0,1 9,15Z"/>
            </svg>
          </div>
        </div>
        
        <div className="navbar-right">
          <button onClick={handleSearch} className="nav-btn" data-tooltip="true">
            {/* Search Icon */}
            <svg viewBox="2 2 21 21" fill="none">
              <path d="M3 5L19 5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="round"/>
              <path d="M3 12H7" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="round"/>
              <circle cx="16" cy="15" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M19 18L21 20" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
              <path d="M3 19H7" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="round"/>
            </svg>
            <div className="tooltip">
              <span className="tooltip-text">Search</span>
              <span className="tooltip-shortcut">Ctrl+K</span>
            </div>
          </button>
          <button onClick={handleSettings} className="nav-btn" data-tooltip="true">
            {/* Settings Icon */}
            <svg viewBox="0 0 24 24" fill="none">
              <path stroke="currentColor" strokeWidth="2" d="M13.5 3h-3C9.408 5.913 8.024 6.711 4.956 6.201l-1.5 2.598c1.976 2.402 1.976 4 0 6.402l1.5 2.598c3.068-.51 4.452.288 5.544 3.201h3c1.092-2.913 2.476-3.711 5.544-3.2l1.5-2.599c-1.976-2.402-1.976-4 0-6.402l-1.5-2.598c-3.068.51-4.452-.288-5.544-3.201Z"/>
              <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
            </svg>
            <div className="tooltip">
              <span className="tooltip-text">Settings</span>
            </div>
          </button>
          <button onClick={handleLogout} className="nav-btn" data-tooltip="true">
            {/* Logout Icon */}
            <svg viewBox="0 0 24 24" fill="none">
              <path stroke="currentColor" strokeWidth="2" d="M9 12h11m0 0-4-4m4 4-4 4m-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4h4"/>
            </svg>
            <div className="tooltip">
              <span className="tooltip-text">Logout</span>
            </div>
          </button>
        </div>
      </nav>
      
      <main className={`main-content ${messages.length === 0 ? 'no-messages' : 'has-messages'}`}>
        {/* Chat messages */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.type}`}>
              <div className="message-content">
                {msg.text}
              </div>
              <div className="message-time">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                placeholder="What do you want to know?"
                className="chat-input"
                rows="1"
                style={{ height: 'auto', minHeight: '24px', maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
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
