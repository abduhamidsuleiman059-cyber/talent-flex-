// Muda wa skrini ya logo mwishoni (sekunde)
const OUTRO_SECONDS = 2.5
// Upande mrefu zaidi wa video ya mwisho (pixels)
const MAX_SIDE = 1280
// Rangi ya mandhari ya skrini ya logo
const OUTRO_BG = '#0d0d0d'

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
 * Inaandaa video mpya: video asili + skrini ya logo mwishoni.
 * Inarudisha { blob, ext }.
 */
export async function downloadVideoWithLogo({
  videoUrl,
  username,
  logoUrl,
  onProgress,
  signal
}) {
  const mimeType = pickMimeType()
  if (!mimeType) throw makeError('UNSUPPORTED')

  throwIfAborted(signal)
  const [video, logo] = await Promise.all([loadVideo(videoUrl), loadImage(logoUrl)])
  throwIfAborted(signal)

  const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm'

  // Ukubwa wa video ya mwisho (namba shufwa)
  const srcW = video.videoWidth || 720
  const srcH = video.videoHeight || 1280
  const scale = Math.min(1, MAX_SIDE / Math.max(srcW, srcH))
  const cw = Math.max(2, Math.round((srcW * scale) / 2) * 2)
  const ch = Math.max(2, Math.round((srcH * scale) / 2) * 2)

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = OUTRO_BG
  ctx.fillRect(0, 0, cw, ch)

  const stream = canvas.captureStream(30)

  // Sauti: inanaswa kwenye rekodi bila kutoka kwenye spika
  let audioCtx = null
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (AudioCtx) {
    try {
      audioCtx = new AudioCtx()
      const source = audioCtx.createMediaElementSource(video)
      const dest = audioCtx.createMediaStreamDestination()
      source.connect(dest)
      dest.stream.getAudioTracks().forEach(t => stream.addTrack(t))
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
    } catch {
      audioCtx = null
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

  const duration = Number.isFinite(video.duration) ? video.duration : 0
  const total = duration + OUTRO_SECONDS

  return new Promise((resolve, reject) => {
    let rafId = 0
    let finished = false
    let phase = 'video'
    let outroStart = 0

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
        ext
      })
    }

    recorder.onerror = () => fail(makeError('RECORD_FAILED'))
    video.onerror = () => fail(makeError('LOAD_FAILED'))

    video.onended = () => {
      phase = 'outro'
      outroStart = performance.now()
    }

    const report = (seconds) => {
      if (onProgress && total > 0) {
        onProgress(Math.min(1, seconds / total))
      }
    }

    const tick = () => {
      if (finished) return

      if (phase === 'video') {
        ctx.drawImage(video, 0, 0, cw, ch)
        report(video.currentTime)
      } else {
        const elapsed = (performance.now() - outroStart) / 1000
        const alpha = Math.min(1, elapsed / 0.4)
        drawOutro(ctx, cw, ch, logo, username, alpha)
        report(duration + elapsed)

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

    // Anza kurekodi na kucheza video
    recorder.start()
    video
      .play()
      .then(() => {
        rafId = requestAnimationFrame(tick)
      })
      .catch(() => fail(makeError('PLAY_BLOCKED')))
  })
}