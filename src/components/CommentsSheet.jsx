import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useVideos } from '../context/VideoContext'
import '../styles/comments.css'

const ME = '@wewe'

function timeAgo(ts) {
  const sec = Math.floor((Date.now() - ts) / 1000)
  if (sec < 60) return 'sasa hivi'
  const min = Math.floor(sec / 60)
  if (min < 60) return `dk ${min}`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `saa ${hr}`
  const day = Math.floor(hr / 24)
  return `siku ${day}`
}

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K'
  return String(n)
}

function HeartIcon({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s-6.7-4.3-9.5-8.2C.6 9.9 1.4 6.4 4.3 4.9c2.4-1.3 5-.6 6.7 1.4 1.7-2 4.3-2.7 6.7-1.4 2.9 1.5 3.7 5 1.8 7.9C18.7 16.7 12 21 12 21z" />
    </svg>
  )
}

function ReplyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 14 4 9 9 4" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function ChevronIcon({ up }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: up ? 'rotate(180deg)' : 'none' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function CommentRow({ c, isReply, liked, onLike, onReply, onDelete }) {
  const likeCount = (c.likes || 0) + (liked ? 1 : 0)
  const mine = c.username === ME

  return (
    <div className={isReply ? 'comment-item is-reply' : 'comment-item'}>
      <div className="comment-avatar">
        {c.username.replace('@', '').charAt(0).toUpperCase()}
      </div>

      <div className="comment-body">
        <span className="comment-user">{c.username}</span>
        <p className="comment-text">
          {c.replyTo && <span className="comment-mention">{c.replyTo} </span>}
          {c.text}
        </p>

        <div className="comment-footer">
          <span className="comment-time">{timeAgo(c.createdAt)}</span>
          <button className="comment-link" onClick={() => onReply(c)}>
            <ReplyIcon />
            <span>Jibu</span>
          </button>
          {mine && (
            <button
              className="comment-link danger"
              onClick={() => onDelete(c.id)}
              aria-label="Futa maoni"
            >
              <TrashIcon />
              <span>Futa</span>
            </button>
          )}
        </div>
      </div>

      <button
        className={liked ? 'comment-like liked' : 'comment-like'}
        onClick={() => onLike(c.id)}
        aria-label="Penda maoni"
      >
        <HeartIcon filled={liked} />
        {likeCount > 0 && <span>{formatCount(likeCount)}</span>}
      </button>
    </div>
  )
}

function CommentsSheet({ video, onClose }) {
  const {
    comments,
    addComment,
    deleteComment,
    likedCommentIds,
    toggleCommentLike
  } = useVideos()

  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState(null) // { rootId, username, mention }
  const [expanded, setExpanded] = useState({})
  const inputRef = useRef(null)

  const list = comments[video.id] || []
  const total = video.comments + list.length
  const topLevel = list.filter(c => !c.parentId)

  const repliesOf = (id) =>
    list
      .filter(c => c.parentId === id)
      .sort((a, b) => a.createdAt - b.createdAt)

  // Funga kwa kubonyeza Esc
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleReply = (comment) => {
    const rootId = comment.parentId || comment.id
    setReplyTo({
      rootId,
      username: comment.username,
      mention: Boolean(comment.parentId)
    })
    setExpanded(prev => ({ ...prev, [rootId]: true }))
    if (inputRef.current) inputRef.current.focus()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const clean = text.trim()
    if (!clean) return

    if (replyTo) {
      addComment(
        video.id,
        clean,
        replyTo.rootId,
        replyTo.mention ? replyTo.username : null
      )
    } else {
      addComment(video.id, clean)
    }

    setText('')
    setReplyTo(null)
  }

  const handleDelete = (commentId) => {
    deleteComment(video.id, commentId)
    if (replyTo && replyTo.rootId === commentId) setReplyTo(null)
  }

  return createPortal(
    <div className="comments-backdrop" onClick={onClose}>
      <div
        className="comments-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Maoni"
      >
        <div className="comments-handle" />

        <div className="comments-header">
          <h3>Maoni · {total}</h3>
          <button className="comments-close" onClick={onClose} aria-label="Funga">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="comments-list">
          {topLevel.length === 0 && (
            <p className="comments-empty">
              Hakuna maoni bado. Kuwa wa kwanza kuandika!
            </p>
          )}

          {topLevel.map((c) => {
            const replies = repliesOf(c.id)
            const open = Boolean(expanded[c.id])

            return (
              <div className="comment-thread" key={c.id}>
                <CommentRow
                  c={c}
                  isReply={false}
                  liked={likedCommentIds.includes(c.id)}
                  onLike={toggleCommentLike}
                  onReply={handleReply}
                  onDelete={handleDelete}
                />

                {replies.length > 0 && (
                  <button
                    className="replies-toggle"
                    onClick={() =>
                      setExpanded(prev => ({ ...prev, [c.id]: !prev[c.id] }))
                    }
                  >
                    <span className="replies-line" />
                    <span>
                      {open ? 'Ficha majibu' : `Tazama majibu (${replies.length})`}
                    </span>
                    <ChevronIcon up={open} />
                  </button>
                )}

                {open &&
                  replies.map((r) => (
                    <CommentRow
                      key={r.id}
                      c={r}
                      isReply={true}
                      liked={likedCommentIds.includes(r.id)}
                      onLike={toggleCommentLike}
                      onReply={handleReply}
                      onDelete={handleDelete}
                    />
                  ))}
              </div>
            )
          })}
        </div>

        {replyTo && (
          <div className="reply-banner">
            <span>
              Unamjibu <strong>{replyTo.username}</strong>
            </span>
            <button
              className="reply-cancel"
              onClick={() => setReplyTo(null)}
              aria-label="Ghairi jibu"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <form className="comments-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="comments-input"
            placeholder={replyTo ? 'Andika jibu...' : 'Andika maoni...'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={200}
          />
          <button
            type="submit"
            className="comments-send"
            disabled={!text.trim()}
            aria-label="Tuma"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default CommentsSheet