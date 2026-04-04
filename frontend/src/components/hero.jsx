import { ArrowRight, Plus, Paperclip, Globe, Mic, Send, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

export function Hero() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="hero">
      {/* Navbar */}
      <nav className="nav-bar">
        <div className="logo">
          Aurora<span className="logo-highlight">AI</span>
        </div>
        <div className="nav-links">
        </div>
        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <button onClick={() => navigate('/chatbot')} className="btn-start">
                <Zap size={14} /> Go to Chatbot
              </button>
              <button onClick={handleLogout} className="theme-toggle">Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/chatbot')} className="btn-start">
                <Zap size={14} /> Go to Chatbot
              </button>
              <button onClick={() => navigate('/login')} className="btn-login">
                Login
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Content */}
      <div className="hero-container">
        {/* Left Column */}
        <div className="hero-left">
          <div className="users-badge">
            <div className="avatars">
              <img src="https://i.pravatar.cc/150?img=12" alt="user" className="avatar" />
              <img src="https://i.pravatar.cc/150?img=27" alt="user" className="avatar" />
              <img src="https://i.pravatar.cc/150?img=44" alt="user" className="avatar" />
            </div>
            <span>1,000+ Users worldwide</span>
          </div>

          <h1 className="hero-headline">
            AI Built to Keep You{' '}
            <span className="headline-gradient">Creative &amp; Ahead</span>{' '}
            of the Game
          </h1>

          <p className="hero-subheading">
            Work smarter, create faster, and make better decisions with an AI that truly understands you.
          </p>

          <div className="cta-buttons">
            <button className="btn-primary" onClick={() => navigate('/chatbot')}>
              Get Started Now
              <span className="btn-arrow"><ArrowRight /></span>
            </button>
            <button className="btn-secondary" onClick={() => navigate('/chatbot')}>
              Explore More
            </button>
          </div>

          <div className="trust-section">
            <p className="trust-text">Trusted by Users</p>
            <div className="rating-wrapper">
              <div className="stars">
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
                <span className="star">★</span>
              </div>
              <span className="rating-score">4.8</span>
            </div>
          </div>
        </div>

        {/* Right Column - AI Assistance Card */}
        <div className="hero-right" onClick={() => navigate('/chatbot')}>
          <div className="ai-card">
            <div className="ai-header">
              <div className="ai-icon">
                <div className="ai-icon-spinner"></div>
              </div>
              <h3>AI Assistance</h3>
            </div>

            <div className="category-tabs">
              <button className="tab-button active">Task</button>
              <button className="tab-button">Language</button>
              <button className="tab-button">Health</button>
              <button className="tab-button">Travel</button>
            </div>

            <div className="input-area">
              <input
                type="text"
                placeholder="Ask me anything..."
                className="input-field"
                readOnly
              />
              <div className="actions-row">
                <div className="actions-left">
                  <button className="action-button"><Plus /></button>
                  <button className="action-button"><Paperclip /></button>
                  <button className="action-button"><Globe /></button>
                </div>
                <div className="actions-right">
                  <button className="action-button"><Mic /></button>
                  <button className="action-button"><Send /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}