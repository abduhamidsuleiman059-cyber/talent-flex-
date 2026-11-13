import { createContext, useContext, useState, useEffect } from 'react'
import { mockVideos } from '../data/mockVideos'
import { saveVideoBlob, getVideoBlob, deleteVideoBlob } from '../services/videoStorage'

const VideoContext = createContext()

const META_KEY = 'talentflex-user-videos'
const LIKES_KEY = 'talentflex-liked'
const COMMENTS_KEY = 'talentflex-comments'
const COMMENT_LIKES_KEY = 'talentflex-liked-comments'
const FOLLOW_KEY = 'talentflex-following'

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

function readComments() {
  try {
    return JSON.parse(localStorage.getItem(COMMENTS_KEY)) || {}
  } catch {
    return {}
  }
}

function readLikedComments() {
  try {
    return JSON.parse(localStorage.getItem(COMMENT_LIKES_KEY)) || []
  } catch {
    return []
  }
}

function readFollowing() {
  try {
    return JSON.parse(localStorage.getItem(FOLLOW_KEY)) || []
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
  const [comments, setComments] = useState(readComments)
  const [likedCommentIds, setLikedCommentIds] = useState(readLikedComments)
  const [followedUsers, setFollowedUsers] = useState(readFollowing)

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

  // Hifadhi maoni (comments)
  useEffect(() => {
    try {
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments))
    } catch (err) {
      console.error('Imeshindwa kuhifadhi maoni', err)
    }
  }, [comments])

  // Hifadhi maoni yaliyopendwa
  useEffect(() => {
    try {
      localStorage.setItem(COMMENT_LIKES_KEY, JSON.stringify(likedCommentIds))
    } catch (err) {
      console.error('Imeshindwa kuhifadhi likes za maoni', err)
    }
  }, [likedCommentIds])

  // Hifadhi watumiaji unaowafuata
  useEffect(() => {
    try {
      localStorage.setItem(FOLLOW_KEY, JSON.stringify(followedUsers))
    } catch (err) {
      console.error('Imeshindwa kuhifadhi unaowafuata', err)
    }
  }, [followedUsers])

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

  // Futa video kabisa (pamoja na maoni na like zake)
  const deleteVideo = (id) => {
    setVideos(prev => prev.filter(v => v.id !== id))
    deleteVideoBlob(id).catch(() => {})
    setComments(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setLikedIds(prev => prev.filter(x => x !== id))
  }

  const toggleLike = (id) => {
    setLikedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // parentId = id ya maoni mama (kama ni jibu), replyTo = jina la unayemjibu (kama ni jibu la jibu)
  const addComment = (videoId, text, parentId = null, replyTo = null) => {
    const newComment = {
      id: Date.now(),
      username: '@wewe',
      text,
      createdAt: Date.now(),
      parentId,
      replyTo,
      likes: 0
    }
    setComments(prev => ({
      ...prev,
      [videoId]: [newComment, ...(prev[videoId] || [])]
    }))
  }

  // Ukifuta maoni mama, majibu yake yanafutwa pia
  const deleteComment = (videoId, commentId) => {
    setComments(prev => ({
      ...prev,
      [videoId]: (prev[videoId] || []).filter(
        c => c.id !== commentId && c.parentId !== commentId
      )
    }))
    setLikedCommentIds(prev => prev.filter(x => x !== commentId))
  }

  const toggleCommentLike = (commentId) => {
    setLikedCommentIds(prev =>
      prev.includes(commentId)
        ? prev.filter(x => x !== commentId)
        : [...prev, commentId]
    )
  }

  // Fuata / acha kufuata mtumiaji (kwa jina lake, mfano "@juma_baller")
  const toggleFollow = (username) => {
    setFollowedUsers(prev =>
      prev.includes(username)
        ? prev.filter(x => x !== username)
        : [...prev, username]
    )
  }

  return (
    <VideoContext.Provider
      value={{
        videos,
        addPendingVideo,
        approveVideo,
        rejectVideo,
        deleteVideo,
        likedIds,
        toggleLike,
        comments,
        addComment,
        deleteComment,
        likedCommentIds,
        toggleCommentLike,
        followedUsers,
        toggleFollow
      }}
    >
      {children}
    </VideoContext.Provider>
  )
}