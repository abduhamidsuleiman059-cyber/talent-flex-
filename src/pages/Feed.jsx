import { useState } from 'react'
import VideoCard from '../components/VideoCard'
import { useVideos } from '../context/VideoContext'
import '../styles/feed.css'

function Feed() {
  const [filter, setFilter] = useState('all')
  const { videos } = useVideos()
  const approved = videos.filter(v => v.status === 'approved')

  const filteredVideos = filter === 'all'
    ? approved
    : approved.filter(v => v.category === filter)

  return (
    <div className="feed-wrapper">
      <div className="feed-filters">
        <button className={filter === 'all' ? 'filter-chip active' : 'filter-chip'} onClick={() => setFilter('all')}>Zote</button>
        <button className={filter === 'ball' ? 'filter-chip active ball' : 'filter-chip ball'} onClick={() => setFilter('ball')}>⚽ Ball Skills</button>
        <button className={filter === 'music' ? 'filter-chip active music' : 'filter-chip music'} onClick={() => setFilter('music')}>🎵 Music & Beats</button>
      </div>
      <div className="feed-scroll">
        {filteredVideos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  )
}

export default Feed