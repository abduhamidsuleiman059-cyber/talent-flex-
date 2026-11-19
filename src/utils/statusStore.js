import { useSyncExternalStore } from 'react'
import { rawGet, rawSet } from './accountScope'

// Hifadhi ya kifaa kizima (si ya akaunti moja): akaunti zote kwenye simu hii zinaonana
const ITEMS_KEY = 'tfstatus-items'
const SEEDED_KEY = 'tfstatus-seeded'
const DB_NAME = 'tf-status-db'
const STORE = 'blobs'

export const STATUS_TTL_MS = 24 * 60 * 60 * 1000

export const TEXT_BACKGROUNDS = [
  'linear-gradient(135deg, #0ea5e9, #6366f1)',
  'linear-gradient(135deg, #f97316, #ec4899)',
  'linear-gradient(135deg, #10b981, #0ea5e9)',
  'linear-gradient(135deg, #8b5cf6, #ec4899)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #111827, #374151)',
  'linear-gradient(135deg, #14b8a6, #22c55e)',
  'linear-gradient(135deg, #1e3a8a, #06b6d4)'
]

const listeners = new Set()
const urlCache = new Map()

// ===== IndexedDB (video na muziki wa status) =====

function openDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('NO_IDB'))
      return
    }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbPut(key, blob) {
  return openDb().then(
    db =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).put(blob, key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
  )
}

function idbGet(key) {
  return openDb().then(
    db =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly')
        const req = tx.objectStore(STORE).get(key)
        req.onsuccess = () => resolve(req.result || null)
        req.onerror = () => reject(req.error)
      })
  )
}

function idbDelete(key) {
  return openDb().then(
    db =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).delete(key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
  )
}

function revokeUrl(key) {
  const url = urlCache.get(key)
  if (url) {
    URL.revokeObjectURL(url)
    urlCache.delete(key)
  }
}

function musicKey(id) {
  return `${id}-music`
}

// Futa faili za video na muziki za status
function cleanupBlobs(item) {
  if (item.type !== 'video') return
  idbDelete(item.id).catch(() => {})
  revokeUrl(item.id)
  if (item.edit && item.edit.hasMusic) {
    idbDelete(musicKey(item.id)).catch(() => {})
    revokeUrl(musicKey(item.id))
  }
}

// ===== Data za mfano (mara ya kwanza tu) =====

function makeSeed() {
  const now = Date.now()
  const HOUR = 3600000

  const make = (author, text, bg, hoursAgo) => ({
    id: `seed-${author.slice(1)}-${hoursAgo}`,
    author,
    type: 'text',
    text,
    bg,
    caption: '',
    createdAt: now - hoursAgo * HOUR,
    expiresAt: now - hoursAgo * HOUR + STATUS_TTL_MS,
    views: [],
    likes: [],
    comments: []
  })

  return [
    make('@juma_baller', 'Mazoezi ya asubuhi yamekwisha! Kesho tunarudia 💪⚽', 0, 2),
    make('@lina_beats', 'Beat mpya inakuja wiki hii... mkae tayari 🎶', 3, 5),
    make('@dj_neema', 'Usiku wa leo tunapiga mziki mzuri 🎧🔥', 7, 9)
  ]
}

function normalize(item) {
  return {
    ...item,
    views: Array.isArray(item.views) ? item.views : [],
    likes: Array.isArray(item.likes) ? item.likes : [],
    comments: Array.isArray(item.comments) ? item.comments : []
  }
}

function initItems() {
  let list = []

  try {
    const raw = rawGet(ITEMS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (Array.isArray(parsed)) list = parsed.filter(Boolean).map(normalize)
  } catch {
    list = []
  }

  if (!rawGet(SEEDED_KEY)) {
    if (list.length === 0) list = makeSeed()
    rawSet(SEEDED_KEY, '1')
  }

  const now = Date.now()
  const alive = list.filter(i => i.expiresAt > now)
  list.filter(i => i.expiresAt <= now).forEach(cleanupBlobs)

  rawSet(ITEMS_KEY, JSON.stringify(alive))
  return alive
}

let items = initItems()
let snapshot = items

function persist() {
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items))
    return true
  } catch {
    return false
  }
}

function commit(next) {
  items = next
  snapshot = next
  listeners.forEach(l => l())
}

function patch(id, fn) {
  commit(items.map(i => (i.id === id ? fn(i) : i)))
  persist()
}

function prune() {
  const now = Date.now()
  const alive = items.filter(i => i.expiresAt > now)
  if (alive.length === items.length) return

  items.filter(i => i.expiresAt <= now).forEach(cleanupBlobs)

  commit(alive)
  persist()
}

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return snapshot
}

export function useStatuses() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

// Zinazoonekana sasa, zimepangwa kwa mwandishi (kongwe kwanza ndani ya kila kundi)
export function groupStatuses(list) {
  const now = Date.now()
  const map = new Map()

  list
    .filter(i => i.expiresAt > now)
    .sort((a, b) => a.createdAt - b.createdAt)
    .forEach(i => {
      if (!map.has(i.author)) map.set(i.author, [])
      map.get(i.author).push(i)
    })

  return map
}

// Inarudisha true ikifanikiwa kuhifadhi
export async function addStatus(item, blob, musicBlob = null) {
  prune()

  if (blob) {
    try {
      await idbPut(item.id, blob)
      if (musicBlob) await idbPut(musicKey(item.id), musicBlob)
    } catch {
      idbDelete(item.id).catch(() => {})
      idbDelete(musicKey(item.id)).catch(() => {})
      return false
    }
  }

  const previous = items
  commit([...items, normalize(item)])

  if (!persist()) {
    commit(previous)
    if (blob) {
      idbDelete(item.id).catch(() => {})
      idbDelete(musicKey(item.id)).catch(() => {})
    }
    return false
  }

  return true
}

export function deleteStatus(id) {
  const target = items.find(i => i.id === id)
  commit(items.filter(i => i.id !== id))
  persist()

  if (target) cleanupBlobs(target)
}

export function markViewed(id, handle) {
  const item = items.find(i => i.id === id)
  if (!item || item.author === handle) return
  if (item.views.some(v => v.u === handle)) return

  patch(id, i => ({ ...i, views: [...i.views, { u: handle, t: Date.now() }] }))
}

export function toggleStatusLike(id, handle) {
  patch(id, i => ({
    ...i,
    likes: i.likes.includes(handle)
      ? i.likes.filter(x => x !== handle)
      : [...i.likes, handle]
  }))
}

export function addStatusComment(id, handle, text) {
  const comment = {
    id: `${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    u: handle,
    text,
    t: Date.now()
  }
  patch(id, i => ({ ...i, comments: [...i.comments, comment] }))
}

async function blobUrlFor(key) {
  if (urlCache.has(key)) return urlCache.get(key)

  try {
    const blob = await idbGet(key)
    if (!blob) return ''
    const url = URL.createObjectURL(blob)
    urlCache.set(key, url)
    return url
  } catch {
    return ''
  }
}

// Link ya video ya status (kutoka IndexedDB)
export function getStatusVideoUrl(id) {
  return blobUrlFor(id)
}

// Link ya muziki wa status (kutoka IndexedDB)
export function getStatusMusicUrl(id) {
  return blobUrlFor(musicKey(id))
}