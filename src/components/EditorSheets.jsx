import { useRef } from 'react'
import { contrastColor } from '../utils/overlayDraw'
import { FILTERS } from '../utils/videoFilters'
import { CheckIcon, MusicIcon, TrashIcon, BoxTextIcon } from './EditorIcons'
import '../styles/editor-tiktok.css'

export const TEXT_COLORS = [
  '#ffffff',
  '#000000',
  '#ffb800',
  '#ff3b5c',
  '#1eb8ff',
  '#22d3a6',
  '#a855f7',
  '#ff7a1a'
]

const STICKERS = [
  '😀', '😂', '🤣', '😍', '😎', '🤩', '🥳', '😭', '😡', '🤯',
  '🙏', '👏', '🙌', '💪', '🔥', '⚽', '🏆', '🥇', '🎵', '🎶',
  '🎧', '🎤', '🎸', '🥁', '🎹', '💯', '❤️', '💙', '💚', '💛',
  '🧡', '💜', '✨', '⭐', '🌟', '⚡', '💥', '🎉', '🎊', '👑',
  '🚀', '🌍', '🇹🇿', '👍', '👎', '👀', '🤝', '😮', '😅', '🤔',
  '😴', '🤗', '😉', '🥰', '🏀', '🏃', '🕺', '💃', '🎯', '🏅'
]

export function SheetShell({ title, onDone, children }) {
  return (
    <div className="ed2-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="ed2-sheet-head">
        <h3>{title}</h3>
        <button className="ed2-sheet-done" onClick={onDone} aria-label="Done">
          <CheckIcon size={18} />
        </button>
      </div>
      {children}
    </div>
  )
}

function SliderRow({ label, value, onChange }) {
  return (
    <div className="ed2-slider-row">
      <span className="ed2-slider-label">{label}</span>
      <input
        type="range"
        className="ed-range"
        min="0"
        max="100"
        step="1"
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
      <b className="ed2-slider-value">{Math.round(value * 100)}%</b>
    </div>
  )
}

export function TrimSheet({
  duration,
  trimStart,
  trimEnd,
  sliderStep,
  fmt,
  onStart,
  onEnd,
  onDone
}) {
  const clipLength = Math.max(0, trimEnd - trimStart)

  return (
    <SheetShell title="Trim" onDone={onDone}>
      <div className="ed-trim-info">
        <span>New length</span>
        <b>
          {fmt(clipLength)} / {fmt(duration)}
        </b>
      </div>

      <div className="ed-timeline">
        <span
          style={{
            left: `${(trimStart / duration) * 100}%`,
            width: `${(clipLength / duration) * 100}%`
          }}
        />
      </div>

      <div className="ed-trim-row">
        <span className="ed-trim-label">Start</span>
        <button className="ed-nudge" onClick={() => onStart(trimStart - 1)} aria-label="Back 1 second">
          −
        </button>
        <input
          type="range"
          className="ed-range"
          min="0"
          max={duration}
          step={sliderStep}
          value={trimStart}
          onChange={(e) => onStart(Number(e.target.value))}
        />
        <button className="ed-nudge" onClick={() => onStart(trimStart + 1)} aria-label="Forward 1 second">
          +
        </button>
        <b className="ed-time">{fmt(trimStart)}</b>
      </div>

      <div className="ed-trim-row">
        <span className="ed-trim-label">End</span>
        <button className="ed-nudge" onClick={() => onEnd(trimEnd - 1)} aria-label="Back 1 second">
          −
        </button>
        <input
          type="range"
          className="ed-range"
          min="0"
          max={duration}
          step={sliderStep}
          value={trimEnd}
          onChange={(e) => onEnd(Number(e.target.value))}
        />
        <button className="ed-nudge" onClick={() => onEnd(trimEnd + 1)} aria-label="Forward 1 second">
          +
        </button>
        <b className="ed-time">{fmt(trimEnd)}</b>
      </div>
    </SheetShell>
  )
}

export function FilterSheet({ filterId, onChange, onDone }) {
  return (
    <SheetShell title="Filters" onDone={onDone}>
      <div className="ed-filters">
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={filterId === f.id ? 'ed-filter active' : 'ed-filter'}
            onClick={() => onChange(f.id)}
          >
            <span className="ed-filter-swatch" style={{ filter: f.css }} />
            <span>{f.label}</span>
          </button>
        ))}
      </div>
    </SheetShell>
  )
}

export function StickerSheet({ onPick, onDone }) {
  return (
    <SheetShell title="Stickers" onDone={onDone}>
      <div className="ed2-emoji-grid">
        {STICKERS.map(emoji => (
          <button key={emoji} className="ed2-emoji" onClick={() => onPick(emoji)}>
            {emoji}
          </button>
        ))}
      </div>
    </SheetShell>
  )
}

export function MusicSheet({
  music,
  musicVol,
  videoVol,
  error,
  onPick,
  onRemove,
  onMusicVol,
  onVideoVol,
  onDone
}) {
  const inputRef = useRef(null)

  const handleChange = (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (file) onPick(file)
  }

  return (
    <SheetShell title="Music" onDone={onDone}>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.opus"
        hidden
        onChange={handleChange}
      />

      {music ? (
        <div className="ed2-music-card">
          <span className="ed2-music-icon">
            <MusicIcon size={20} />
          </span>
          <span className="ed2-music-name">{music.name}</span>
          <button className="ed2-music-btn" onClick={() => inputRef.current && inputRef.current.click()}>
            Change
          </button>
          <button className="ed2-music-remove" onClick={onRemove} aria-label="Remove music">
            <TrashIcon size={18} />
          </button>
        </div>
      ) : (
        <button className="ed2-pick" onClick={() => inputRef.current && inputRef.current.click()}>
          <MusicIcon size={22} />
          Choose from phone
        </button>
      )}

      {error && <p className="ed2-sheet-error">{error}</p>}

      {music && (
        <>
          <SliderRow label="Music" value={musicVol} onChange={onMusicVol} />
          <SliderRow label="Original sound" value={videoVol} onChange={onVideoVol} />
        </>
      )}
    </SheetShell>
  )
}

export function SettingsSheet({ allowComments, onAllowComments, videoVol, onVideoVol, onDone }) {
  return (
    <SheetShell title="Settings" onDone={onDone}>
      <div className="ed2-setting-row">
        <span>Allow comments</span>
        <button
          type="button"
          className={allowComments ? 'ed-switch on' : 'ed-switch'}
          onClick={() => onAllowComments(!allowComments)}
          role="switch"
          aria-checked={allowComments}
          aria-label="Allow comments"
        />
      </div>

      <SliderRow label="Video sound" value={videoVol} onChange={onVideoVol} />
    </SheetShell>
  )
}

export function TextEditor({ draft, onChange, onCancel, onDone }) {
  const boxed = Boolean(draft.box)

  return (
    <div className="ed2-textmodal">
      <div className="ed2-textmodal-top">
        <button className="ed2-text-btn" onClick={onCancel}>
          Cancel
        </button>
        <button className="ed2-text-btn primary" onClick={onDone}>
          Done
        </button>
      </div>

      <div className="ed2-textmodal-body">
        <textarea
          className="ed2-text-input"
          style={{
            color: boxed ? contrastColor(draft.color) : draft.color,
            background: boxed ? draft.color : 'transparent'
          }}
          value={draft.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Type something..."
          maxLength={120}
          rows={3}
          autoFocus
        />
      </div>

      <div className="ed2-textmodal-tools">
        <button
          className={boxed ? 'ed2-box-btn on' : 'ed2-box-btn'}
          onClick={() => onChange({ box: !boxed })}
          aria-label="Text background"
        >
          <BoxTextIcon />
        </button>

        <div className="ed2-colors">
          {TEXT_COLORS.map(c => (
            <button
              key={c}
              className={draft.color === c ? 'ed2-color active' : 'ed2-color'}
              style={{ background: c }}
              onClick={() => onChange({ color: c })}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}