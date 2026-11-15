// Lazima iwe ya kwanza: inatenganisha data za kila akaunti
import './utils/accountScope.js'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'
import './styles/mobile-fix.css'
import './styles/profile-fix.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)