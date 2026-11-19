import { useVideos } from '../context/VideoContext'
import '../styles/follow.css'

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// Follow (bluu) -> Following (kijivu). Kugusa tena = unfollow.
function FollowButton({ username, size = 'md', className = '' }) {
  const { followedUsers, toggleFollow } = useVideos()
  const following = followedUsers.includes(username)

  return (
    <button
      type="button"
      className={`tf-follow ${size} ${following ? 'on' : ''} ${className}`.trim()}
      onClick={(e) => {
        e.stopPropagation()
        toggleFollow(username)
      }}
      aria-pressed={following}
    >
      {following ? <CheckIcon /> : <PlusIcon />}
      <span>{following ? 'Following' : 'Follow'}</span>
    </button>
  )
}

export default FollowButton