import { contrastColor } from '../utils/overlayDraw'
import '../styles/overlay.css'

// Maandishi na stika juu ya video. Kwenye kuhariri (interactive) vinaburutwa.
function OverlayLayer({ overlays, interactive = false, selectedId = null, onDown, onMove, onUp }) {
  if (!overlays || overlays.length === 0) return null

  return (
    <div className="ov-layer">
      {overlays.map(item => {
        const style = { left: `${item.x}%`, top: `${item.y}%`, '--s': item.size }

        if (item.kind === 'text') {
          if (item.box) {
            style.background = item.color
            style.color = contrastColor(item.color)
          } else {
            style.color = item.color
          }
        }

        const className = [
          'ov-item',
          item.kind === 'sticker' ? 'sticker' : 'text',
          item.box ? 'box' : '',
          interactive ? 'live' : '',
          selectedId === item.id ? 'selected' : ''
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <div
            key={item.id}
            className={className}
            style={style}
            onPointerDown={interactive ? (e) => onDown(e, item) : undefined}
            onPointerMove={interactive ? onMove : undefined}
            onPointerUp={interactive ? onUp : undefined}
            onPointerCancel={interactive ? onUp : undefined}
          >
            {item.text}
          </div>
        )
      })}
    </div>
  )
}

export default OverlayLayer