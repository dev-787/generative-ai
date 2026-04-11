import React, { useState, useEffect, useCallback } from 'react'
import './Sidebar.scss'
import penIcon from '../assets/pen.svg'
import historyIcon from '../assets/history.svg'
import imageIcon from '../assets/image.svg'
import voiceIcon from '../assets/voice.svg'
import apiService from '../services/api'
import websocketService from '../services/websocket'
import { useAuth } from '../contexts/AuthContext'

const Sidebar = ({
  onSearch,
  onSettings,
  onLogout,
  onNewChat,
  onHistory,
  onUpgrade,
  onExpandedChange,
  onSelectChat
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const toggleSidebar = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    if (onExpandedChange) onExpandedChange(newExpanded)
    if (newExpanded) loadChats()
  }

  const loadChats = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiService.getChats()
      const sorted = response.chats.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
      setChats(sorted.slice(0, 20))
    } catch (error) {
      console.error('Failed to load chats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const handleHistoryUpdate = () => loadChats()
    const handleTitleUpdate = (data) => {
      setChats(prev => {
        const exists = prev.some(c => c._id === data.chatId)
        if (exists) {
          return prev.map(c => c._id === data.chatId ? { ...c, title: data.title } : c)
        }
        loadChats()
        return prev
      })
    }
    websocketService.onMessage('chat-history-update', handleHistoryUpdate)
    websocketService.onMessage('chat-title-update', handleTitleUpdate)
    return () => {
      websocketService.offMessage('chat-history-update', handleHistoryUpdate)
      websocketService.offMessage('chat-title-update', handleTitleUpdate)
    }
  }, [loadChats])

  useEffect(() => {
    if (isExpanded) loadChats()
  }, [isExpanded, loadChats])

  const handleChatClick = async (e, chat) => {
    e.stopPropagation()
    try {
      const { messages } = await apiService.getChatMessages(chat._id)
      onSelectChat?.(chat, messages)
      setIsExpanded(false)
      onExpandedChange?.(false)
    } catch (error) {
      console.error('Failed to load chat:', error)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getUserInitials = () => {
    if (!user?.name) return 'U'
    const names = user.name.split(' ')
    return names.length > 1 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : names[0][0].toUpperCase()
  }

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : ''}`} onClick={toggleSidebar}>
      {/* Logo */}
      <div className="sidebar-logo" onClick={toggleSidebar}>
        {isExpanded ? (
          <span className="logo-text">Aurora<span className="logo-highlight">AI</span></span>
        ) : (
          <span className="logo-text-collapsed"><span className="logo-a">A</span><span className="logo-i">I</span></span>
        )}
      </div>

      {/* Nav */}
      <div className="sidebar-nav">
        <button onClick={(e) => { e.stopPropagation(); onNewChat(); }} className="sidebar-btn" title="New Chat">
          <img src={penIcon} alt="New Chat" className="sidebar-icon" />
          {isExpanded && <span className="btn-text">New Chat</span>}
        </button>

        <button onClick={(e) => { e.stopPropagation(); onHistory?.(); }} className="sidebar-btn" title="Chat History">
          <img src={historyIcon} alt="History" className="sidebar-icon" />
          {isExpanded && <span className="btn-text">History</span>}
        </button>

        <button onClick={(e) => e.stopPropagation()} className="sidebar-btn" title="Images">
          <img src={imageIcon} alt="Images" className="sidebar-icon" />
          {isExpanded && <span className="btn-text">Images</span>}
        </button>

        <button onClick={(e) => e.stopPropagation()} className="sidebar-btn" title="Audio">
          <img src={voiceIcon} alt="Audio" className="sidebar-icon" />
          {isExpanded && <span className="btn-text">Audio</span>}
        </button>

        <button onClick={(e) => { e.stopPropagation(); onUpgrade?.(); }} className="sidebar-btn premium" title="Upgrade">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          {isExpanded && <span className="btn-text">Upgrade</span>}
        </button>
      </div>

      {/* Chat History */}
      {isExpanded && (
        <div className="chat-history-section" onClick={(e) => e.stopPropagation()}>
          <div className="section-header">
            <span className="section-title">Your chats</span>
          </div>
          {loading ? (
            <div className="chats-loading"><div className="loading-spinner" /></div>
          ) : (
            <div className="chats-list">
              {chats.map((chat) => (
                <div key={chat._id} className="chat-item" onClick={(e) => handleChatClick(e, chat)}>
                  <div className="chat-info">
                    <span className="chat-title">{chat.title || 'New Chat'}</span>
                    <span className="chat-date">{formatDate(chat.lastActivity)}</span>
                  </div>
                </div>
              ))}
              {chats.length === 0 && <div className="no-chats"><span>No conversations yet</span></div>}
            </div>
          )}
        </div>
      )}

      {/* Bottom */}
      <div className="sidebar-bottom">
        <div className="profile-section" onClick={(e) => e.stopPropagation()}>
          <div className="profile-avatar">{getUserInitials()}</div>
          {isExpanded && (
            <div className="profile-info">
              <span className="profile-name">{user?.name || 'User'}</span>
              <span className="profile-email">{user?.email || ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
