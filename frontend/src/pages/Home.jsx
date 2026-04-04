import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import '../index.scss';

const Home = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // If user is authenticated, show the authenticated version
  if (isAuthenticated && user) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <div>
            <h2>Welcome, {user?.fullName?.firstName}!</h2>
            <p>Email: {user?.email}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/chatbot">
              <button style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                textDecoration: 'none'
              }}>
                Go to Chatbot
              </button>
            </Link>
            <button 
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h1>🏠 Home</h1>
          <p>This is the home page placeholder</p>
        </div>
      </div>
    )
  }

  // If user is not authenticated, show the public homepage
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <div>
          <h2>Welcome to Our Application!</h2>
          <p>Please login or register to access all features</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/login">
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              textDecoration: 'none'
            }}>
              Login
            </button>
          </Link>
          <Link to="/register">
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              textDecoration: 'none'
            }}>
              Register
            </button>
          </Link>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>🏠 Home Page</h1>
        <p>This is the public home page. You can access this without being logged in!</p>
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
          <h3>Features Available After Login:</h3>
          <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
            <li>Access to Chatbot</li>
            <li>Personalized Dashboard</li>
            <li>User Profile Management</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Home
