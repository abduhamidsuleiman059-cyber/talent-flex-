import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCurrent,
  getSessions,
  getAccountName,
  isOwner,
  switchTo,
  signOut,
  changePassword,
  deleteAccount,
  clearAccountData
} from '../utils/auth'
import { getSoundDefault, setSoundDefault } from '../utils/soundStore'
import { avatarGradient, avatarLetter } from '../utils/avatar'
import '../styles/settings.css'
import '../styles/settings-accounts.css'

const PROFILE_KEY = 'talentflex-profile'
const APP_VERSION = '0.2 (demo)'

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

function reloadHome() {
  window.location.hash = '#/'
  window.location.reload()
}

function Settings() {
  const navigate = useNavigate()
  const current = getCurrent()

  // panel: null | 'switch' | 'password' | 'photos' | 'data' | 'delete'
  const [panel, setPanel] = useState(null)
  const [message, setMessage] = useState('')
  const [soundOn, setSoundOn] = useState(getSoundDefault())

  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [deletePw, setDeletePw] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!current) return null

  const owner = isOwner(current)
  const others = getSessions().filter(a => a.id !== current.id)
  const myName = getAccountName(current)

  const openPanel = (name) => {
    setMessage('')
    setFormError('')
    setOldPw('')
    setNewPw('')
    setConfirmPw('')
    setDeletePw('')
    setPanel(prev => (prev === name ? null : name))
  }

  const handleSwitch = (id) => {
    if (switchTo(id)) reloadHome()
  }

  const handleSignOut = () => {
    signOut(current.id)
    reloadHome()
  }

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    setSoundDefault(next)
  }

  const submitPassword = async (e) => {
    e.preventDefault()
    if (busy) return
    setFormError('')

    if (newPw !== confirmPw) {
      setFormError('Manenosiri mapya hayafanani.')
      return
    }

    setBusy(true)
    try {
      await changePassword(current.id, oldPw, newPw)
      setPanel(null)
      setMessage('Nenosiri limebadilishwa.')
    } catch (err) {
      setFormError(err && err.message ? err.message : 'Imeshindwa kubadilisha nenosiri.')
    }
    setBusy(false)
  }

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
    setPanel(null)
  }

  const clearData = async () => {
    if (busy) return
    setBusy(true)
    await clearAccountData(current.ns)
    reloadHome()
  }

  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    if (busy) return
    setFormError('')
    setBusy(true)
    try {
      await deleteAccount(current.id, deletePw)
      reloadHome()
    } catch (err) {
      setFormError(err && err.message ? err.message : 'Imeshindwa kufuta akaunti.')
      setBusy(false)
    }
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

      {/* ===== Akaunti ===== */}
      <div className="st-group">
        <h3 className="st-group-title">Akaunti</h3>
        <div className="st-card">
          <div className="st-account">
            <span
              className="st-avatar"
              style={{ background: avatarGradient(`@${current.username}`) }}
            >
              {avatarLetter(myName)}
            </span>
            <span className="st-account-main">
              <span className="st-account-name">{myName}</span>
              <span className="st-account-handle">@{current.username}</span>
              {owner && <span className="st-owner">Msimamizi</span>}
            </span>
          </div>

          <button className="st-row" onClick={() => openPanel('switch')}>
            <span>Badilisha akaunti</span>
            <span className="st-value">{others.length > 0 ? others.length : ''}</span>
            <ChevronIcon />
          </button>

          {panel === 'switch' && (
            <div>
              {others.length === 0 ? (
                <p className="st-hint" style={{ padding: '0 16px 14px' }}>
                  Hakuna akaunti nyingine zilizoingia kwenye kifaa hiki. Tumia "Ongeza akaunti".
                </p>
              ) : (
                others.map(a => (
                  <button
                    key={a.id}
                    className="st-row"
                    onClick={() => handleSwitch(a.id)}
                  >
                    <span className="st-row-left">
                      <span
                        className="st-mini-avatar"
                        style={{ background: avatarGradient(`@${a.username}`) }}
                      >
                        {avatarLetter(getAccountName(a))}
                      </span>
                      <span className="st-row-text">
                        <span>{getAccountName(a)}</span>
                        <span className="st-row-sub">@{a.username}</span>
                      </span>
                    </span>
                    <ChevronIcon />
                  </button>
                ))
              )}
            </div>
          )}

          <button className="st-row" onClick={() => navigate('/add-account')}>
            <span>Ongeza akaunti</span>
            <ChevronIcon />
          </button>

          <button className="st-row danger" onClick={handleSignOut}>
            <span>Toka kwenye akaunti hii</span>
            <ChevronIcon />
          </button>
        </div>
        <p className="st-hint">
          Kila akaunti ina video, likes, ujumbe na wasifu vyake kwenye kifaa hiki.
        </p>
      </div>

      {/* ===== Usalama ===== */}
      <div className="st-group">
        <h3 className="st-group-title">Usalama</h3>
        <div className="st-card">
          <button className="st-row" onClick={() => openPanel('password')}>
            <span>Badilisha nenosiri</span>
            <ChevronIcon />
          </button>

          {panel === 'password' && (
            <form className="st-form" onSubmit={submitPassword}>
              <div className="st-field">
                <label className="st-label" htmlFor="stOld">Nenosiri la sasa</label>
                <input
                  id="stOld"
                  className="st-input"
                  type="password"
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="st-field">
                <label className="st-label" htmlFor="stNew">Nenosiri jipya</label>
                <input
                  id="stNew"
                  className="st-input"
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="st-field">
                <label className="st-label" htmlFor="stConfirm">Thibitisha nenosiri jipya</label>
                <input
                  id="stConfirm"
                  className="st-input"
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {formError && <p className="st-error">{formError}</p>}

              <button
                type="submit"
                className="st-primary"
                disabled={busy || !oldPw || !newPw || !confirmPw}
              >
                {busy ? 'Subiri...' : 'Hifadhi nenosiri'}
              </button>
            </form>
          )}
        </div>
        <p className="st-hint">
          Hakuna "umesahau nenosiri" kwa sasa, kwa sababu akaunti ziko kwenye kifaa hiki tu.
        </p>
      </div>

      {/* ===== Mapendeleo ===== */}
      <div className="st-group">
        <h3 className="st-group-title">Mapendeleo</h3>
        <div className="st-card">
          <div className="st-row st-static">
            <span>Video zianze na sauti</span>
            <button
              type="button"
              className={soundOn ? 'st-toggle on' : 'st-toggle'}
              onClick={toggleSound}
              role="switch"
              aria-checked={soundOn}
              aria-label="Video zianze na sauti"
            />
          </div>
        </div>
      </div>

      {/* ===== Msimamizi: unaonekana kwa mmiliki tu ===== */}
      {owner && (
        <div className="st-group">
          <h3 className="st-group-title">Msimamizi</h3>
          <div className="st-card">
            <button className="st-row" onClick={() => navigate('/admin')}>
              <span>Fungua Admin (usimamizi wa video)</span>
              <ChevronIcon />
            </button>
          </div>
        </div>
      )}

      {/* ===== Data ===== */}
      <div className="st-group">
        <h3 className="st-group-title">Data ya akaunti hii</h3>
        <div className="st-card">
          <button className="st-row" onClick={() => openPanel('photos')}>
            <span>Futa picha za wasifu</span>
            <ChevronIcon />
          </button>
          <button className="st-row danger" onClick={() => openPanel('data')}>
            <span>Futa data za akaunti hii</span>
            <ChevronIcon />
          </button>
          <button className="st-row danger" onClick={() => openPanel('delete')}>
            <span>Futa akaunti</span>
            <ChevronIcon />
          </button>
        </div>
      </div>

      {panel === 'photos' && (
        <div className="st-confirm">
          <p>Futa picha ya wasifu na background?</p>
          <span>Jina na maelezo yako (bio) yatabaki.</span>
          <div className="st-confirm-actions">
            <button className="st-btn ghost" onClick={() => setPanel(null)}>
              Ghairi
            </button>
            <button className="st-btn red" onClick={removePhotos}>
              Futa picha
            </button>
          </div>
        </div>
      )}

      {panel === 'data' && (
        <div className="st-confirm">
          <p>Futa data za akaunti hii?</p>
          <span>
            Video ulizopakia, maoni, likes, ujumbe, unaowafuata na wasifu wa akaunti hii vitafutwa.
            Akaunti yenyewe itabaki. Hatua hii haiwezi kurudishwa.
          </span>
          <div className="st-confirm-actions">
            <button className="st-btn ghost" onClick={() => setPanel(null)}>
              Ghairi
            </button>
            <button className="st-btn red" onClick={clearData} disabled={busy}>
              {busy ? 'Subiri...' : 'Futa data'}
            </button>
          </div>
        </div>
      )}

      {panel === 'delete' && (
        <form className="st-confirm" onSubmit={handleDeleteAccount}>
          <p>Futa akaunti kabisa?</p>
          <span>
            Akaunti na data zake zote vitafutwa. Weka nenosiri lako kuthibitisha. Hatua hii
            haiwezi kurudishwa.
          </span>
          <div className="st-field">
            <input
              className="st-input"
              type="password"
              placeholder="Nenosiri lako"
              value={deletePw}
              onChange={(e) => setDeletePw(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {formError && <p className="st-error">{formError}</p>}
          <div className="st-confirm-actions">
            <button type="button" className="st-btn ghost" onClick={() => setPanel(null)}>
              Ghairi
            </button>
            <button type="submit" className="st-btn red" disabled={busy || !deletePw}>
              {busy ? 'Subiri...' : 'Futa akaunti'}
            </button>
          </div>
        </form>
      )}

      {/* ===== Kuhusu ===== */}
      <div className="st-group">
        <h3 className="st-group-title">Kuhusu</h3>
        <div className="st-card">
          <div className="st-row st-static">
            <span>Programu</span>
            <span className="st-value">TalentFlex</span>
          </div>
          <div className="st-row st-static">
            <span>Toleo</span>
            <span className="st-value">{APP_VERSION}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings