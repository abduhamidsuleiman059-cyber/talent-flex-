import { createContext, useContext, useState } from 'react'
import { mockVideos } from '../data/mockVideos'

const VideoContext = createContext()

export function useVideos() {
  return useContext(VideoContext)
}

export function VideoProvider({ children }) {
  const approvedMock = mockVideos.map(v => ({ ...v, status: 'approved' }))
  const [videos, setVideos] = useState(approvedMock)

  const addPendingVideo = (video) => {
    setVideos(prev => [
      { ...video, id: Date.now(), status: 'pending' },
      ...prev
    ])
  }

  const approveVideo = (id) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, status: 'approved' } : v))
  }

  const rejectVideo = (id) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, status: 'rejected' } : v))
  }

  return (
    <VideoContext.Provider value={{ videos, addPendingVideo, approveVideo, rejectVideo }}>
      {children}
    </VideoContext.Provider>
  )
}