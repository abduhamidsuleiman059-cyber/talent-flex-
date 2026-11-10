import { createContext, useContext, useState, useEffect } from 'react'
import { mockVideos } from '../data/mockVideos'
import { saveVideoBlob, getVideoBlob, deleteVideoBlob } from '../services/videoStorage'

const VideoContext = createContext()

const META_KEY = 'talentflex-user-videos'
const LIKES_KEY = 'talentflex-liked'

const approvedMock = mockVideos.map(v => ({ ...v, status: 'approved' }))

function readMeta() {
  try {
    return JSON.parse(localStorage.getItem(META_KEY)) || []
  } catch {
    return []
  }
}

function readLiked() {
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY)) || []
  } catch {
    return []
  }
}

export function useVideos() {
  return useContext(VideoContext)
}

export function VideoProvider({ children }) {
  const [videos, setVideos] = useState(approvedMock)
  const [loaded, setLoaded] = useState(false)
  const [likedIds, setLikedIds] = useState(readLiked)

  // Rudisha video zilizohifadhiwa (kutoka localStorage + IndexedDB)
  useEffect(() => {
    let cancelled = false

    async function load() {
      const meta = readMeta()
      const restored = []
      for (const m of meta) {
        try {
          const blob = await getVideoBlob(m.id)
          if (blob) {
            restored.push({ ...m, videoUrl: URL.createObjectURL(blob) })
          }
        } catch (err) {
          console.error('Imeshindwa kurudisha video', m.id, err)
        }
      }
      if (!cancelled) {
        setVideos(prev => [
          ...restored,
          ...prev.filter(v => !restored.some(r => r.id === v.id))
        ])
        setLoaded(true)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Hifadhi taarifa za video za watumiaji kila zinapobadilika
  useEffect(() => {
    if (!loaded) return
    const meta = videos
      .filter(v => v.isUser)
      .map(v => ({
        id: v.id,
        username: v.username,
        caption: v.caption,
        category: v.category,
        likes: v.likes,
        comments: v.comments,
        status: v.status,
        isUser: true
      }))
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta))
    } catch (err) {
      console.error('Imeshindwa kuhifadhi taarifa', err)
    }
  }, [videos, loaded])

  // Hifadhi video zilizopendwa (likes)
  useEffect(() => {
    try {
      localStorage.setItem(LIKES_KEY, JSON.stringify(likedIds))
    } catch (err) {
      console.error('Imeshindwa kuhifadhi likes', err)
    }
  }, [likedIds])

  const addPendingVideo = async (video) => {
    const id = Date.now()
    try {
      const res = await fetch(video.videoUrl)
      const blob = await res.blob()
      await saveVideoBlob(id, blob)
    } catch (err) {
      console.error('Imeshindwa kuhifadhi video', err)
    }
    setVideos(prev => [
      { ...video, id, status: 'pending', isUser: true },
      ...prev
    ])
  }

  const approveVideo = (id) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, status: 'approved' } : v))
  }

  const rejectVideo = (id) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, status: 'rejected' } : v))
    deleteVideoBlob(id).catch(() => {})
  }

  const toggleLike = (id) => {
    setLikedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <VideoContext.Provider
      value={{ videos, addPendingVideo, approveVideo, rejectVideo, likedIds, toggleLike }}
    >
      {children}
    </VideoContext.Provider>
  )
}