import { useState, useEffect } from 'react'
import '../styles/status.css'

// Kidonge cha "Uko offline" na ujumbe wa toleo jipya
function AppStatus() {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  )
  const [update, setUpdate] = useState(Boolean(window.__tfUpdate))

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    const gotUpdate = () => setUpdate(true)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    window.addEventListener('tf-update', gotUpdate)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('tf-update', gotUpdate)
    }
  }, [])

  return (
    <>
      {!online && <div className="net-pill">Uko offline · app inaendelea kufanya kazi</div>}

      {update && (
        <div className="update-toast">
          <span>Toleo jipya la TalentFlex liko tayari</span>
          <button onClick={() => window.location.reload()}>Sasisha</button>
        </div>
      )}
    </>
  )
}

export default AppStatus