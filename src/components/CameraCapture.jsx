import { useEffect, useRef, useState } from 'react'
import '../styles/camera.css'

const MODES = [
  { id: 15, label: '15s' },
  { id: 60, label: '60s' },
  { id: 180, label: '3m' }
]
const RING_C = 2 * Math.PI * 46

function pickMime() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return ''
  const types = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ]
  return types.find(t => MediaRecorder.isTypeSupported(t)) || ''
}

function fmt(sec) {
  const total = Math.floor(sec)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function FlipIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-15.5-6.2L3 8" />
      <polyline points="3 3 3 8 8 8" />
      <path d="M3 12a9 9 0 0 0 15.5 6.2L21 16" />
      <polyline points="21 21 21 16 16 16" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="9" r="1.8" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  )
}

function CameraOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    </svg>
  )
}

function CameraCapture({ onRecorded, onPick, onClose }) {
  const [facing, setFacing] = useState('user')
  const [modeSec, setModeSec] = useState(60)
  // starting | ready | denied | unsupported
  const [status, setStatus] = useState('starting')
  const [attempt, setAttempt] = useState(0)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const startedAtRef = useRef(0)
  const discardRef = useRef(false)
  const pickerRef = useRef(null)

  const stopStream = () => {
    const stream = streamRef.current
    if (stream) stream.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  // Washa kamera (na kila unapoigeuza)
  useEffect(() => {
    let cancelled = false

    async function start() {
      stopStream()

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia ||
        typeof MediaRecorder === 'undefined'
      ) {
        setStatus('unsupported')
        return
      }

      setStatus('starting')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1080 },
            height: { ideal: 1920 }
          },
          audio: true
        })

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        streamRef.current = stream
        const el = videoRef.current
        if (el) {
          el.srcObject = stream
          el.muted = true
          await el.play().catch(() => {})
        }
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        const name = err && err.name
        setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unsupported')
      }
    }

    start()
    return () => {
      cancelled = true
    }
  }, [facing, attempt])

  // Ukiondoka: zima kamera na rekodi
  useEffect(() => {
    return () => {
      discardRef.current = true
      clearInterval(timerRef.current)
      const rec = recorderRef.current
      if (rec && rec.state !== 'inactive') {
        try {
          rec.stop()
        } catch {
          // tayari imesimama
        }
      }
      stopStream()
    }
  }, [])

  const stopRecording = () => {
    const rec = recorderRef.current
    if (rec && rec.state !== 'inactive') {
      try {
        rec.stop()
      } catch {
        // tayari imesimama
      }
    }
  }

  const startRecording = () => {
    const stream = streamRef.current
    if (!stream) return

    const mime = pickMime()
    let rec
    try {
      rec = new MediaRecorder(
        stream,
        mime ? { mimeType: mime, videoBitsPerSecond: 4000000 } : undefined
      )
    } catch {
      setStatus('unsupported')
      return
    }

    chunksRef.current = []
    discardRef.current = false

    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }

    rec.onstop = () => {
      clearInterval(timerRef.current)
      setRecording(false)
      if (discardRef.current) return

      const seconds = (Date.now() - startedAtRef.current) / 1000
      if (seconds < 1) return

      const type = (rec.mimeType || mime || 'video/webm').split(';')[0]
      const ext = type.includes('mp4') ? 'mp4' : 'webm'
      const blob = new Blob(chunksRef.current, { type })
      if (blob.size === 0) return

      const file = new File([blob], `talentflex-${Date.now()}.${ext}`, { type })
      file.tfDuration = seconds
      onRecorded(file)
    }

    recorderRef.current = rec
    startedAtRef.current = Date.now()
    rec.start(1000)
    setRecording(true)
    setElapsed(0)

    const limit = modeSec
    timerRef.current = setInterval(() => {
      const s = (Date.now() - startedAtRef.current) / 1000
      setElapsed(s)
      if (s >= limit) stopRecording()
    }, 100)
  }

  const toggleRecord = () => {
    if (status !== 'ready') return
    if (recording) stopRecording()
    else startRecording()
  }

  const handleClose = () => {
    discardRef.current = true
    stopRecording()
    stopStream()
    onClose()
  }

  const handlePicked = (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (file) onPick(file)
  }

  const openPicker = () => {
    if (pickerRef.current) pickerRef.current.click()
  }

  const progress = Math.min(1, elapsed / modeSec)
  const ready = status === 'ready'

  return (
    <div className="cam-root">
      <div className="cam-stage">
        <video
          ref={videoRef}
          className={
            'cam-video' +
            (facing === 'user' ? ' mirror' : '') +
            (ready ? '' : ' hidden')
          }
          playsInline
          muted
          autoPlay
        />

        {status === 'starting' && (
          <div className="cam-overlay">
            <div className="cam-spinner" />
            <p>Inawasha kamera...</p>
          </div>
        )}

        {(status === 'denied' || status === 'unsupported') && (
          <div className="cam-overlay">
            <CameraOffIcon />
            <h2>{status === 'denied' ? 'Kamera imezuiwa' : 'Kamera haipatikani'}</h2>
            <p>
              {status === 'denied'
                ? 'Ruhusu kamera na maikrofoni kwenye kivinjari chako ili kurekodi, au chagua video kutoka kwenye simu.'
                : 'Kivinjari au kifaa hiki hakiruhusu kurekodi hapa. Chagua video kutoka kwenye simu.'}
            </p>
            <button className="cam-overlay-btn" onClick={openPicker}>
              Chagua video kutoka kwenye simu
            </button>
            {status === 'denied' && (
              <button className="cam-overlay-btn ghost" onClick={() => setAttempt(a => a + 1)}>
                Jaribu tena
              </button>
            )}
          </div>
        )}

        <div className="cam-top">
          <button className="cam-icon-btn" onClick={handleClose} aria-label="Funga">
            <CloseIcon />
          </button>

          {recording ? (
            <div className="cam-timer">
              <span className="cam-dot" />
              {fmt(elapsed)} / {fmt(modeSec)}
            </div>
          ) : (
            <span />
          )}

          <span className="cam-spacer" />
        </div>

        {ready && (
          <div className="cam-side">
            <button
              className="cam-side-btn"
              onClick={() => setFacing(f => (f === 'user' ? 'environment' : 'user'))}
              disabled={recording}
              aria-label="Geuza kamera"
            >
              <FlipIcon />
              <span>Geuza</span>
            </button>
          </div>
        )}
      </div>

      <div className="cam-bottom">
        <div className="cam-modes">
          {MODES.map(m => (
            <button
              key={m.id}
              className={modeSec === m.id ? 'cam-mode active' : 'cam-mode'}
              onClick={() => setModeSec(m.id)}
              disabled={recording}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="cam-controls">
          <button className="cam-gallery" onClick={openPicker} disabled={recording}>
            <span className="cam-gallery-box">
              <ImageIcon />
            </span>
            <span>Pakia</span>
          </button>

          <button
            className={recording ? 'cam-rec recording' : 'cam-rec'}
            onClick={toggleRecord}
            disabled={!ready}
            aria-label={recording ? 'Simamisha kurekodi' : 'Anza kurekodi'}
          >
            <svg className="cam-ring" viewBox="0 0 100 100">
              <circle className="cam-ring-bg" cx="50" cy="50" r="46" />
              <circle
                className="cam-ring-fg"
                cx="50"
                cy="50"
                r="46"
                style={{
                  strokeDasharray: RING_C,
                  strokeDashoffset: RING_C * (1 - progress)
                }}
              />
            </svg>
            <span className="cam-rec-core" />
          </button>

          <span className="cam-end" />
        </div>
      </div>

      <input
        ref={pickerRef}
        type="file"
        accept="video/*"
        hidden
        onChange={handlePicked}
      />
    </div>
  )
}

export default CameraCapture