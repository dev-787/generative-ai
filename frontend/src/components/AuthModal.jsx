import React from 'react'
import { useNavigate } from 'react-router-dom'
import './AuthModal.scss'

const AuthModal = ({ isOpen, onClose, onRetry }) => {
  const navigate = useNavigate()

  const handleLogin = () => {
    onClose()
    navigate('/login', { state: { from: '/chatbot' } })
  }

  const handleSignup = () => {
    onClose()
    navigate('/register', { state: { from: '/chatbot' } })
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <div className="auth-modal-content">
          {/* Icon */}
          <div className="auth-modal-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
          </div>

          {/* Title */}
          <h2>Connection Failed</h2>

          {/* Description */}
          <p>
            It looks like you're not authenticated or your session has expired. 
            Please log in to continue using the chatbot.
          </p>

          {/* Action Buttons */}
          <div className="auth-modal-actions">
            <button 
              className="auth-btn primary"
              onClick={handleLogin}
            >
              Log In
            </button>
            
            <button 
              className="auth-btn secondary"
              onClick={handleSignup}
            >
              Sign Up
            </button>
          </div>

          {/* Retry Option */}
          <div className="auth-modal-retry">
            <span>Already logged in?</span>
            <button 
              className="retry-btn"
              onClick={handleRetry}
            >
              Retry Connection
            </button>
          </div>

          {/* Close Button */}
          <button 
            className="auth-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthModal