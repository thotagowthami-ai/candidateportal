import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
// 1. Import the Google Provider
import { GoogleOAuthProvider } from '@react-oauth/google'

// 2. Paste your copied Client ID inside these quotes
const GOOGLE_CLIENT_ID = "73706073214-l36kf2fs9ugt7vbgrndj9kkmrgvcmv5i.apps.googleusercontent.com";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 3. Wrap your App with the Provider */}
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)