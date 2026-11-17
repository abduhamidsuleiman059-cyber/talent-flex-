// Inasubiri tukio (event) au muda uishe
function waitEvent(target, event, ms) {
  return new Promise(resolve => {
    let done = false

    const finish = (ok) => {
      if (done) return
      done = true
      target.removeEventListener(event, onEvent)
      clearTimeout(timer)
      resolve(ok)
    }

    const onEvent = () => finish(true)
    const timer = setTimeout(() => finish(false), ms)
    target.addEventListener(event, onEvent)
  })
}

// Kata picha katikati kwa ukubwa unaotakiwa na uipunguze
export function cropToDataUrl(file, outW, outH, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      const scale = Math.max(outW / img.width, outH / img.height)
      const w = img.width * scale
      const h = img.height * scale

      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#0d0d0d'
      ctx.fillRect(0, 0, outW, outH)
      ctx.drawImage(img, (outW - w) / 2, (outH - h) / 2, w, h)

      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('IMAGE_FAILED'))
    }

    img.src = url
  })
}

// Piga picha ya fremu iliyopo sasa kwenye kicheza video (filta inajumuishwa kama kivinjari kinaruhusu)
export async function captureFrame(
  video,
  filterCss = 'none',
  outW = 270,
  outH = 480,
  quality = 0.72
) {
  if (!video || !video.videoWidth) return ''

  if (video.seeking) {
    await waitEvent(video, 'seeked', 1500)
  }

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, outW, outH)

  const scale = Math.max(outW / video.videoWidth, outH / video.videoHeight)
  const w = video.videoWidth * scale
  const h = video.videoHeight * scale

  if (filterCss && filterCss !== 'none' && 'filter' in ctx) {
    ctx.filter = filterCss
  }

  try {
    ctx.drawImage(video, (outW - w) / 2, (outH - h) / 2, w, h)
    return canvas.toDataURL('image/jpeg', quality)
  } catch {
    return ''
  }
}

// Fremu ya video kwa muda fulani, kutoka kwenye link ya video
export async function frameDataUrl(url, time, filterCss = 'none') {
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.src = url

  const loaded = await waitEvent(video, 'loadeddata', 6000)
  if (!loaded) {
    video.removeAttribute('src')
    return ''
  }

  if (time > 0) {
    video.currentTime = time
    await waitEvent(video, 'seeked', 3000)
  }

  const data = await captureFrame(video, filterCss)
  video.removeAttribute('src')
  video.load()
  return data
}