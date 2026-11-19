import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVideos } from '../context/VideoContext'
import VideoCard from '../components/VideoCard'
import Avatar from '../components/Avatar'
import FollowButton from '../components/FollowButton'
import TileGlyph from '../components/TileGlyph'
import { avatarGradient, avatarLetter } from '../utils/avatar'
import { displayName } from '../utils/displayName'
import { getFilterCss } from '../utils/videoFilters'
import { cropToDataUrl } from '../utils/imageTools'
import { getCurrent } from '../utils/auth'
import '../styles/explore.css'
import '../styles/profile.css'
import '../styles/profile-cover.css'

const ME = '@wewe'
const PROFILE_KEY = 'talentflex-profile'
const DEFAULT_PROFILE = { name: 'Wewe', bio: '', avatar: '', cover: '' }

function readProfile() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILE_KEY))
    if (raw && typeof raw.name === 'string') {
      return {
        name: raw.name,
        bio: raw.bio || '',
        avatar: raw.avatar || '',
        cover: raw.cover || ''
      }
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

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2z" />
    </svg>
  )
}

function CameraIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

function Profile() {
  const navigate = useNavigate()
  const { videos, likedIds, followedUsers } = useVideos()
  const current = getCurrent()
  const handle = current ? `@${current.username}` : ME

  const [profile, setProfile] = useState(readProfile)
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftBio, setDraftBio] = useState('')
  const [tab, setTab] = useState('mine')
  const [selectedId, setSelectedId] = useState(null)
  const [imgError, setImgError] = useState('')

  const avatarInput = useRef(null)
  const coverInput = useRef(null)

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

  // Hifadhi wasifu (inarudisha true ikifanikiwa)
  const persist = (next) => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
      setProfile(next)
      return true
    } catch (err) {
      console.error('Imeshindwa kuhifadhi wasifu', err)
      setImgError('Imeshindwa kuhifadhi. Nafasi imejaa?')
      return false
    }
  }

  const startEdit = () => {
    setDraftName(profile.name)
    setDraftBio(profile.bio)
    setEditing(true)
  }

  const saveEdit = (e) => {
    e.preventDefault()
    const next = {
      ...profile,
      name: draftName.trim() || DEFAULT_PROFILE.name,
      bio: draftBio.trim()
    }
    if (persist(next)) setEditing(false)
  }

  // kind = 'avatar' au 'cover'
  const handlePick = async (kind, e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return

    setImgError('')

    if (!file.type.startsWith('image/')) {
      setImgError('Chagua picha (JPG au PNG).')
      return
    }

    try {
      const dataUrl =
        kind === 'avatar'
          ? await cropToDataUrl(file, 320, 320)
          : await cropToDataUrl(file, 960, 480)
      persist({ ...profile, [kind]: dataUrl })
    } catch {
      setImgError('Picha haisomeki. Jaribu nyingine.')
    }
  }

  const renderTile = (video) => (
    <div className="profile-tile-wrap" key={video.id}>
      <button
        className="explore-tile"
        style={{ background: video.gradient || '#222' }}
        onClick={() => setSelectedId(video.id)}
        aria-label={`Open video by ${displayName(video.username)}`}
      >
        {video.cover ? (
          <img
            className="explore-thumb"
            src={video.cover}
            alt=""
            draggable={false}
          />
        ) : video.videoUrl ? (
          <video
            className="explore-thumb"
            src={`${video.videoUrl}#t=${video.trimStart || 0.1}`}
            muted
            playsInline
            preload="metadata"
            style={video.filter ? { filter: getFilterCss(video.filter) } : undefined}
          />
        ) : (
          <span className="explore-glyph">
            <TileGlyph category={video.category} />
          </span>
        )}

        <span className="explore-tile-shade" />

        <span className="explore-tile-info">
          <span className="explore-tile-user">{displayName(video.username)}</span>
          <span className="explore-tile-likes">
            <HeartIcon />
            {formatCount(video.likes + (likedIds.includes(video.id) ? 1 : 0))}
          </span>
        </span>
      </button>
    </div>
  )

  const followingInfo = followedUsers.map(name => ({
    name,
    count: videos.filter(v => v.username === name && v.status === 'approved').length
  }))

  return (
    <>
      <div className="pf-wrapper">
        {/* ===== Background ===== */}
        <div
          className="pf-cover"
          style={profile.cover ? { backgroundImage: `url(${profile.cover})` } : undefined}
        >
          <button
            className="pf-round-btn pf-settings"
            onClick={() => navigate('/settings')}
            aria-label="Settings"
          >
            <GearIcon />
          </button>

          <button
            className="pf-round-btn pf-cover-edit"
            onClick={() => coverInput.current && coverInput.current.click()}
            aria-label="Change cover"
          >
            <CameraIcon />
          </button>
        </div>

        {/* ===== Picha na takwimu ===== */}
        <div className="pf-head">
          <div className="pf-avatar-wrap">
            <div
              className="pf-avatar"
              style={profile.avatar ? undefined : { background: avatarGradient(ME) }}
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt="Profile" />
              ) : (
                avatarLetter(profile.name)
              )}
            </div>

            <button
              className="pf-avatar-edit"
              onClick={() => avatarInput.current && avatarInput.current.click()}
              aria-label="Change photo"
            >
              <CameraIcon size={15} />
            </button>
          </div>

          <div className="pf-stats">
            <div className="pf-stat">
              <b>{followedUsers.length}</b>
              <span>Following</span>
            </div>
            <div className="pf-stat">
              <b>0</b>
              <span>Followers</span>
            </div>
            <div className="pf-stat">
              <b>{formatCount(totalLikes)}</b>
              <span>Likes</span>
            </div>
          </div>
        </div>

        {/* Vitufe vilivyofichwa vya kuchagua picha */}
        <input
          ref={avatarInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handlePick('avatar', e)}
        />
        <input
          ref={coverInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handlePick('cover', e)}
        />

        {/* ===== Jina na bio ===== */}
        <div className="pf-info">
          <h2 className="pf-name">{profile.name}</h2>
          <span className="pf-handle">{handle}</span>

          {profile.bio ? (
            <p className="pf-bio">{profile.bio}</p>
          ) : (
            <p className="pf-bio muted">No bio yet.</p>
          )}

          {imgError && <p className="pf-error">{imgError}</p>}
        </div>

        {/* ===== Edit profile ===== */}
        {editing ? (
          <div className="pf-section" style={{ marginTop: 14 }}>
            <form className="profile-form" onSubmit={saveEdit}>
              <label className="profile-label" htmlFor="profileName">Name</label>
              <input
                id="profileName"
                className="profile-input"
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                maxLength={20}
                placeholder="Your name"
              />

              <label className="profile-label" htmlFor="profileBio">Bio</label>
              <textarea
                id="profileBio"
                className="profile-input profile-textarea"
                value={draftBio}
                onChange={(e) => setDraftBio(e.target.value)}
                maxLength={80}
                rows={3}
                placeholder="Andika kitu kukuhusu..."
              />
              <span className="profile-count">{draftBio.length}/80</span>

              <div className="profile-form-actions">
                <button
                  type="button"
                  className="profile-btn ghost"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="profile-btn primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="pf-actions">
            <button className="profile-edit-btn" onClick={startEdit}>
              Edit profile
            </button>
          </div>
        )}

        {/* ===== Vichupo ===== */}
        <div className="pf-body">
          <div className="profile-tabs">
            <button
              className={tab === 'mine' ? 'profile-tab active' : 'profile-tab'}
              onClick={() => setTab('mine')}
              aria-label="My videos"
            >
              <GridIcon />
              <span className="pf-tab-count">{myVideos.length}</span>
            </button>
            <button
              className={tab === 'liked' ? 'profile-tab active' : 'profile-tab'}
              onClick={() => setTab('liked')}
              aria-label="Liked"
            >
              <HeartOutlineIcon />
              <span className="pf-tab-count">{likedVideos.length}</span>
            </button>
            <button
              className={tab === 'following' ? 'profile-tab active' : 'profile-tab'}
              onClick={() => setTab('following')}
              aria-label="Following"
            >
              <UsersIcon />
              <span className="pf-tab-count">{followedUsers.length}</span>
            </button>
          </div>

          {tab === 'mine' && (
            myVideos.length === 0 ? (
              <div className="profile-empty">
                <p>No videos yet</p>
                <span>Gusa + kupost ya kwanza.</span>
              </div>
            ) : (
              <div className="explore-grid">
                {myVideos.map(v => renderTile(v))}
              </div>
            )
          )}

          {tab === 'liked' && (
            likedVideos.length === 0 ? (
              <div className="profile-empty">
                <p>No liked videos</p>
              </div>
            ) : (
              <div className="explore-grid">
                {likedVideos.map(v => renderTile(v))}
              </div>
            )
          )}

          {tab === 'following' && (
            followingInfo.length === 0 ? (
              <div className="profile-empty">
                <p>Not following anyone</p>
              </div>
            ) : (
              <div className="follow-list">
                {followingInfo.map(item => (
                  <div className="follow-row" key={item.name}>
                    <Avatar username={item.name} size={46} />

                    <span className="follow-main">
                      <span className="follow-name">{displayName(item.name)}</span>
                      <span className="follow-meta">{item.count} videos</span>
                    </span>

                    <button
                      className="follow-msg"
                      onClick={() => navigate(`/messages/${encodeURIComponent(item.name)}`)}
                      aria-label={`Message ${displayName(item.name)}`}
                    >
                      <ChatIcon />
                    </button>

                    <FollowButton username={item.name} size="sm" />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* ===== Video ikifunguliwa skrini nzima ===== */}
      {selected && (
        <div className="explore-viewer">
          <button
            className="explore-back"
            onClick={() => setSelectedId(null)}
            aria-label="Close"
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