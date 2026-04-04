import React, { useState } from 'react'
import './Sidebar.scss'
import penIcon from '../assets/pen.svg'
import historyIcon from '../assets/history.svg'
import imageIcon from '../assets/image.svg'
import boxIcon from '../assets/box.svg'
import voiceIcon from '../assets/voice.svg'

const Sidebar = ({
  onSearch,
  onSettings,
  onLogout,
  onNewChat,
  onHistory,
  onUpgrade,
  onExpandedChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const toggleSidebar = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    if (onExpandedChange) {
      onExpandedChange(newExpanded)
    }
  }
  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : ''}`} onClick={toggleSidebar}>
      {/* Logo at the top */}
      <div className="sidebar-logo">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A2,2 0 0,1 14,4C14,5.1 13.1,6 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2ZM16.5,8.5C17.9,8.5 19,9.6 19,11V15A6,6 0 0,1 13,21H11A6,6 0 0,1 5,15V11C5,9.6 6.1,8.5 7.5,8.5H16.5ZM7.5,10.5A0.5,0.5 0 0,0 7,11V15A4,4 0 0,0 11,19H13A4,4 0 0,0 17,15V11A0.5,0.5 0 0,0 16.5,10.5H7.5ZM9,12H15A1,1 0 0,1 16,13A1,1 0 0,1 15,14H9A1,1 0 0,1 8,13A1,1 0 0,1 9,12ZM9,15H11A1,1 0 0,1 12,16A1,1 0 0,1 11,17H9A1,1 0 0,1 8,16A1,1 0 0,1 9,15Z"/>
        </svg>
        {isExpanded && <span className="logo-text">AI Chat</span>}
      </div>

      {/* Main navigation icons */}
      <div className="sidebar-nav">
        <button 
          onClick={(e) => { e.stopPropagation(); onNewChat(); }}
          className="sidebar-btn"
          title="New Chat"
        >
          <img src={penIcon} alt="New Chat" className="sidebar-icon" />
          {isExpanded && <span className="btn-text">New Chat</span>}
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onHistory(); }}
          className="sidebar-btn"
          title="Chat History"
        >
          <img src={historyIcon} alt="History" className="sidebar-icon" />
          {isExpanded && <span className="btn-text">History</span>}
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); }}
          className="sidebar-btn"
          title="Images"
        >
          <img src={imageIcon} alt="Images" className="sidebar-icon" />
          {isExpanded && <span className="btn-text">Images</span>}
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); }}
          className="sidebar-btn"
          title="Audio"
        >
          <img src={voiceIcon} alt="Audio" className="sidebar-icon" />
          {isExpanded && <span className="btn-text">Audio</span>}
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onUpgrade(); }}
          className="sidebar-btn premium"
          title="Upgrade"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          {isExpanded && <span className="btn-text">Upgrade</span>}
        </button>
      </div>

      {/* Bottom actions */}
      <div className="sidebar-bottom">
        <button 
          onClick={(e) => { e.stopPropagation(); }}
          className="sidebar-btn"
          title="Archive"
        >
          <img src={boxIcon} alt="Archive" className="sidebar-icon" />
          {isExpanded && <span className="btn-text">Archive</span>}
        </button>
      </div>
    </div>
  )
}

export default Sidebar
