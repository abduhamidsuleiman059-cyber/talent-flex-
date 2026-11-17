import { scopedKey, rawGet } from './accountScope'

// Picha ya wasifu ya akaunti yoyote iliyoingia kwenye kifaa hiki
export function getAccountAvatar(account) {
  try {
    const raw = JSON.parse(rawGet(scopedKey(account.ns, 'talentflex-profile')))
    return raw && typeof raw.avatar === 'string' ? raw.avatar : ''
  } catch {
    return ''
  }
}