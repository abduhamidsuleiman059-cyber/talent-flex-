import { useState } from 'react'
import {
  getAccounts,
  signIn,
  signUp,
  normalizeUsername,
  validateUsername
} from '../utils/auth'
import '../styles/auth-v2.css'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function AtIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function passwordScore(pw) {
  if (pw.length < 6) return 0
  let score = 1
  if (pw.length >= 10) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(4, score)
}

const STRENGTH_LABEL = ['Too short', 'Weak', 'Okay', 'Good', 'Strong']

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
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)

  const isSignup = tab === 'signup'
  const unameNorm = normalizeUsername(username)

  // Ujumbe wa papo hapo wa jina la mtumiaji (wakati wa kujisajili)
  let userHint = null
  if (isSignup && unameNorm.length > 0) {
    const invalidChar = /[^a-z0-9_.]/.test(unameNorm)
    if (unameNorm.length >= 3 || invalidChar) {
      const formatError = validateUsername(unameNorm)
      if (formatError) {
        userHint = { ok: false, text: formatError }
      } else if (accounts.some(a => a.username === unameNorm)) {
        userHint = { ok: false, text: 'Jina limetumika.' }
      } else {
        userHint = { ok: true, text: 'Available' }
      }
    }
  }

  const score = passwordScore(password)
  const mismatch = isSignup && confirm.length > 0 && confirm !== password

  const goHome = () => {
    window.location.hash = '#/'
    window.location.reload()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    setError('')
    setNotice('')
    setBusy(true)

    try {
      if (isSignup) {
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
    setNotice('')
  }

  const handleGoogle = () => {
    setError('')
    setNotice('Google login inakuja hivi karibuni.')
  }

  const cancelAdd = () => {
    window.location.hash = '#/settings'
  }

  return (
    <div className="av-wrapper">
      <div className="av-head">
        {logoFailed ? (
          <h1 className="av-brand">TalentFlex</h1>
        ) : (
          <img
            className="av-logo"
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="TalentFlex"
            draggable={false}
            onError={() => setLogoFailed(true)}
          />
        )}
        <p className="av-tagline">
          {mode === 'add' ? 'Add another account' : 'Watch, share & connect'}
        </p>
      </div>

      <div className="av-card">
        <div className="av-tabs" data-tab={tab}>
          <span className="av-tab-slider" />
          <button
            type="button"
            className={tab === 'signin' ? 'av-tab active' : 'av-tab'}
            onClick={() => switchTab('signin')}
          >
            Login
          </button>
          <button
            type="button"
            className={tab === 'signup' ? 'av-tab active' : 'av-tab'}
            onClick={() => switchTab('signup')}
          >
            Sign up
          </button>
        </div>

        <button type="button" className="av-google" onClick={handleGoogle}>
          <GoogleIcon />
          <span>Continue with Google</span>
        </button>

        {notice && (
          <p className="av-notice">
            <InfoIcon />
            <span>{notice}</span>
          </p>
        )}

        <div className="av-divider">or</div>

        <form className="av-form" onSubmit={handleSubmit}>
          {isSignup && (
            <div className="av-field">
              <label className="av-label" htmlFor="avName">Name</label>
              <div className="av-input-wrap av-wrap-focus">
                <span className="av-input-icon"><UserIcon /></span>
                <input
                  id="avName"
                  className="av-input"
                  type="text"
                  placeholder="e.g. Abdu Hamid"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="av-field">
            <label className="av-label" htmlFor="avUser">Username</label>
            <div className="av-input-wrap av-wrap-focus">
              <span className="av-input-icon"><AtIcon /></span>
              <input
                id="avUser"
                className="av-input"
                type="text"
                placeholder="e.g. abdu"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={21}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
              />
            </div>
            {userHint && (
              <p className={userHint.ok ? 'av-hint ok' : 'av-hint err'}>
                {userHint.ok ? <CheckIcon /> : <AlertIcon />}
                <span>{userHint.text}</span>
              </p>
            )}
          </div>

          <div className="av-field">
            <label className="av-label" htmlFor="avPass">Password</label>
            <div className="av-input-wrap av-wrap-focus">
              <span className="av-input-icon"><LockIcon /></span>
              <input
                id="avPass"
                className="av-input has-eye"
                type={showPw ? 'text' : 'password'}
                placeholder="6+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="av-eye"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                <EyeIcon off={showPw} />
              </button>
            </div>

            {isSignup && password.length > 0 && (
              <div className="av-meter" data-score={score}>
                <div className="av-meter-bars">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <span className="av-meter-label">{STRENGTH_LABEL[score]}</span>
              </div>
            )}
          </div>

          {isSignup && (
            <div className="av-field">
              <label className="av-label" htmlFor="avConfirm">Confirm password</label>
              <div className="av-input-wrap av-wrap-focus">
                <span className="av-input-icon"><ShieldIcon /></span>
                <input
                  id="avConfirm"
                  className="av-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {mismatch && (
                <p className="av-hint err">
                  <AlertIcon />
                  <span>Manenosiri hayafanani.</span>
                </p>
              )}
            </div>
          )}

          {error && <p className="av-error">{error}</p>}

          <button
            type="submit"
            className="av-submit"
            disabled={busy || !username || !password || (isSignup && !confirm)}
          >
            {busy ? 'Please wait...' : isSignup ? 'Create account' : 'Login'}
          </button>

          {mode === 'add' && (
            <button type="button" className="av-cancel" onClick={cancelAdd}>
              Cancel
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default Auth