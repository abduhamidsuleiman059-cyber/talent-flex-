import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVideos } from '../context/VideoContext'
import VideoCard from '../components/VideoCard'
import { avatarGradient, avatarLetter } from '../utils/avatar'
import '../styles/explore.css'
import '../styles/profile.css'

const ME = '@wewe'
const PROFILE_KEY = 'talentflex-profile'
const DEFAULT_PROFILE = { name: 'Wewe', bio: '' }

function readProfile() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILE_KEY))
    if (raw && typeof raw.name === 'string') {
      return { name: raw.name, bio: raw.bio || '' }
    }
  } catch {
    // tumia chaguo-msingi
  }
  return DEFAULT_PROFILE
}

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K'
  return String(n)
}

function HeartIcon({ size = 13 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M12 21s-6.7-4.3-9.5-8.2C.6 9.9 1.4 6.4 4.3 4.9c2.4-1.3 5-.6 6.7 1.4 1.7-2 4.3-2.7 6.7-1.4 2.9 1.5 3.7 5 1.8 7.9C18.7 16.7 12 21 12 21z" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2z" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function HeartOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-6.7-4.3-9.5-8.2C.6 9.9 1.4 6.4 4.3 4.9c2.4-1.3 5-.6 6.7 1.4 1.7-2 4.3-2.7 6.7-1.4 2.9 1.5 3.7 5 1.8 7.9C18.7 16.7 12 21 12 21z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function CategoryGlyph({ category }) {
  if (category === 'ball') {
    return (
      <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polygon points="12 8 15.5 10.5 14.2 14.5 9.8 14.5 8.5 10.5" />
        <line x1="12" y1="8" x2="12" y2="3.2" />
        <line x1="15.5" y1="10.5" x2="20" y2="9" />
        <line x1="14.2" y1="14.5" x2="17" y2="18.5" />
        <line x1="9.8" y1="14.5" x2="7" y2="18.5" />
        <line x1="8.5" y1="10.5" x2="4" y2="9" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function Profile() {
  const navigate = useNavigate()
  const { videos, likedIds, followedUsers, toggleFollow, deleteVideo } = useVideos()

  const [profile, setProfile] = useState(readProfile)
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftBio, setDraftBio] = useState('')
  const [tab, setTab] = useState('mine')
  const [selectedId, setSelectedId] = useState(null)

  const myVideos = videos.filter(v => v.username === ME)
  const likedVideos = videos.filter(
    v => v.status === 'approved' && likedIds.includes(v.id)
  )
  const totalLikes = myVideos.reduce(
    (sum, v) => sum + v.likes + (likedIds.includes(v.id) ? 1 : 0),
    0
  )

  const selected = videos.find(v => v.id === selectedId) || null

  // Funga video kwa kubonyeza Esc
  useEffect(() => {
    if (!selected) return
    const onKey = (e) => {
      if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  const startEdit = () => {
    setDraftName(profile.name)
    setDraftBio(profile.bio)
    setEditing(true)
  }

  const saveEdit = (e) => {
    e.preventDefault()
    const next = {
      name: draftName.trim() || DEFAULT_PROFILE.name,
      bio: draftBio.trim()
    }
    setProfile(next)
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
    } catch (err) {
      console.error('Imeshindwa kuhifadhi wasifu', err)
    }
    setEditing(false)
  }

  const handleDelete = (id) => {
    const ok = window.confirm('Futa video hii? Hatua hii haiwezi kurudishwa.')
    if (!ok) return
    deleteVideo(id)
    if (selectedId === id) setSelectedId(null)
  }

  const renderTile = (video, canDelete) => (
    <div className="profile-tile-wrap" key={video.id}>
      <button
        className="explore-tile"
        style={{ background: video.gradient || '#222' }}
        onClick={() => setSelectedId(video.id)}
        aria-label={`Fungua video ya ${video.username}`}
      >
        {video.videoUrl ? (
          <video
            className="explore-thumb"
            src={`${video.videoUrl}#t=0.1`}
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <span className="explore-glyph">
            <CategoryGlyph category={video.category} />
          </span>
        )}

        <span className="explore-tile-shade" />

        {video.status === 'pending' && (
          <span className="tile-status pending">Inasubiri</span>
        )}
        {video.status === 'rejected' && (
          <span className="tile-status rejected">Imekataliwa</span>
        )}

        <span className="explore-tile-info">
          <span className="explore-tile-user">{video.username}</span>
          <span className="explore-tile-likes">
            <HeartIcon />
            {formatCount(video.likes + (likedIds.includes(video.id) ? 1 : 0))}
          </span>
        </span>
      </button>

      {canDelete && (
        <button
          className="tile-delete"
          onClick={() => handleDelete(video.id)}
          aria-label="Futa video"
        >
          <TrashIcon />
        </button>
      )}
    </div>
  )

  const followingInfo = followedUsers.map(name => ({
    name,
    count: videos.filter(v => v.username === name && v.status === 'approved').length
  }))

  return (
    <>
      <div className="profile-wrapper">
        {/* ===== Juu: picha, jina na bio ===== */}
        <div className="profile-top">
          <div
            className="profile-avatar"
            style={{ background: avatarGradient(ME) }}
          >
            {avatarLetter(profile.name)}
          </div>

          <h2 className="profile-name">{profile.name}</h2>
          <span className="profile-handle">{ME}</span>

          {profile.bio ? (
            <p className="profile-bio">{profile.bio}</p>
          ) : (
            <p className="profile-bio muted">Hujaandika maelezo bado.</p>
          )}
        </div>

        {/* ===== Takwimu ===== */}
        <div className="profile-stats">
          <div className="profile-stat">
            <b>{myVideos.length}</b>
            <span>Video</span>
          </div>
          <div className="profile-stat">
            <b>0</b>
            <span>Wafuasi</span>
          </div>
          <div className="profile-stat">
            <b>{followedUsers.length}</b>
            <span>Unaowafuata</span>
          </div>
          <div className="profile-stat">
            <b>{formatCount(totalLikes)}</b>
            <span>Likes</span>
          </div>
        </div>

        {/* ===== Hariri wasifu ===== */}
        {editing ? (
          <form className="profile-form" onSubmit={saveEdit}>
            <label className="profile-label" htmlFor="profileName">Jina</label>
            <input
              id="profileName"
              className="profile-input"
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={20}
              placeholder="Jina lako"
            />

            <label className="profile-label" htmlFor="profileBio">Maelezo (bio)</label>
            <textarea
              id="profileBio"
              className="profile-input profile-textarea"
              value={draftBio}
              onChange={(e) => setDraftBio(e.target.value)}
              maxLength={80}
              rows={3}
              placeholder="Eleza kipaji chako kwa ufupi..."
            />
            <span className="profile-count">{draftBio.length}/80</span>

            <div className="profile-form-actions">
              <button
                type="button"
                className="profile-btn ghost"
                onClick={() => setEditing(false)}
              >
                Ghairi
              </button>
              <button type="submit" className="profile-btn primary">
                Hifadhi
              </button>
            </div>
          </form>
        ) : (
          <button className="profile-edit-btn" onClick={startEdit}>
            Hariri wasifu
          </button>
        )}

        {/* ===== Vichupo ===== */}
        <div className="profile-tabs">
          <button
            className={tab === 'mine' ? 'profile-tab active' : 'profile-tab'}
            onClick={() => setTab('mine')}
            aria-label="Video zangu"
          >
            <GridIcon />
          </button>
          <button
            className={tab === 'liked' ? 'profile-tab active' : 'profile-tab'}
            onClick={() => setTab('liked')}
            aria-label="Zilizopendwa"
          >
            <HeartOutlineIcon />
          </button>
          <button
            className={tab === 'following' ? 'profile-tab active' : 'profile-tab'}
            onClick={() => setTab('following')}
            aria-label="Unaowafuata"
          >
            <UsersIcon />
          </button>
        </div>

        {/* ===== Maudhui ya kichupo ===== */}
        {tab === 'mine' && (
          myVideos.length === 0 ? (
            <div className="profile-empty">
              <p>Hujapakia video bado.</p>
              <span>Gusa kitufe cha + kwenye navbar kupakia kipaji chako.</span>
              <button className="profile-btn primary" onClick={() => navigate('/upload')}>
                Pakia video
              </button>
            </div>
          ) : (
            <div className="explore-grid">
              {myVideos.map(v => renderTile(v, true))}
            </div>
          )
        )}

        {tab === 'liked' && (
          likedVideos.length === 0 ? (
            <div className="profile-empty">
              <p>Hujapenda video yoyote bado.</p>
              <span>Video unazopenda zitaonekana hapa.</span>
            </div>
          ) : (
            <div className="explore-grid">
              {likedVideos.map(v => renderTile(v, false))}
            </div>
          )
        )}

        {tab === 'following' && (
          followingInfo.length === 0 ? (
            <div className="profile-empty">
              <p>Hujamfuata mtu yeyote bado.</p>
              <span>Gusa + kwenye duara la mtumiaji kwenye Feed kumfuata.</span>
            </div>
          ) : (
            <div className="follow-list">
              {followingInfo.map(item => (
                <div className="follow-row" key={item.name}>
                  <span
                    className="follow-avatar"
                    style={{ background: avatarGradient(item.name) }}
                  >
                    {avatarLetter(item.name)}
                  </span>

                  <span className="follow-main">
                    <span className="follow-name">{item.name}</span>
                    <span className="follow-meta">{item.count} video</span>
                  </span>

                  <button
                    className="follow-msg"
                    onClick={() => navigate(`/messages/${encodeURIComponent(item.name)}`)}
                    aria-label={`Mtumie ujumbe ${item.name}`}
                  >
                    <ChatIcon />
                  </button>

                  <button
                    className="follow-unfollow"
                    onClick={() => toggleFollow(item.name)}
                  >
                    Acha kufuata
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* ===== Video ikifunguliwa skrini nzima ===== */}
      {selected && (
        <div className="explore-viewer">
          <button
            className="explore-back"
            onClick={() => setSelectedId(null)}
            aria-label="Rudi"
          >
            <BackIcon />
          </button>
          <div className="explore-viewer-card">
            <VideoCard video={selected} />
          </div>
        </div>
      )}
    </>
  )
}

export default Profile