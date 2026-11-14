import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { downloadVideoWithLogo } from '../utils/downloadWithLogo'
import '../styles/share.css'
import '../styles/share-download.css'

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.6-5.3A8.4 8.4 0 1 1 21 11.5z" />
      <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.7-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H6.5v3.5H9V21h3.5v-8.5H15L15.5 9h-3V6.8c0-.5.3-.8.8-.8H15z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  )
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <polyline points="7 11 12 16 17 11" />
      <path d="M4 20h16" />
    </svg>
  )
}

const IDLE = { status: 'idle', progress: 0, message: '' }

function errorText(err) {
  switch (err && err.code) {
    case 'UNSUPPORTED':
      return 'Kivinjari chako hakiruhusu kuandaa video. Tumia Chrome ya toleo jipya.'
    case 'PLAY_BLOCKED':
      return 'Kivinjari kimezuia kuanza kuandaa video. Gusa Download tena.'
    case 'LOAD_FAILED':
      return 'Imeshindwa kusoma video hii. Jaribu tena.'
    default:
      return 'Imeshindwa kuandaa video. Jaribu tena.'
  }
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 15000)
}

function ShareSheet({ video, onClose }) {
  const [copied, setCopied] = useState(false)
  const [dl, setDl] = useState(IDLE)
  const abortRef = useRef(null)

  const busy = dl.status === 'working'

  // BASE_URL ni "/talent-flex-/" mtandaoni na "/" kwenye kompyuta yako
  const link = `${window.location.origin}${import.meta.env.BASE_URL}?v=${video.id}`
  const message = `${video.username}: ${video.caption} - TalentFlex`
  const encodedLink = encodeURIComponent(link)
  const encodedMessage = encodeURIComponent(message)
  const encodedBoth = encodeURIComponent(`${message}\n${link}`)

  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share)

  // Usifunge paneli wakati video inaandaliwa (tumia Ghairi)
  const requestClose = () => {
    if (busy) return
    onClose()
  }

  // Funga kwa kubonyeza Esc
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  // Paneli ikiondoka, sitisha kuandaa video
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  const openUrl = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // Njia mbadala kwa vivinjari visivyoruhusu clipboard
      const input = document.createElement('textarea')
      input.value = link
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title: 'TalentFlex', text: message, url: link })
    } catch {
      // Mtumiaji amefunga menyu, hakuna cha kufanya
    }
  }

  const startDownload = async () => {
    if (busy) return

    if (!video.videoUrl) {
      setDl({
        status: 'error',
        progress: 0,
        message: 'Video hii ni ya mfano na haina faili ya kupakua. Jaribu video uliyopakia mwenyewe.'
      })
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    setDl({ status: 'working', progress: 0, message: '' })

    try {
      const { blob, ext } = await downloadVideoWithLogo({
        videoUrl: video.videoUrl,
        username: video.username,
        logoUrl: `${import.meta.env.BASE_URL}logo.png`,
        onProgress: (p) =>
          setDl(prev => (prev.status === 'working' ? { ...prev, progress: p } : prev)),
        signal: controller.signal
      })

      const who = video.username.replace('@', '')
      saveBlob(blob, `TalentFlex_${who}_${video.id}.${ext}`)

      setDl({
        status: 'done',
        progress: 1,
        message: `Video imehifadhiwa (.${ext}). Itafute kwenye Downloads au Vipakuliwa.`
      })
    } catch (err) {
      if (err && err.name === 'AbortError') {
        setDl(IDLE)
      } else {
        setDl({ status: 'error', progress: 0, message: errorText(err) })
      }
    } finally {
      abortRef.current = null
    }
  }

  const cancelDownload = () => {
    if (abortRef.current) abortRef.current.abort()
  }

  const percent = Math.round(dl.progress * 100)

  return createPortal(
    <div className="share-backdrop" onClick={requestClose}>
      <div
        className="share-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Shiriki"
      >
        <div className="share-handle" />

        <div className="share-header">
          <h3>Shiriki video</h3>
          <button
            className="share-close"
            onClick={requestClose}
            aria-label="Funga"
            disabled={busy}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="share-grid">
          <button
            className="share-option"
            onClick={() => openUrl(`https://wa.me/?text=${encodedBoth}`)}
          >
            <span className="share-circle whatsapp"><WhatsAppIcon /></span>
            <span>WhatsApp</span>
          </button>

          <button
            className="share-option"
            onClick={() => openUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`)}
          >
            <span className="share-circle facebook"><FacebookIcon /></span>
            <span>Facebook</span>
          </button>

          <button
            className="share-option"
            onClick={() => openUrl(`https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}`)}
          >
            <span className="share-circle x"><XIcon /></span>
            <span>X</span>
          </button>

          <button
            className="share-option"
            onClick={() => openUrl(`https://t.me/share/url?url=${encodedLink}&text=${encodedMessage}`)}
          >
            <span className="share-circle telegram"><TelegramIcon /></span>
            <span>Telegram</span>
          </button>

          <button className="share-option" onClick={copyLink}>
            <span className={copied ? 'share-circle copy done' : 'share-circle copy'}>
              {copied ? <CheckIcon /> : <LinkIcon />}
            </span>
            <span>{copied ? 'Imenakiliwa' : 'Nakili link'}</span>
          </button>

          <button className="share-option" onClick={startDownload} disabled={busy}>
            <span className="share-circle download"><DownloadIcon /></span>
            <span>Download</span>
          </button>

          {canNativeShare && (
            <button className="share-option" onClick={nativeShare}>
              <span className="share-circle more"><MoreIcon /></span>
              <span>Zaidi</span>
            </button>
          )}
        </div>

        {dl.status === 'working' && (
          <div className="dl-panel">
            <p className="dl-title">Inaandaa video yenye logo... {percent}%</p>
            <div className="dl-bar">
              <span style={{ width: `${percent}%` }} />
            </div>
            <p className="dl-hint">
              Usitoke kwenye ukurasa huu na usizime skrini hadi ikamilike.
            </p>
            <div className="dl-actions">
              <button className="dl-cancel" onClick={cancelDownload}>
                Ghairi
              </button>
            </div>
          </div>
        )}

        {dl.status === 'done' && (
          <div className="dl-panel done">
            <p className="dl-title">Imekamilika</p>
            <p className="dl-hint">{dl.message}</p>
          </div>
        )}

        {dl.status === 'error' && (
          <div className="dl-panel error">
            <p className="dl-title">Haikufanikiwa</p>
            <p className="dl-hint">{dl.message}</p>
          </div>
        )}

        <div className="share-link-box">
          <span className="share-link-text">{link}</span>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ShareSheet