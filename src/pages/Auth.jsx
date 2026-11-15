import { useState } from 'react'
import { getAccounts, getAccountName, signIn, signUp } from '../utils/auth'
import '../styles/auth.css'

function EyeIcon({ off }) {
  return off ? (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// mode: 'first' (hujaingia) au 'add' (ongeza akaunti ukiwa ndani ya app)
function Auth({ mode }) {
  const accounts = getAccounts()
  const firstEver = accounts.length === 0

  const [tab, setTab] = useState(firstEver ? 'signup' : 'signin')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const goHome = () => {
    window.location.hash = '#/'
    window.location.reload()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    setError('')
    setBusy(true)

    try {
      if (tab === 'signup') {
        if (password !== confirm) throw new Error('Manenosiri hayafanani.')
        await signUp({ username, name, password })
      } else {
        await signIn(username, password)
      }
      goHome()
    } catch (err) {
      setError(err && err.message ? err.message : 'Imeshindwa. Jaribu tena.')
      setBusy(false)
    }
  }

  const switchTab = (next) => {
    setTab(next)
    setError('')
  }

  const cancelAdd = () => {
    window.location.hash = '#/settings'
  }

  return (
    <div className="au-wrapper">
      <h1 className="au-brand">TalentFlex</h1>
      <p className="au-tagline">
        {mode === 'add' ? 'Ongeza akaunti nyingine' : 'Onyesha kipaji chako'}
      </p>

      <div className="au-tabs">
        <button
          type="button"
          className={tab === 'signin' ? 'au-tab active' : 'au-tab'}
          onClick={() => switchTab('signin')}
        >
          Ingia
        </button>
        <button
          type="button"
          className={tab === 'signup' ? 'au-tab active' : 'au-tab'}
          onClick={() => switchTab('signup')}
        >
          Jisajili
        </button>
      </div>

      {tab === 'signup' && firstEver && (
        <p className="au-note">
          Akaunti ya kwanza kwenye kifaa hiki itahifadhi data ulizonazo tayari (video, wasifu,
          ujumbe na vingine).
        </p>
      )}

      {tab === 'signin' && accounts.length > 0 && (
        <div className="au-chips">
          {accounts.map(a => (
            <button
              key={a.id}
              type="button"
              className="au-chip"
              onClick={() => setUsername(a.username)}
            >
              {getAccountName(a)} · @{a.username}
            </button>
          ))}
        </div>
      )}

      <form className="au-form" onSubmit={handleSubmit}>
        {tab === 'signup' && (
          <div className="au-field">
            <label className="au-label" htmlFor="auName">Jina lako</label>
            <input
              id="auName"
              className="au-input"
              type="text"
              placeholder="Mfano: Abdu Hamid"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoComplete="name"
            />
          </div>
        )}

        <div className="au-field">
          <label className="au-label" htmlFor="auUser">Jina la mtumiaji</label>
          <input
            id="auUser"
            className="au-input"
            type="text"
            placeholder="mfano: abdu"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={21}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
          />
        </div>

        <div className="au-field">
          <label className="au-label" htmlFor="auPass">Nenosiri</label>
          <div className="au-input-wrap">
            <input
              id="auPass"
              className="au-input has-eye"
              type={showPw ? 'text' : 'password'}
              placeholder="Angalau herufi 6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              className="au-eye"
              onClick={() => setShowPw(v => !v)}
              aria-label={showPw ? 'Ficha nenosiri' : 'Onyesha nenosiri'}
            >
              <EyeIcon off={showPw} />
            </button>
          </div>
        </div>

        {tab === 'signup' && (
          <div className="au-field">
            <label className="au-label" htmlFor="auConfirm">Thibitisha nenosiri</label>
            <input
              id="auConfirm"
              className="au-input"
              type={showPw ? 'text' : 'password'}
              placeholder="Andika tena nenosiri"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        )}

        {error && <p className="au-error">{error}</p>}

        <button
          type="submit"
          className="au-submit"
          disabled={busy || !username || !password}
        >
          {busy ? 'Subiri...' : tab === 'signup' ? 'Fungua akaunti' : 'Ingia'}
        </button>

        {mode === 'add' && (
          <button type="button" className="au-cancel" onClick={cancelAdd}>
            Ghairi
          </button>
        )}
      </form>
    </div>
  )
}

export default Auth