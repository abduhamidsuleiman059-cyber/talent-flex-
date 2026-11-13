import { createContext, useContext, useState, useEffect } from 'react'

const ChatContext = createContext()

const CHAT_KEY = 'talentflex-chats'

function minutesAgo(m) {
  return Date.now() - m * 60000
}

// Mazungumzo ya mfano, yanatengenezwa mara ya kwanza tu
function seedState() {
  return {
    chats: {
      '@juma_baller': [
        { id: 1, from: 'them', text: 'Karibu TalentFlex! Umeona video yangu mpya ya freestyle?', createdAt: minutesAgo(95) }
      ],
      '@lina_beats': [
        { id: 2, from: 'them', text: 'Habari! Nimependa kipaji chako.', createdAt: minutesAgo(190) },
        { id: 3, from: 'them', text: 'Tufanye collab ya beat siku moja?', createdAt: minutesAgo(188) }
      ],
      '@dj_neema': [
        { id: 4, from: 'them', text: 'Beat ya usiku wa leo imekaa poa, asante kwa kusapoti!', createdAt: minutesAgo(1600) },
        { id: 5, from: 'me', text: 'Karibu sana, inaupiga mwingi!', createdAt: minutesAgo(1590) }
      ]
    },
    unread: {
      '@juma_baller': 1,
      '@lina_beats': 2
    }
  }
}

function readState() {
  try {
    const raw = localStorage.getItem(CHAT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.chats && parsed.unread) return parsed
    }
  } catch {
    // tumia mazungumzo ya mfano
  }
  return seedState()
}

export function useChat() {
  return useContext(ChatContext)
}

export function ChatProvider({ children }) {
  const [state, setState] = useState(readState)

  // Hifadhi mazungumzo kila yanapobadilika
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(state))
    } catch (err) {
      console.error('Imeshindwa kuhifadhi ujumbe', err)
    }
  }, [state])

  const sendMessage = (username, text) => {
    const clean = text.trim()
    if (!clean) return
    const message = {
      id: Date.now(),
      from: 'me',
      text: clean,
      createdAt: Date.now()
    }
    setState(prev => ({
      ...prev,
      chats: {
        ...prev.chats,
        [username]: [...(prev.chats[username] || []), message]
      }
    }))
  }

  const markRead = (username) => {
    setState(prev => {
      if (!prev.unread[username]) return prev
      return {
        ...prev,
        unread: { ...prev.unread, [username]: 0 }
      }
    })
  }

  const totalUnread = Object.values(state.unread).reduce((sum, n) => sum + n, 0)

  return (
    <ChatContext.Provider
      value={{
        chats: state.chats,
        unread: state.unread,
        totalUnread,
        sendMessage,
        markRead
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}