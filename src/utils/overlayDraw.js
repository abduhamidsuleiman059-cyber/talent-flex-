const EMOJI_FONT = '"Apple Color Emoji","Noto Color Emoji","Segoe UI Emoji",sans-serif'
const TEXT_FONT = 'Roboto, "Segoe UI", system-ui, sans-serif'

// Rangi ya maandishi inayosomeka juu ya rangi ya mandhari
export function contrastColor(hex) {
  const h = String(hex || '#ffffff').replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const r = parseInt(full.slice(0, 2), 16) || 0
  const g = parseInt(full.slice(2, 4), 16) || 0
  const b = parseInt(full.slice(4, 6), 16) || 0
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#000000' : '#ffffff'
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function wrapLines(ctx, text, maxWidth) {
  const lines = []
  String(text)
    .split('\n')
    .forEach(paragraph => {
      const words = paragraph.split(/\s+/).filter(Boolean)
      if (words.length === 0) {
        lines.push('')
        return
      }
      let line = ''
      words.forEach(word => {
        const test = line ? `${line} ${word}` : word
        if (!line || ctx.measureText(test).width <= maxWidth) {
          line = test
        } else {
          lines.push(line)
          line = word
        }
      })
      lines.push(line)
    })
  return lines
}

// Chora maandishi na stika kwenye canvas (ukubwa na nafasi ni asilimia ya fremu)
export function drawOverlays(ctx, overlays, cw, ch) {
  if (!Array.isArray(overlays)) return

  overlays.forEach(item => {
    const px = (item.size / 100) * cw
    const cx = (item.x / 100) * cw
    const cy = (item.y / 100) * ch

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    if (item.kind === 'sticker') {
      ctx.font = `${px}px ${EMOJI_FONT}`
      ctx.fillText(item.text, cx, cy)
    } else {
      ctx.font = `800 ${px}px ${TEXT_FONT}`
      const lines = wrapLines(ctx, item.text, cw * 0.8)
      const lineHeight = px * 1.25
      const totalH = lineHeight * lines.length
      const maxW = Math.max(...lines.map(l => ctx.measureText(l).width), 0)

      if (item.box) {
        const padX = px * 0.35
        const padY = px * 0.15
        ctx.fillStyle = item.color
        roundedRect(
          ctx,
          cx - maxW / 2 - padX,
          cy - totalH / 2 - padY,
          maxW + padX * 2,
          totalH + padY * 2,
          px * 0.25
        )
        ctx.fill()
        ctx.fillStyle = contrastColor(item.color)
      } else {
        ctx.fillStyle = item.color
        ctx.shadowColor = 'rgba(0,0,0,0.5)'
        ctx.shadowBlur = px * 0.25
        ctx.shadowOffsetY = px * 0.05
      }

      lines.forEach((line, i) => {
        ctx.fillText(line, cx, cy - totalH / 2 + lineHeight * (i + 0.5))
      })
    }

    ctx.restore()
  })
}