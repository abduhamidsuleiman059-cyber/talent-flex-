import {
  scopedKey,
  rawGet,
  rawSet,
  rawRemove,
  listRawKeys,
  deleteDbFor
} from './accountScope'

// MSIMAMIZI: jina la mtumiaji la akaunti yako. Admin inaonekana kwa akaunti hii tu.
// Badilisha liwe jina utakalojisajili nalo.
export const OWNER_USERNAME = 'abdu'

const ACCOUNTS_KEY = 'tfauth-accounts'
const SESSIONS_KEY = 'tfauth-sessions'
const CURRENT_KEY = 'tfauth-current'
const PROFILE_KEY = 'talentflex-profile'

function readJson(key, fallback) {
  try {
    const raw = rawGet(key)
    if (raw == null) return fallback
    const parsed = JSON.parse(raw)
    return parsed == null ? fallback : parsed
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  rawSet(key, JSON.stringify(value))
}

function newId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID().replace(/-/g, '')
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

async function sha256Hex(text) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Kivinjari chako hakiruhusu kuhifadhi nenosiri kwa usalama. Tumia Chrome ya toleo jipya.')
  }
  const data = new TextEncoder().encode(text)
  const buf = await window.crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function hashPassword(password, salt) {
  return sha256Hex(`${salt}:${password}`)
}

export function normalizeUsername(u) {
  return String(u || '').trim().toLowerCase().replace(/^@/, '')
}

export function validateUsername(u) {
  if (!/^[a-z0-9_.]{3,20}$/.test(u)) {
    return 'Jina la mtumiaji liwe herufi 3 hadi 20 (a-z, 0-9, _ au .), bila nafasi.'
  }
  return ''
}

export function validatePassword(p) {
  if (!p || p.length < 6) return 'Nenosiri liwe na angalau herufi 6.'
  return ''
}

export function getAccounts() {
  const list = readJson(ACCOUNTS_KEY, [])
  return Array.isArray(list) ? list : []
}

function getSessionIds() {
  const list = readJson(SESSIONS_KEY, [])
  return Array.isArray(list) ? list : []
}

// Akaunti zilizoingia kwenye kifaa hiki
export function getSessions() {
  const accounts = getAccounts()
  return getSessionIds()
    .map(id => accounts.find(a => a.id === id))
    .filter(Boolean)
}

export function getCurrent() {
  const id = readJson(CURRENT_KEY, null)
  if (!id) return null
  return getAccounts().find(a => a.id === id) || null
}

export function isOwner(account) {
  return Boolean(account) && account.username === OWNER_USERNAME
}

// Jina la kuonyesha la akaunti (kutoka kwenye wasifu wake)
export function getAccountName(account) {
  if (!account) return ''
  const profile = readJson(scopedKey(account.ns, PROFILE_KEY), null)
  return (profile && profile.name) || account.username
}

async function verifyPassword(account, password) {
  const hash = await hashPassword(password, account.salt)
  return hash === account.hash
}

export async function signUp({ username, name, password }) {
  const uname = normalizeUsername(username)
  const err = validateUsername(uname) || validatePassword(password)
  if (err) throw new Error(err)

  const accounts = getAccounts()
  if (accounts.some(a => a.username === uname)) {
    throw new Error('Jina hili la mtumiaji limeshatumika kwenye kifaa hiki.')
  }

  const cleanName = String(name || '').trim().slice(0, 20) || uname
  const id = newId()
  const salt = newId()
  const hash = await hashPassword(password, salt)

  // Akaunti ya kwanza inarithi data zilizopo (ns tupu)
  const ns = accounts.length === 0 ? '' : id.slice(0, 10)
  const account = { id, username: uname, ns, salt, hash, createdAt: Date.now() }

  const profileKey = scopedKey(ns, PROFILE_KEY)
  const existing = readJson(profileKey, null)
  const keepName = existing && existing.name && existing.name !== 'Wewe'
  const profile = {
    name: keepName ? existing.name : cleanName,
    bio: (existing && existing.bio) || '',
    avatar: (existing && existing.avatar) || '',
    cover: (existing && existing.cover) || ''
  }
  rawSet(profileKey, JSON.stringify(profile))

  writeJson(ACCOUNTS_KEY, [...accounts, account])
  writeJson(SESSIONS_KEY, Array.from(new Set([...getSessionIds(), id])))
  writeJson(CURRENT_KEY, id)
  return account
}

export async function signIn(username, password) {
  const uname = normalizeUsername(username)
  const account = getAccounts().find(a => a.username === uname)
  if (!account) {
    throw new Error('Jina la mtumiaji halipo kwenye kifaa hiki. Jisajili kwanza.')
  }
  const ok = await verifyPassword(account, password)
  if (!ok) throw new Error('Nenosiri si sahihi.')

  writeJson(SESSIONS_KEY, Array.from(new Set([...getSessionIds(), account.id])))
  writeJson(CURRENT_KEY, account.id)
  return account
}

export function switchTo(id) {
  if (!getSessionIds().includes(id)) return false
  writeJson(CURRENT_KEY, id)
  return true
}

export function signOut(id) {
  const sessions = getSessionIds().filter(x => x !== id)
  writeJson(SESSIONS_KEY, sessions)
  const currentId = readJson(CURRENT_KEY, null)
  if (currentId === id) {
    if (sessions.length) writeJson(CURRENT_KEY, sessions[0])
    else rawRemove(CURRENT_KEY)
  }
}

export async function changePassword(id, oldPassword, newPassword) {
  const err = validatePassword(newPassword)
  if (err) throw new Error(err)

  const accounts = getAccounts()
  const account = accounts.find(a => a.id === id)
  if (!account) throw new Error('Akaunti haipatikani.')

  const ok = await verifyPassword(account, oldPassword)
  if (!ok) throw new Error('Nenosiri la sasa si sahihi.')

  const salt = newId()
  const hash = await hashPassword(newPassword, salt)
  writeJson(
    ACCOUNTS_KEY,
    accounts.map(a => (a.id === id ? { ...a, salt, hash } : a))
  )
}

// Futa data (video, maoni, likes, ujumbe, wasifu) za akaunti moja
export async function clearAccountData(ns) {
  const prefix = ns ? `tfns-${ns}:` : 'talentflex-'
  listRawKeys()
    .filter(k => k.startsWith(prefix))
    .forEach(k => rawRemove(k))
  await deleteDbFor(ns)
}

export async function deleteAccount(id, password) {
  const accounts = getAccounts()
  const account = accounts.find(a => a.id === id)
  if (!account) throw new Error('Akaunti haipatikani.')

  const ok = await verifyPassword(account, password)
  if (!ok) throw new Error('Nenosiri si sahihi.')

  await clearAccountData(account.ns)
  writeJson(
    ACCOUNTS_KEY,
    accounts.filter(a => a.id !== id)
  )
  signOut(id)
}