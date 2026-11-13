import { useNavigate } from 'react-router-dom'
import { useChat } from '../context/ChatContext'
import { useVideos } from '../context/VideoContext'
import { avatarGradient, avatarLetter } from '../utils/avatar'
import '../styles/messages.css'

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

function Messages() {
  const navigate = useNavigate()
  const { chats, unread } = useChat()
  const { followedUsers } = useVideos()

  // Wote walio na mazungumzo + wale uliowafuata
  const names = Array.from(new Set([...Object.keys(chats), ...followedUsers]))

  const items = names
    .map(name => {
      const msgs = chats[name] || []
      return {
        name,
        last: msgs.length ? msgs[msgs.length - 1] : null,
        unread: unread[name] || 0
      }
    })
    .sort((a, b) => (b.last?.createdAt || 0) - (a.last?.createdAt || 0))

  const openChat = (name) => {
    navigate(`/messages/${encodeURIComponent(name)}`)
  }

  return (
    <div className="messages-wrapper">
      <h2 className="messages-title">Ujumbe</h2>

      {items.length === 0 && (
        <div className="messages-empty">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2z" />
          </svg>
          <p>Hakuna mazungumzo bado.</p>
          <span>Mfuate mtu kwenye Feed ili aonekane hapa.</span>
        </div>
      )}

      <div className="messages-list">
        {items.map(item => (
          <button
            key={item.name}
            className="message-row"
            onClick={() => openChat(item.name)}
          >
            <span
              className="message-avatar"
              style={{ background: avatarGradient(item.name) }}
            >
              {avatarLetter(item.name)}
            </span>

            <span className="message-main">
              <span className="message-top">
                <span className="message-name">{item.name}</span>
                {item.last && (
                  <span className="message-time">{timeAgo(item.last.createdAt)}</span>
                )}
              </span>

              <span className="message-bottom">
                <span className={item.unread > 0 ? 'message-preview unread' : 'message-preview'}>
                  {item.last
                    ? `${item.last.from === 'me' ? 'Wewe: ' : ''}${item.last.text}`
                    : 'Anza mazungumzo'}
                </span>
                {item.unread > 0 && (
                  <span className="message-badge">{item.unread}</span>
                )}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default Messages