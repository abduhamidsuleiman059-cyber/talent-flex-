import { useNavigate } from 'react-router-dom'
import { useVideos } from '../context/VideoContext'
import { avatarGradient, avatarLetter } from '../utils/avatar'
import '../styles/profile.css'
import '../styles/friends.css'

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
  const { videos, followedUsers, toggleFollow } = useVideos()

  const approved = videos.filter(v => v.status === 'approved')
  const countFor = (name) => approved.filter(v => v.username === name).length

  // Watu wa kufuata: wenye video zilizoidhinishwa ambao hujawafuata
  const suggestions = Array.from(new Set(approved.map(v => v.username))).filter(
    name => name !== ME && !followedUsers.includes(name)
  )

  const openChat = (name) => {
    navigate(`/messages/${encodeURIComponent(name)}`)
  }

  return (
    <div className="friends-wrapper">
      <h2 className="friends-title">Marafiki</h2>

      <h3 className="friends-heading">Unaowafuata ({followedUsers.length})</h3>

      {followedUsers.length === 0 ? (
        <p className="friends-empty">
          Hujamfuata mtu yeyote bado. Chagua kutoka kwenye orodha hapa chini.
        </p>
      ) : (
        <div className="follow-list">
          {followedUsers.map(name => (
            <div className="follow-row" key={name}>
              <span
                className="follow-avatar"
                style={{ background: avatarGradient(name) }}
              >
                {avatarLetter(name)}
              </span>

              <span className="follow-main">
                <span className="follow-name">{name}</span>
                <span className="follow-meta">{countFor(name)} video</span>
              </span>

              <button
                className="follow-msg"
                onClick={() => openChat(name)}
                aria-label={`Mtumie ujumbe ${name}`}
              >
                <ChatIcon />
              </button>

              <button
                className="follow-unfollow"
                onClick={() => toggleFollow(name)}
              >
                Acha kufuata
              </button>
            </div>
          ))}
        </div>
      )}

      <h3 className="friends-heading">Watu unaoweza kuwafuata</h3>

      {suggestions.length === 0 ? (
        <p className="friends-empty">
          Umewafuata wote waliopo kwa sasa. Wengine wakipakia vipaji, wataonekana hapa.
        </p>
      ) : (
        <div className="follow-list">
          {suggestions.map(name => (
            <div className="follow-row" key={name}>
              <span
                className="follow-avatar"
                style={{ background: avatarGradient(name) }}
              >
                {avatarLetter(name)}
              </span>

              <span className="follow-main">
                <span className="follow-name">{name}</span>
                <span className="follow-meta">{countFor(name)} video</span>
              </span>

              <button className="follow-add" onClick={() => toggleFollow(name)}>
                Fuata
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Friends