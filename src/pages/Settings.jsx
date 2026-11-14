import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/settings.css'

const ME = '@wewe'
const PROFILE_KEY = 'talentflex-profile'
const APP_VERSION = '0.1 (demo)'

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg className="st-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function Settings() {
  const navigate = useNavigate()
  // confirm: null | 'photos' | 'all'
  const [confirm, setConfirm] = useState(null)
  const [message, setMessage] = useState('')

  const removePhotos = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(PROFILE_KEY))
      if (raw && typeof raw === 'object') {
        delete raw.avatar
        delete raw.cover
        localStorage.setItem(PROFILE_KEY, JSON.stringify(raw))
      }
      setMessage('Picha za wasifu zimefutwa.')
    } catch {
      setMessage('Imeshindwa kufuta picha.')
    }
    setConfirm(null)
  }

  const clearAll = async () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('talentflex-'))
        .forEach(k => localStorage.removeItem(k))
    } catch {
      // hakuna cha kufanya
    }

    try {
      sessionStorage.removeItem('talentflex-admin-ok')
    } catch {
      // hakuna cha kufanya
    }

    try {
      await new Promise(resolve => {
        const req = indexedDB.deleteDatabase('talentflex-db')
        req.onsuccess = resolve
        req.onerror = resolve
        req.onblocked = resolve
      })
    } catch {
      // hakuna cha kufanya
    }

    window.location.reload()
  }

  return (
    <div className="st-wrapper">
      <div className="st-header">
        <button
          className="st-back"
          onClick={() => navigate('/profile')}
          aria-label="Rudi"
        >
          <BackIcon />
        </button>
        <h2 className="st-title">Mipangilio</h2>
      </div>

      {message && <p className="st-message">{message}</p>}

      <div className="st-group">
        <h3 className="st-group-title">Akaunti</h3>
        <div className="st-card">
          <div className="st-row">
            <span>Jina la mtumiaji</span>
            <span className="st-value">{ME}</span>
          </div>
        </div>
        <p className="st-hint">
          Akaunti kamili (login na jina lako la kipekee) itakuja hivi karibuni.
        </p>
      </div>

      <div className="st-group">
        <h3 className="st-group-title">Msimamizi</h3>
        <div className="st-card">
          <button className="st-row" onClick={() => navigate('/admin')}>
            <span>Fungua Admin (ukaguzi wa video)</span>
            <ChevronIcon />
          </button>
        </div>
      </div>

      <div className="st-group">
        <h3 className="st-group-title">Data kwenye kifaa hiki</h3>
        <div className="st-card">
          <button
            className="st-row"
            onClick={() => {
              setMessage('')
              setConfirm('photos')
            }}
          >
            <span>Futa picha za wasifu</span>
            <ChevronIcon />
          </button>
          <button
            className="st-row danger"
            onClick={() => {
              setMessage('')
              setConfirm('all')
            }}
          >
            <span>Futa data zote za app</span>
            <ChevronIcon />
          </button>
        </div>
        <p className="st-hint">
          Data yote (video, maoni, likes, ujumbe) imehifadhiwa kwenye kivinjari hiki tu.
        </p>
      </div>

      {confirm === 'photos' && (
        <div className="st-confirm">
          <p>Futa picha ya wasifu na background?</p>
          <span>Jina na maelezo yako (bio) yatabaki.</span>
          <div className="st-confirm-actions">
            <button className="st-btn ghost" onClick={() => setConfirm(null)}>
              Ghairi
            </button>
            <button className="st-btn red" onClick={removePhotos}>
              Futa picha
            </button>
          </div>
        </div>
      )}

      {confirm === 'all' && (
        <div className="st-confirm">
          <p>Futa data zote za app?</p>
          <span>
            Video ulizopakia, maoni, likes, ujumbe, unaowafuata na wasifu wako vitafutwa.
            Hatua hii haiwezi kurudishwa.
          </span>
          <div className="st-confirm-actions">
            <button className="st-btn ghost" onClick={() => setConfirm(null)}>
              Ghairi
            </button>
            <button className="st-btn red" onClick={clearAll}>
              Futa zote
            </button>
          </div>
        </div>
      )}

      <div className="st-group">
        <h3 className="st-group-title">Kuhusu</h3>
        <div className="st-card">
          <div className="st-row">
            <span>Programu</span>
            <span className="st-value">TalentFlex</span>
          </div>
          <div className="st-row">
            <span>Toleo</span>
            <span className="st-value">{APP_VERSION}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings