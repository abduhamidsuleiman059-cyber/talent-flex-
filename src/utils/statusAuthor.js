import { getAccounts, getAccountName, getCurrent } from './auth'
import { getAccountAvatar } from './accountAvatar'
import { displayName } from './displayName'

// Jina na picha ya mwandishi wa status (akaunti halisi za kifaa hiki, au akaunti za mfano)
export function authorInfo(handle) {
  const uname = String(handle).replace('@', '')
  const account = getAccounts().find(a => a.username === uname)

  if (account) {
    return { name: getAccountName(account), avatar: getAccountAvatar(account) }
  }

  return { name: displayName(handle), avatar: '' }
}

// Jina la mtumiaji la akaunti iliyoingia sasa, mfano "@abdu"
export function myHandle() {
  const current = getCurrent()
  return current ? `@${current.username}` : '@wewe'
}