import { drawOverlays } from './overlayDraw'

// Muda wa skrini ya logo mwishoni (sekunde)
const OUTRO_SECONDS = 2.5
// Ukubwa wa video ya mwisho: fremu ya 9:16, kama inavyoonekana kwenye Feed
const OUT_W = 720
const OUT_H = 1280
// Rangi ya mandhari ya skrini ya logo
const OUTRO_BG = '#0d0d0d'
// Urefu wa juu wa sehemu inayopakuliwa (sekunde): dakika 5
export const MAX_DOWNLOAD_SECONDS = 5 * 60

function makeError(code) {
  const e = new Error(code)
  e.code = code
  return e
}

function throwIfAborted(signal) {
  if (signal && signal.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }
}

// Mfumo wa faili unaotegemezwa na kivinjari (mp4 kwanza, kisha webm)
function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return null
  const types = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ]
  return types.find(t => MediaRecorder.isTypeSupported(t)) || null
}

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function loadVideo(url) {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video')
    v.setAttribute('playsinline', '')
    v.playsInline = true
    v.preload = 'auto'
    v.onloadeddata = () => resolve(v)
    v.onerror = () => reject(makeError('LOAD_FAILED'))
    v.src = url
  })
}

// Peleka video kwenye sekunde fulani na subiri ifike
function seekTo(video, t) {
  return new Promise(resolve => {
    if (Math.abs(video.currentTime - t) < 0.05) {
      resolve()
      return
    }

    let done = false

    const finish = () => {
      if (done) return
      done = true
      video.removeEventListener('seeked', finish)
      clearTimeout(timer)
      resolve()
    }

    const timer = setTimeout(finish, 2500)
    video.addEventListener('seeked', finish)
    video.currentTime = t
  })
}

// Chora video ikijaza fremu nzima (kata pembeni kama Feed)
function drawCover(ctx, video, cw, ch) {
  const vw = video.videoWidth || cw
  const vh = video.videoHeight || ch
  const scale = Math.max(cw / vw, ch / vh)
  const w = vw * scale
  const h = vh * scale
  ctx.drawImage(video, (cw - w) / 2, (ch - h) / 2, w, h)
}

function drawOutro(ctx, cw, ch, logo, username, alpha) {
  ctx.globalAlpha = 1
  ctx.fillStyle = OUTRO_BG
  ctx.fillRect(0, 0, cw, ch)

  ctx.globalAlpha = alpha
  let textY = ch / 2

  if (logo) {
    const ratio = Math.min((cw * 0.62) / logo.width, (ch * 0.4) / logo.height)
    const lw = logo.width * ratio
    const lh = logo.height * ratio
    const ly = (ch - lh) / 2 - ch * 0.04
    ctx.drawImage(logo, (cw - lw) / 2, ly, lw, lh)
    textY = ly + lh + ch * 0.06
  } else {
    // Logo haikupatikana: andika jina kwa rangi za chapa
    const size = Math.round(cw * 0.12)
    const grad = ctx.createLinearGradient(cw * 0.2, 0, cw * 0.8, 0)
    grad.addColorStop(0, '#22d3ee')
    grad.addColorStop(0.5, '#7c3aed')
    grad.addColorStop(1, '#ec4899')
    ctx.fillStyle = grad
    ctx.font = `800 ${size}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('TalentFlex', cw / 2, ch / 2)
    textY = ch / 2 + size * 1.1
  }

  if (username) {
    ctx.fillStyle = '#ffffff'
    ctx.font = `600 ${Math.round(cw * 0.045)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(username, cw / 2, textY)
  }

  ctx.globalAlpha = 1
}

/**
 * Inaandaa video mpya: sehemu iliyochaguliwa + filta + maandishi/stika + muziki + skrini ya logo mwishoni.
 * Inarudisha { blob, ext, filterApplied }.
 */
export async function downloadVideoWithLogo({
  videoUrl,
  username,
  logoUrl,
  trimStart = 0,
  trimEnd = 0,
  filter = 'none',
  overlays = [],
  musicUrl = '',
  musicVol = 1,
  videoVol = 1,
  onProgress,
  signal
}) {
  const mimeType = pickMimeType()
  if (!mimeType) throw makeError('UNSUPPORTED')

  throwIfAborted(signal)
  const [video, logo] = await Promise.all([loadVideo(videoUrl), loadImage(logoUrl)])
  throwIfAborted(signal)

  const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm'

  // Sehemu ya video itakayopakuliwa
  const fullDuration = Number.isFinite(video.duration) ? video.duration : 0
  const start = Math.max(0, Math.min(trimStart || 0, Math.max(0, fullDuration - 0.1)))
  const end =
    trimEnd && trimEnd > start
      ? Math.min(trimEnd, fullDuration || trimEnd)
      : fullDuration
  const endTime = end > start ? end : Infinity
  const clipLength = end > start ? end - start : 0

  if (clipLength > MAX_DOWNLOAD_SECONDS) throw makeError('TOO_LONG')

  const cw = OUT_W
  const ch = OUT_H

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = OUTRO_BG
  ctx.fillRect(0, 0, cw, ch)

  // Filta: inafanya kazi kwenye Chrome na vivinjari vingi vya Android
  const filterRequested = Boolean(filter) && filter !== 'none'
  const filterSupported = 'filter' in ctx
  const useFilter = filterRequested && filterSupported
  const filterApplied = !filterRequested || filterSupported

  await seekTo(video, start)
  throwIfAborted(signal)

  const stream = canvas.captureStream(30)

  // Sauti: video na muziki vinachanganywa kwenye rekodi bila kutoka kwenye spika
  let audioCtx = null
  let music = null
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (AudioCtx) {
    try {
      audioCtx = new AudioCtx()
      const dest = audioCtx.createMediaStreamDestination()

      const videoSource = audioCtx.createMediaElementSource(video)
      const videoGain = audioCtx.createGain()
      videoGain.gain.value = musicUrl ? videoVol : 1
      videoSource.connect(videoGain)
      videoGain.connect(dest)

      if (musicUrl) {
        music = new Audio()
        music.src = musicUrl
        music.loop = true
        music.preload = 'auto'
        const musicSource = audioCtx.createMediaElementSource(music)
        const musicGain = audioCtx.createGain()
        musicGain.gain.value = musicVol
        musicSource.connect(musicGain)
        musicGain.connect(dest)
      }

      dest.stream.getAudioTracks().forEach(t => stream.addTrack(t))
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
    } catch {
      audioCtx = null
      music = null
    }
  }

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 5000000,
    audioBitsPerSecond: 128000
  })
  const chunks = []
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data)
  }

  const total = clipLength + OUTRO_SECONDS

  return new Promise((resolve, reject) => {
    let rafId = 0
    let finished = false
    let phase = 'video'
    let outroStart = 0

    const stopMusic = () => {
      if (!music) return
      try {
        music.pause()
      } catch {
        // hakuna cha kufanya
      }
    }

    const cleanup = () => {
      cancelAnimationFrame(rafId)
      if (signal) signal.removeEventListener('abort', onAbort)
      try {
        if (recorder.state !== 'inactive') recorder.stop()
      } catch {
        // tayari imesimama
      }
      try {
        video.pause()
        video.removeAttribute('src')
        video.load()
      } catch {
        // hakuna cha kufanya
      }
      if (music) {
        stopMusic()
        music.removeAttribute('src')
        music.load()
      }
      stream.getTracks().forEach(t => t.stop())
      if (audioCtx) audioCtx.close().catch(() => {})
    }

    const fail = (err) => {
      if (finished) return
      finished = true
      cleanup()
      reject(err)
    }

    function onAbort() {
      fail(new DOMException('Aborted', 'AbortError'))
    }

    if (signal) signal.addEventListener('abort', onAbort, { once: true })

    recorder.onstop = () => {
      if (finished) return
      finished = true
      cleanup()
      resolve({
        blob: new Blob(chunks, { type: mimeType.split(';')[0] }),
        ext,
        filterApplied
      })
    }

    recorder.onerror = () => fail(makeError('RECORD_FAILED'))
    video.onerror = () => fail(makeError('LOAD_FAILED'))

    const beginOutro = () => {
      if (phase === 'outro') return
      phase = 'outro'
      outroStart = performance.now()
      try {
        video.pause()
      } catch {
        // hakuna cha kufanya
      }
      stopMusic()
    }

    video.onended = beginOutro

    const report = (seconds) => {
      if (onProgress && total > 0) {
        onProgress(Math.min(1, Math.max(0, seconds / total)))
      }
    }

    const tick = () => {
      if (finished) return

      if (phase === 'video') {
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, cw, ch)

        if (filterSupported) ctx.filter = useFilter ? filter : 'none'
        drawCover(ctx, video, cw, ch)
        // Maandishi na stika hazipaswi kupata filta
        if (filterSupported) ctx.filter = 'none'
        drawOverlays(ctx, overlays, cw, ch)

        report(video.currentTime - start)

        if (video.currentTime >= endTime - 0.04 || video.ended) {
          beginOutro()
        }
      } else {
        if (filterSupported) ctx.filter = 'none'

        const elapsed = (performance.now() - outroStart) / 1000
        const alpha = Math.min(1, elapsed / 0.4)
        drawOutro(ctx, cw, ch, logo, username, alpha)
        report(clipLength + elapsed)

        if (elapsed >= OUTRO_SECONDS) {
          try {
            recorder.stop()
          } catch {
            fail(makeError('RECORD_FAILED'))
          }
          return
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    // Anza kurekodi na kucheza video (na muziki pamoja nayo)
    recorder.start()
    video
      .play()
      .then(() => {
        if (music) {
          music.currentTime = 0
          music.play().catch(() => {})
        }
        rafId = requestAnimationFrame(tick)
      })
      .catch(() => fail(makeError('PLAY_BLOCKED')))
  })
}