// Punguza picha ili ihifadhike kwa urahisi (upande mrefu zaidi = maxSide)
export function resizeImageToDataUrl(file, maxSide = 900, quality = 0.76) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)

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

// Muda wa video (sekunde)
export function readVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      const d = video.duration
      URL.revokeObjectURL(url)
      if (Number.isFinite(d) && d > 0) resolve(d)
      else reject(new Error('NO_DURATION'))
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('VIDEO_FAILED'))
    }

    video.src = url
  })
}