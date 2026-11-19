import { useNavigate } from 'react-router-dom'
import { useVideos } from '../context/VideoContext'
import Avatar from '../components/Avatar'
import FollowButton from '../components/FollowButton'
import { displayName } from '../utils/displayName'
import '../styles/profile.css'
import '../styles/friends.css'
import '../styles/userpage.css'

const ME = '@wewe'

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2z" />
    </svg>
  )
}

function Friends() {
  const navigate = useNavigate()
  const { videos, followedUsers } = useVideos()

  const approved = videos.filter(v => v.status === 'approved')
  const countFor = (name) => approved.filter(v => v.username === name).length

  // Watu wa kufuata: wenye video ambao hujawafuata
  const suggestions = Array.from(new Set(approved.map(v => v.username))).filter(
    name => name !== ME && !followedUsers.includes(name)
  )

  const openChat = (name) => {
    navigate(`/messages/${encodeURIComponent(name)}`)
  }

  const openUser = (name) => {
    navigate(`/user/${encodeURIComponent(name)}`)
  }

  return (
    <div className="friends-wrapper">
      <h2 className="friends-title">Friends</h2>

      <h3 className="friends-heading">Following ({followedUsers.length})</h3>

      {followedUsers.length === 0 ? (
        <p className="friends-empty">Hujafuata mtu bado.</p>
      ) : (
        <div className="follow-list">
          {followedUsers.map(name => (
            <div className="follow-row" key={name}>
              <button className="follow-link" onClick={() => openUser(name)}>
                <Avatar username={name} size={46} />

                <span className="follow-main">
                  <span className="follow-name">{displayName(name)}</span>
                  <span className="follow-meta">{countFor(name)} videos</span>
                </span>
              </button>

              <button
                className="follow-msg"
                onClick={() => openChat(name)}
                aria-label={`Message ${displayName(name)}`}
              >
                <ChatIcon />
              </button>

              <FollowButton username={name} size="sm" />
            </div>
          ))}
        </div>
      )}

      <h3 className="friends-heading">Suggested</h3>

      {suggestions.length === 0 ? (
        <p className="friends-empty">Hakuna wapya kwa sasa.</p>
      ) : (
        <div className="follow-list">
          {suggestions.map(name => (
            <div className="follow-row" key={name}>
              <button className="follow-link" onClick={() => openUser(name)}>
                <Avatar username={name} size={46} />

                <span className="follow-main">
                  <span className="follow-name">{displayName(name)}</span>
                  <span className="follow-meta">{countFor(name)} videos</span>
                </span>
              </button>

              <FollowButton username={name} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Friends