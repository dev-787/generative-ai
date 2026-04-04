import React from 'react'
import AppRoutes from './AppRoutes.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App