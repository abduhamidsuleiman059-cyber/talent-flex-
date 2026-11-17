// Lazima iwe ya kwanza: inatenganisha data za kila akaunti
import './utils/accountScope.js'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'
import './styles/mobile-fix.css'
import './styles/profile-fix.css'
// Lazima iwe ya mwisho: rangi za bluu zinazong'aa
import './styles/blue-theme.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Offline na kasi: service worker (kwenye toleo la mtandaoni tu, si npm run dev)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => {})
  })

  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'UPDATE_AVAILABLE') {
      window.__tfUpdate = true
      window.dispatchEvent(new Event('tf-update'))
    }
  })
}