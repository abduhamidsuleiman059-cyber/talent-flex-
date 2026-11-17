import { useEffect, useRef, useState } from 'react'
import '../styles/snake.css'

const INSET = 3
const RADIUS = 18

// Mstari wa bluu unaozunguka ukingo wa app kama nyoka
function SnakeFrame() {
  const ref = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }

    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const w = Math.max(0, size.w - INSET * 2)
  const h = Math.max(0, size.h - INSET * 2)

  const rectProps = {
    x: INSET,
    y: INSET,
    width: w,
    height: h,
    rx: RADIUS,
    ry: RADIUS,
    pathLength: 100
  }

  return (
    <div className="snake-frame" ref={ref} aria-hidden="true">
      {w > 0 && h > 0 && (
        <svg width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`}>
          <rect className="snake-base" {...rectProps} />
          <rect className="snake-g" {...rectProps} />
          <rect className="snake-t1" {...rectProps} />
          <rect className="snake-t2" {...rectProps} />
          <rect className="snake-t3" {...rectProps} />
          <rect className="snake-h" {...rectProps} />
        </svg>
      )}
    </div>
  )
}

export default SnakeFrame