import { useEffect } from 'react'

// Inaoanisha muziki na video: inacheza, inasimama na kuruka pamoja nayo
export function useMusicSync(videoRef, audioRef, active, base = 0, resetKey = 0) {
  useEffect(() => {
    const v = videoRef.current
    const a = audioRef.current
    if (!active || !v || !a) return undefined

    const sync = (force) => {
      const target = Math.max(0, v.currentTime - base)
      const len = a.duration
      const t = Number.isFinite(len) && len > 0 ? target % len : target
      if (force || Math.abs(a.currentTime - t) > 0.35) {
        try {
          a.currentTime = t
        } catch {
          // bado haijawa tayari
        }
      }
    }

    const onPlay = () => {
      sync(true)
      a.play().catch(() => {})
    }
    const onPause = () => {
      a.pause()
    }
    const onTime = () => sync(false)
    const onSeeked = () => sync(true)

    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('seeked', onSeeked)

    if (!v.paused) onPlay()

    return () => {
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('seeked', onSeeked)
      a.pause()
    }
  }, [videoRef, audioRef, active, base, resetKey])
}