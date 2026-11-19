import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVideos } from '../context/VideoContext'
import CameraCapture from '../components/CameraCapture'
import OverlayLayer from '../components/OverlayLayer'
import EditedPlayer from '../components/EditedPlayer'
import Avatar from '../components/Avatar'
import { WhatsAppIcon, TelegramIcon, FacebookIcon, XIcon } from '../components/SocialIcons'
import {
  BackIcon,
  CloseIcon,
  MusicIcon,
  GearIcon,
  ScissorsIcon,
  TextIcon,
  StickerIcon,
  FilterIcon,
  MinusIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  PlayIcon
} from '../components/EditorIcons'
import {
  TrimSheet,
  FilterSheet,
  StickerSheet,
  MusicSheet,
  SettingsSheet,
  TextEditor,
  TEXT_COLORS
} from '../components/EditorSheets'
import { useMusicSync } from '../utils/useMusicSync'
import { getFilterCss } from '../utils/videoFilters'
import { frameDataUrl, captureFrame, cropToDataUrl } from '../utils/imageTools'
import { addStatus, STATUS_TTL_MS } from '../utils/statusStore'
import { authorInfo, myHandle } from '../utils/statusAuthor'
import '../styles/upload-editor.css'
import '../styles/upload-cover.css'
import '../styles/upload-tiktok.css'
import '../styles/editor-tiktok.css'

// Muda wa juu wa video (sekunde): dakika 30
const MAX_SECONDS = 30 * 60
// Video iliyopunguzwa isiwe fupi kuliko sekunde 1
const MIN_CLIP = 1
// Vikomo vya status
const STATUS_MAX_S = 30
const STATUS_MAX_MB = 80
const MAX_OVERLAYS = 12
const TAGS = ['#TalentFlex', '#Kipaji', '#Tanzania', '#BongoTalent', '#Muziki', '#Mpira']

const SHARE_APPS = [
  { id: 'whatsapp', label: 'WhatsApp', Icon: WhatsAppIcon },
  { id: 'telegram', label: 'Telegram', Icon: TelegramIcon },
  { id: 'facebook', label: 'Facebook', Icon: FacebookIcon },
  { id: 'x', label: 'X', Icon: XIcon }
]

function shareUrl(appId, text, link) {
  const t = encodeURIComponent(text)
  const l = encodeURIComponent(link)
  switch (appId) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(`${text}\n${link}`)}`
    case 'telegram':
      return `https://t.me/share/url?url=${l}&text=${t}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${l}`
    default:
      return `https://twitter.com/intent/tweet?text=${t}&url=${l}`
  }
}

function fmt(sec) {
  const total = Math.max(0, Math.round(sec))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function newId(prefix) {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 6)}`
}

function isAudioFile(file) {
  return (
    (file.type && file.type.startsWith('audio/')) ||
    /\.(mp3|m4a|aac|wav|ogg|opus|flac|amr)$/i.test(file.name || '')
  )
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={open ? 'ud-chevron open' : 'ud-chevron'}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function Upload() {
  const navigate = useNavigate()
  const { publishVideo } = useVideos()

  const [file, setFile] = useState(null)
  const [url, setUrl] = useState(null)
  const [duration, setDuration] = useState(0)
  const [durationFixed, setDurationFixed] = useState(false)
  const [loadError, setLoadError] = useState('')

  // edit | details | cover | done
  const [step, setStep] = useState('edit')
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [filterId, setFilterId] = useState('none')
  const [caption, setCaption] = useState('')
  const [showTags, setShowTags] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareApps, setShareApps] = useState([])
  const [preview, setPreview] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [savedOk, setSavedOk] = useState(true)
  const [cover, setCover] = useState('')
  const [coverTouched, setCoverTouched] = useState(false)
  const [coverTime, setCoverTime] = useState(0)
  const [coverError, setCoverError] = useState('')

  // Zana za kuhariri
  const [overlays, setOverlays] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  // null | trim | filter | sticker | music | settings
  const [tool, setTool] = useState(null)
  const [textDraft, setTextDraft] = useState(null)
  const [music, setMusic] = useState(null)
  const [musicError, setMusicError] = useState('')
  const [musicVol, setMusicVol] = useState(0.9)
  const [videoVol, setVideoVol] = useState(1)
  const [allowComments, setAllowComments] = useState(true)
  const [toast, setToast] = useState('')
  const [statusBusy, setStatusBusy] = useState(false)

  const pickerRef = useRef(null)
  const coverImgRef = useRef(null)
  const captionRef = useRef(null)
  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const coverVideoRef = useRef(null)
  const frameRef = useRef(null)
  const dragRef = useRef(null)
  const toastTimer = useRef(null)
  const publishedUrlRef = useRef(null)

  const clipLength = Math.max(0, trimEnd - trimStart)
  const minGap = Math.min(MIN_CLIP, duration)
  const sliderStep = duration > 120 ? 1 : 0.1
  const filterCss = getFilterCss(filterId)

  const me = myHandle()
  const myInfo = authorInfo(me)

  const showToast = (message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2200)
  }

  useEffect(() => {
    return () => clearTimeout(toastTimer.current)
  }, [])

  // Soma video mpya na weka hali ya kuanzia
  useEffect(() => {
    if (!file) return

    let cancelled = false
    const objectUrl = URL.createObjectURL(file)
    const probe = document.createElement('video')
    probe.preload = 'metadata'

    setLoadError('')
    setUrl(null)
    setStep('edit')
    setFilterId('none')
    setCaption('')
    setShowTags(false)
    setShareOpen(false)
    setShareApps([])
    setPreview(false)
    setPlaying(false)
    setSavedOk(true)
    setCover('')
    setCoverTouched(false)
    setCoverError('')
    setDurationFixed(false)
    setOverlays([])
    setSelectedId(null)
    setTool(null)
    setTextDraft(null)
    setMusic(null)
    setMusicError('')
    setMusicVol(0.9)
    setVideoVol(1)
    setAllowComments(true)
    setToast('')

    probe.onloadedmetadata = () => {
      if (cancelled) return

      let d = probe.duration
      let fixed = false

      // Video zilizorekodiwa kwa webm mara nyingi hazina muda kwenye metadata
      if (!Number.isFinite(d) || d <= 0) {
        const known = Number(file.tfDuration)
        if (Number.isFinite(known) && known > 0) {
          d = known
          fixed = true
        } else {
          setLoadError('Imeshindwa kusoma video hii. Jaribu faili nyingine.')
          return
        }
      }

      if (d > MAX_SECONDS) {
        setLoadError(
          `Video ni ndefu sana (${fmt(d)}). Muda wa juu ni dakika ${MAX_SECONDS / 60}.`
        )
        return
      }

      setDuration(d)
      setDurationFixed(fixed)
      setTrimStart(0)
      setTrimEnd(d)
      setUrl(objectUrl)
    }

    probe.onerror = () => {
      if (!cancelled) {
        setLoadError('Imeshindwa kusoma video hii. Jaribu faili nyingine.')
      }
    }

    probe.src = objectUrl

    return () => {
      cancelled = true
      probe.removeAttribute('src')
      // Video iliyochapishwa inaendelea kutumia link hii kwenye Feed
      if (publishedUrlRef.current !== objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [file])

  // Futa link ya muziki ukibadilika au ukiondoka
  useEffect(() => {
    const musicUrl = music && music.url
    return () => {
      if (musicUrl) URL.revokeObjectURL(musicUrl)
    }
  }, [music])

  // Sauti ya video na muziki wa kicheza cha kuhariri
  useEffect(() => {
    const v = videoRef.current
    const a = audioRef.current
    if (v) {
      v.muted = muted
      v.volume = music ? videoVol : 1
    }
    if (a) {
      a.muted = muted
      a.volume = musicVol
    }
  }, [muted, music, videoVol, musicVol, step])

  // Muziki unaenda sambamba na video
  useMusicSync(videoRef, audioRef, Boolean(music) && step === 'edit', trimStart, step)

  // Jalada la moja kwa moja: fremu ya kwanza ya sehemu iliyochaguliwa (kama hujachagua lako)
  useEffect(() => {
    if (step !== 'details' || !url || coverTouched) return

    let cancelled = false
    const time = Math.min(trimStart + 0.3, Math.max(trimStart, trimEnd - 0.1))

    frameDataUrl(url, time, filterCss).then(data => {
      if (!cancelled && data) setCover(data)
    })

    return () => {
      cancelled = true
    }
  }, [step, url, coverTouched, trimStart, trimEnd, filterCss])

  // Rudi kwenye kamera
  const startOver = () => {
    setFile(null)
    setUrl(null)
    setLoadError('')
    setStep('edit')
  }

  const openPicker = () => {
    if (pickerRef.current) pickerRef.current.click()
  }

  const handleLocalPick = (e) => {
    const picked = e.target.files && e.target.files[0]
    e.target.value = ''
    if (picked) setFile(picked)
  }

  // ===== Kicheza cha kuhariri =====

  const tryPlay = () => {
    const el = videoRef.current
    if (!el) return
    el.muted = muted
    el.play().catch(() => {
      // Kivinjari kimekataa sauti: cheza bila sauti
      el.muted = true
      setMuted(true)
      el.play().catch(() => {})
    })
  }

  const togglePlay = () => {
    const el = videoRef.current
    if (!el) return
    setSelectedId(null)

    if (muted) setMuted(false)

    if (el.paused) {
      el.play().catch(() => {})
    } else {
      el.pause()
    }
  }

  const keepInRange = (el) => {
    if (!el || !trimEnd) return
    if (el.currentTime >= trimEnd - 0.05 || el.currentTime < trimStart - 0.3) {
      el.currentTime = trimStart
    }
  }

  const seekPreview = (t) => {
    const el = videoRef.current
    if (el) el.currentTime = t
  }

  // ===== Kupunguza =====

  const setStart = (value) => {
    const v = Math.max(0, Math.min(value, trimEnd - minGap))
    setTrimStart(v)
    seekPreview(v)
  }

  const setEnd = (value) => {
    const v = Math.min(duration, Math.max(value, trimStart + minGap))
    setTrimEnd(v)
    seekPreview(Math.max(trimStart, v - 1.5))
  }

  // ===== Maandishi na stika =====

  const openNewText = () => {
    setTool(null)
    setTextDraft({ id: null, text: '', color: TEXT_COLORS[0], box: false })
  }

  const editSelectedText = () => {
    const item = overlays.find(o => o.id === selectedId)
    if (!item || item.kind !== 'text') return
    setTextDraft({ id: item.id, text: item.text, color: item.color, box: Boolean(item.box) })
  }

  const commitText = () => {
    if (!textDraft) return
    const text = textDraft.text.trim()

    if (!text) {
      setTextDraft(null)
      return
    }

    if (textDraft.id) {
      setOverlays(prev =>
        prev.map(o =>
          o.id === textDraft.id
            ? { ...o, text, color: textDraft.color, box: textDraft.box }
            : o
        )
      )
    } else if (overlays.length >= MAX_OVERLAYS) {
      showToast(`Unaweza kuweka hadi vipengee ${MAX_OVERLAYS}.`)
    } else {
      const item = {
        id: newId('ov'),
        kind: 'text',
        text,
        color: textDraft.color,
        box: textDraft.box,
        size: 7,
        x: 50,
        y: 45
      }
      setOverlays(prev => [...prev, item])
      setSelectedId(item.id)
    }

    setTextDraft(null)
  }

  const addSticker = (emoji) => {
    if (overlays.length >= MAX_OVERLAYS) {
      showToast(`Unaweza kuweka hadi vipengee ${MAX_OVERLAYS}.`)
      return
    }

    const item = {
      id: newId('ov'),
      kind: 'sticker',
      text: emoji,
      color: '#ffffff',
      box: false,
      size: 18,
      x: 50,
      y: 50
    }
    setOverlays(prev => [...prev, item])
    setSelectedId(item.id)
    setTool(null)
  }

  const changeSize = (factor) => {
    setOverlays(prev =>
      prev.map(o => {
        if (o.id !== selectedId) return o
        const [min, max] = o.kind === 'sticker' ? [8, 50] : [3, 16]
        return { ...o, size: clamp(Number((o.size * factor).toFixed(2)), min, max) }
      })
    )
  }

  const deleteSelected = () => {
    setOverlays(prev => prev.filter(o => o.id !== selectedId))
    setSelectedId(null)
  }

  // Kuburuta kipengee ndani ya fremu
  const onItemDown = (e, item) => {
    e.stopPropagation()
    const frame = frameRef.current
    if (!frame) return

    setSelectedId(item.id)

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // hakuna cha kufanya
    }

    dragRef.current = {
      id: item.id,
      pointerId: e.pointerId,
      rect: frame.getBoundingClientRect(),
      startX: e.clientX,
      startY: e.clientY,
      ox: item.x,
      oy: item.y
    }
  }

  const onItemMove = (e) => {
    const d = dragRef.current
    if (!d || d.pointerId !== e.pointerId) return

    const x = clamp(d.ox + ((e.clientX - d.startX) / d.rect.width) * 100, 3, 97)
    const y = clamp(d.oy + ((e.clientY - d.startY) / d.rect.height) * 100, 3, 97)

    setOverlays(prev => prev.map(o => (o.id === d.id ? { ...o, x, y } : o)))
  }

  const onItemUp = (e) => {
    const d = dragRef.current
    if (!d || d.pointerId !== e.pointerId) return

    dragRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // hakuna cha kufanya
    }
  }

  // ===== Muziki =====

  const handleMusicPick = (picked) => {
    setMusicError('')

    if (!isAudioFile(picked)) {
      setMusicError('Chagua faili la sauti (mp3, m4a, wav...).')
      return
    }

    const hadMusic = Boolean(music)
    setMusic({
      file: picked,
      url: URL.createObjectURL(picked),
      name: picked.name.replace(/\.[^.]+$/, '') || 'Muziki'
    })

    if (!hadMusic) {
      setMusicVol(0.9)
      setVideoVol(0.4)
    }
  }

  const removeMusic = () => {
    setMusic(null)
    setVideoVol(1)
    setMusicError('')
  }

  // ===== Jalada =====

  const openCoverStep = () => {
    setCoverError('')
    setCoverTime(trimStart)
    setStep('cover')
  }

  const handleCoverSlider = (value) => {
    setCoverTime(value)
    if (coverVideoRef.current) coverVideoRef.current.currentTime = value
  }

  const confirmFrame = async () => {
    const data = await captureFrame(coverVideoRef.current, filterCss)
    if (data) {
      setCover(data)
      setCoverTouched(true)
    }
    setStep('details')
  }

  const handleCoverImage = async (e) => {
    const picked = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!picked) return

    setCoverError('')

    if (!picked.type.startsWith('image/')) {
      setCoverError('Chagua picha (JPG au PNG).')
      return
    }

    try {
      const data = await cropToDataUrl(picked, 270, 480, 0.8)
      setCover(data)
      setCoverTouched(true)
      setStep('details')
    } catch {
      setCoverError('Imeshindwa kusoma picha hii. Jaribu nyingine.')
    }
  }

  // ===== Maelezo =====

  const insertChar = (ch) => {
    setCaption(prev => {
      const spaced = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? `${prev} ` : prev
      return `${spaced}${ch}`.slice(0, 300)
    })
    if (ch === '#') setShowTags(true)
    if (captionRef.current) captionRef.current.focus()
  }

  const addTag = (tag) => {
    setCaption(prev => {
      const base = prev.replace(/#$/, '').trimEnd()
      if (base.includes(tag)) return base
      const next = base ? `${base} ${tag}` : tag
      return next.slice(0, 300)
    })
  }

  const toggleShareApp = (id) => {
    setShareApps(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // ===== Kuchapisha =====

  const handlePublish = async () => {
    if (publishing || !url) return
    setPublishing(true)
    publishedUrlRef.current = url

    const saved = await publishVideo({
      username: '@wewe',
      caption: caption.trim(),
      videoUrl: url,
      likes: 0,
      comments: 0,
      duration,
      trimStart: trimStart > 0.05 ? trimStart : 0,
      trimEnd: durationFixed || trimEnd < duration - 0.05 ? trimEnd : 0,
      filter: filterId,
      allowComments,
      cover,
      overlays,
      hasMusic: Boolean(music),
      musicName: music ? music.name : '',
      musicVol,
      videoVol: music ? videoVol : 1,
      musicFile: music ? music.file : null
    })

    setSavedOk(saved)
    setPublishing(false)
    setStep('done')
  }

  // Weka kama status moja kwa moja
  const handleStatus = async () => {
    if (statusBusy || !url || !file) return

    if (clipLength > STATUS_MAX_S) {
      showToast(`Status isizidi sekunde ${STATUS_MAX_S}. Punguza video kwanza.`)
      setTool('trim')
      return
    }

    if (file.size > STATUS_MAX_MB * 1024 * 1024) {
      showToast(`Video ni kubwa mno kwa status (MB ${STATUS_MAX_MB}).`)
      return
    }

    setStatusBusy(true)

    const now = Date.now()
    const item = {
      id: newId('s'),
      author: me,
      type: 'video',
      caption: '',
      duration: clipLength,
      createdAt: now,
      expiresAt: now + STATUS_TTL_MS,
      views: [],
      likes: [],
      comments: [],
      edit: {
        trimStart,
        trimEnd,
        filter: filterId,
        overlays,
        hasMusic: Boolean(music),
        musicName: music ? music.name : '',
        musicVol,
        videoVol: music ? videoVol : 1
      }
    }

    const ok = await addStatus(item, file, music ? music.file : null)
    setStatusBusy(false)

    if (ok) {
      navigate('/messages')
    } else {
      showToast('Imeshindwa kuhifadhi status. Nafasi ya kivinjari inaweza kuwa imejaa.')
    }
  }

  const shareNow = (appId) => {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}`
    const base = caption.trim().slice(0, 80)
    const text = base
      ? `Tazama kipaji changu kwenye TalentFlex: ${base}`
      : 'Tazama kipaji changu kwenye TalentFlex'
    window.open(shareUrl(appId, text, link), '_blank', 'noopener,noreferrer')
  }

  // ===== Skrini =====

  let content

  if (!file) {
    content = (
      <CameraCapture
        onRecorded={setFile}
        onPick={setFile}
        onClose={() => navigate('/')}
      />
    )
  } else if (loadError) {
    content = (
      <>
        <div className="ed-top">
          <button className="ed-icon-btn" onClick={startOver} aria-label="Rudi">
            <BackIcon size={22} />
          </button>
          <h2 className="ed-title">Video mpya</h2>
          <span className="ed-top-space" />
        </div>
        <div className="ed-center">
          <h2>Video haikubaliki</h2>
          <p className="ed-error">{loadError}</p>
          <div className="ed-actions">
            <button className="ed-primary" onClick={openPicker}>
              Chagua nyingine
            </button>
            <button className="ed-ghost" onClick={startOver}>
              Rudi kwenye kamera
            </button>
          </div>
        </div>
      </>
    )
  } else if (!url) {
    content = (
      <div className="ed-center">
        <div className="ed-spinner" />
        <p>Inasoma video...</p>
      </div>
    )
  } else if (step === 'done') {
    const chosen = SHARE_APPS.filter(a => shareApps.includes(a.id))

   content = (
      <div className="ed-center">
        <div className="ed-success-icon">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2>Video imechapishwa!</h2>
        <p>Iko kwenye Feed sasa na inaonekana kwa wengine.</p>

        {!savedOk && (
          <p className="ed-warning">
            Video imechapishwa, lakini kifaa kimeshindwa kuihifadhi kabisa (huenda ni kubwa sana
            au nafasi imejaa). Itapotea ukirefresh ukurasa.
          </p>
        )}

        {chosen.length > 0 && (
          <div className="ud-share-now">
            <p className="ud-share-now-title">Shiriki sasa</p>
            <div className="ud-share-now-list">
              {chosen.map(({ id, label, Icon }) => (
                <button key={id} className="ud-share-now-btn" onClick={() => shareNow(id)}>
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="ed-actions">
          <button className="ed-primary" onClick={() => navigate('/')}>
            Tazama Feed
          </button>
          <button className="ed-ghost" onClick={startOver}>
            Pakia nyingine
          </button>
        </div>
      </div>
    )
  } else if (step === 'cover') {
    content = (
      <>
        <div className="ed-top">
          <button
            className="ed-icon-btn"
            onClick={() => setStep('details')}
            aria-label="Rudi"
          >
            <BackIcon size={22} />
          </button>
          <h2 className="ed-title">Jalada</h2>
          <span className="ed-top-space" />
        </div>

        <div className="ed-stage">
          <video
            ref={coverVideoRef}
            className="ed-video"
            src={url}
            muted
            playsInline
            preload="auto"
            style={{ filter: filterCss }}
            onLoadedMetadata={(e) => {
              e.currentTarget.currentTime = coverTime
            }}
          />
        </div>

        <div className="ed-panel">
          <div className="ed-trim-info">
            <span>Chagua fremu ya jalada</span>
            <b>{fmt(coverTime - trimStart)}</b>
          </div>

          <div className="ed-trim-row">
            <input
              type="range"
              className="ed-range"
              min={trimStart}
              max={Math.max(trimStart + 0.1, trimEnd - 0.1)}
              step={sliderStep}
              value={coverTime}
              onChange={(e) => handleCoverSlider(Number(e.target.value))}
            />
          </div>

          <button
            className="ed-ghost wide"
            onClick={() => coverImgRef.current && coverImgRef.current.click()}
          >
            Chagua picha kutoka kwenye simu
          </button>

          {coverError && <p className="ed-cover-error">{coverError}</p>}

          <button className="ed-primary" onClick={confirmFrame}>
            Tumia jalada hili
          </button>
        </div>
      </>
    )
  } else if (step === 'details') {
    const pickedApps = SHARE_APPS.filter(a => shareApps.includes(a.id))

    content = (
      <>
        <div className="ed-top">
          <button
            className="ed-icon-btn"
            onClick={() => setStep('edit')}
            aria-label="Rudi kuhariri"
            disabled={publishing}
          >
            <BackIcon size={22} />
          </button>
          <h2 className="ed-title">Chapisha</h2>
          <button
            className="ud-preview-btn"
            onClick={() => setPreview(true)}
            disabled={publishing}
          >
            Hakiki
          </button>
        </div>

        <div className="ed-details">
          <div className="ed-desc-row">
            <button
              type="button"
              className="ed-cover-btn"
              onClick={openCoverStep}
              disabled={publishing}
              aria-label="Hariri jalada"
            >
              {cover ? (
                <img className="ed-thumb" src={cover} alt="Jalada la video" />
              ) : (
                <span className="ed-cover-loading">
                  <span className="ed-spinner" />
                </span>
              )}
              <span className="ed-cover-label">Jalada</span>
            </button>

            <textarea
              ref={captionRef}
              className="ed-textarea"
              placeholder="Andika maelezo marefu husaidia kupata watazamaji zaidi..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={300}
            />
          </div>

          <div className="ud-tools">
            <button
              type="button"
              className="ud-tool"
              onClick={() => insertChar('#')}
              aria-label="Hashtag"
            >
              #
            </button>
            <button
              type="button"
              className="ud-tool"
              onClick={() => insertChar('@')}
              aria-label="Taja mtu"
            >
              @
            </button>
            <span className="ud-count">{caption.length}/300</span>
          </div>

          {showTags && (
            <div className="ed-tags">
              {TAGS.map(tag => (
                <button key={tag} type="button" className="ed-tag" onClick={() => addTag(tag)}>
                  {tag}
                </button>
              ))}
            </div>
          )}

          <div className="ud-share">
            <button
              type="button"
              className="ud-share-row"
              onClick={() => setShareOpen(v => !v)}
            >
              <span className="ud-share-left">
                <ShareIcon />
                <span>Shiriki kwa</span>
              </span>
              <span className="ud-share-right">
                {pickedApps.length > 0 && (
                  <span className="ud-share-picked">
                    {pickedApps.map(({ id, Icon }) => (
                      <Icon key={id} size={17} />
                    ))}
                  </span>
                )}
                <ChevronIcon open={shareOpen} />
              </span>
            </button>

            {shareOpen && (
              <div className="ud-share-apps">
                {SHARE_APPS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={shareApps.includes(id) ? 'ud-app-chip on' : 'ud-app-chip'}
                    onClick={() => toggleShareApp(id)}
                  >
                    <Icon size={20} />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ed-footer">
          <button
            className="ed-ghost"
            onClick={() => setStep('edit')}
            disabled={publishing}
          >
            Rudi
          </button>
          <button className="ed-primary" onClick={handlePublish} disabled={publishing}>
            {publishing ? 'Inachapisha...' : 'Chapisha'}
          </button>
        </div>
      </>
    )
  } else {
    const selected = overlays.find(o => o.id === selectedId) || null

    content = (
      <div className="ed2" onClick={() => setSelectedId(null)}>
        <div className="ed2-stage">
          <div className="ed2-frame" ref={frameRef}>
            <video
              ref={videoRef}
              className="ed2-video"
              src={url}
              playsInline
              loop
              style={{ filter: filterCss }}
              onLoadedMetadata={() => seekPreview(trimStart)}
              onLoadedData={tryPlay}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(e) => keepInRange(e.currentTarget)}
              onClick={(e) => {
                e.stopPropagation()
                togglePlay()
              }}
            />

            <OverlayLayer
              overlays={overlays}
              interactive
              selectedId={selectedId}
              onDown={onItemDown}
              onMove={onItemMove}
              onUp={onItemUp}
            />

            {!playing && (
              <span className="ed2-play">
                <PlayIcon />
              </span>
            )}

            <div className="ed2-top">
              <button className="ed2-round" onClick={startOver} aria-label="Rudi kwenye kamera">
                <BackIcon size={22} />
              </button>

              <button
                className="ed2-sound"
                onClick={(e) => {
                  e.stopPropagation()
                  setTool('music')
                }}
              >
                <MusicIcon size={18} />
                <span>{music ? music.name : 'Ongeza muziki'}</span>
              </button>

              <button
                className="ed2-round"
                onClick={(e) => {
                  e.stopPropagation()
                  setTool('settings')
                }}
                aria-label="Mipangilio"
              >
                <GearIcon size={22} />
              </button>
            </div>

            <div className="ed2-tools" onClick={(e) => e.stopPropagation()}>
              <button
                className={tool === 'trim' ? 'ed2-tool on' : 'ed2-tool'}
                onClick={() => setTool('trim')}
              >
                <ScissorsIcon />
                <span>Punguza</span>
              </button>
              <button className="ed2-tool" onClick={openNewText}>
                <TextIcon />
                <span>Maandishi</span>
              </button>
              <button
                className={tool === 'sticker' ? 'ed2-tool on' : 'ed2-tool'}
                onClick={() => setTool('sticker')}
              >
                <StickerIcon />
                <span>Stika</span>
              </button>
              <button
                className={tool === 'filter' ? 'ed2-tool on' : 'ed2-tool'}
                onClick={() => setTool('filter')}
              >
                <FilterIcon />
                <span>Filta</span>
              </button>
            </div>

            {selected && (
              <div className="ed2-selbar" onClick={(e) => e.stopPropagation()}>
                {selected.kind === 'text' && (
                  <button className="ed2-selbtn" onClick={editSelectedText} aria-label="Hariri maandishi">
                    <EditIcon />
                  </button>
                )}
                <button className="ed2-selbtn" onClick={() => changeSize(0.85)} aria-label="Punguza ukubwa">
                  <MinusIcon />
                </button>
                <button className="ed2-selbtn" onClick={() => changeSize(1.18)} aria-label="Kuza">
                  <PlusIcon />
                </button>
                <button className="ed2-selbtn danger" onClick={deleteSelected} aria-label="Futa">
                  <TrashIcon />
                </button>
              </div>
            )}

            {toast && <div className="ed2-toast">{toast}</div>}
          </div>
        </div>

        <div className="ed2-bottom" onClick={(e) => e.stopPropagation()}>
          <button className="ed2-story" onClick={handleStatus} disabled={statusBusy}>
            <Avatar username={me} src={myInfo.avatar} label={myInfo.name} size={26} />
            {statusBusy ? 'Subiri...' : 'Status yako'}
          </button>
          <button className="ed2-next" onClick={() => setStep('details')}>
            Endelea
          </button>
        </div>

        {music && <audio ref={audioRef} src={music.url} loop preload="auto" />}

        {tool === 'trim' && (
          <TrimSheet
            duration={duration}
            trimStart={trimStart}
            trimEnd={trimEnd}
            sliderStep={sliderStep}
            fmt={fmt}
            onStart={setStart}
            onEnd={setEnd}
            onDone={() => setTool(null)}
          />
        )}

        {tool === 'filter' && (
          <FilterSheet
            filterId={filterId}
            onChange={setFilterId}
            onDone={() => setTool(null)}
          />
        )}

        {tool === 'sticker' && (
          <StickerSheet onPick={addSticker} onDone={() => setTool(null)} />
        )}

        {tool === 'music' && (
          <MusicSheet
            music={music}
            musicVol={musicVol}
            videoVol={videoVol}
            error={musicError}
            onPick={handleMusicPick}
            onRemove={removeMusic}
            onMusicVol={setMusicVol}
            onVideoVol={setVideoVol}
            onDone={() => setTool(null)}
          />
        )}

        {tool === 'settings' && (
          <SettingsSheet
            allowComments={allowComments}
            onAllowComments={setAllowComments}
            videoVol={videoVol}
            onVideoVol={setVideoVol}
            onDone={() => setTool(null)}
          />
        )}

        {textDraft && (
          <TextEditor
            draft={textDraft}
            onChange={(patch) => setTextDraft(prev => ({ ...prev, ...patch }))}
            onCancel={() => setTextDraft(null)}
            onDone={commitText}
          />
        )}
      </div>
    )
  }

  return (
    <div className="ed-root">
      {content}

      {preview && url && step === 'details' && (
        <div className="ud-preview">
          <EditedPlayer
            url={url}
            trimStart={trimStart}
            trimEnd={trimEnd}
            filterCss={filterCss}
            overlays={overlays}
            musicUrl={music ? music.url : ''}
            musicVol={musicVol}
            videoVol={music ? videoVol : 1}
          />
          <button
            className="ud-preview-close"
            onClick={() => setPreview(false)}
            aria-label="Funga hakiki"
          >
            <CloseIcon size={20} />
          </button>
        </div>
      )}

      <input
        ref={pickerRef}
        type="file"
        accept="video/*"
        hidden
        onChange={handleLocalPick}
      />
      <input
        ref={coverImgRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleCoverImage}
      />
    </div>
  )
}

export default Upload