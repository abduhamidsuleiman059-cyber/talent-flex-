import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useChat } from '../context/ChatContext'
import { avatarGradient, avatarLetter } from '../utils/avatar'
import '../styles/chat.css'

function formatClock(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function Chat() {
  const navigate = useNavigate()
  const { user } = useParams()
  const name = decodeURIComponent(user || '')
  const { chats, sendMessage, markRead } = useChat()

  const [text, setText] = useState('')
  const endRef = useRef(null)
  const firstScroll = useRef(true)

  const messages = chats[name] || []

  // Soma ujumbe mara unapofungua mazungumzo
  useEffect(() => {
    markRead(name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  // Shuka chini ujumbe unapoongezeka
  useEffect(() => {
    if (!endRef.current) return
    endRef.current.scrollIntoView({
      behavior: firstScroll.current ? 'auto' : 'smooth',
      block: 'end'
    })
    firstScroll.current = false
  }, [messages.length])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage(name, text)
    setText('')
  }

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <button
          className="chat-back"
          onClick={() => navigate('/messages')}
          aria-label="Rudi"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <span
          className="chat-avatar"
          style={{ background: avatarGradient(name) }}
        >
          {avatarLetter(name)}
        </span>

        <span className="chat-name">{name}</span>
      </div>

      <div className="chat-list">
        {messages.length === 0 && (
          <p className="chat-empty">
            Hakuna ujumbe bado. Mwambie {name} hujambo! 👋
          </p>
        )}

        {messages.map(m => (
          <div
            key={m.id}
            className={m.from === 'me' ? 'chat-row mine' : 'chat-row'}
          >
            <div className="chat-bubble">
              <p>{m.text}</p>
              <span className="chat-clock">{formatClock(m.createdAt)}</span>
            </div>
          </div>
        ))}

        <div ref={endRef} />
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder="Andika ujumbe..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
        />
        <button
          type="submit"
          className="chat-send"
          disabled={!text.trim()}
          aria-label="Tuma"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  )
}

export default Chat