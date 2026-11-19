import { useRef, useEffect } from 'react'
import OverlayLayer from './OverlayLayer'
import { useMusicSync } from '../utils/useMusicSync'
import '../styles/editor-tiktok.css'

// Kicheza cha hakiki: video yenye filta, maandishi, stika na muziki
function EditedPlayer({
  url,
  trimStart = 0,
  trimEnd = 0,
  filterCss = 'none',
  overlays = [],
  musicUrl = '',
  musicVol = 1,
  videoVol = 1
}) {
  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const hasMusic = Boolean(musicUrl)

  useMusicSync(videoRef, audioRef, hasMusic, trimStart)

  useEffect(() => {
    const v = videoRef.current
    const a = audioRef.current
    if (v) v.volume = hasMusic ? videoVol : 1
    if (a) a.volume = musicVol
  }, [hasMusic, videoVol, musicVol])

  return (
    <div className="ed2-stage plain">
      <div className="ed2-frame">
        <video
          ref={videoRef}
          className="ed2-video"
          src={url}
          autoPlay
          loop
          playsInline
          style={{ filter: filterCss }}
          onLoadedMetadata={(e) => {
            e.currentTarget.currentTime = trimStart
          }}
          onTimeUpdate={(e) => {
            const el = e.currentTarget
            if (trimEnd && (el.currentTime >= trimEnd - 0.05 || el.currentTime < trimStart - 0.3)) {
              el.currentTime = trimStart
            }
          }}
        />

        <OverlayLayer overlays={overlays} />

        {hasMusic && <audio ref={audioRef} src={musicUrl} loop preload="auto" />}
      </div>
    </div>
  )
}

export default EditedPlayer