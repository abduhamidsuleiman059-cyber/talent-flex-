const PROFILE_KEY = 'talentflex-profile'
const ME = '@wewe'

function readProfile() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILE_KEY))
    return raw && typeof raw === 'object' ? raw : null
  } catch {
    return null
  }
}

// Jina la wasifu wako (lile ulilolihariri kwenye Wasifu)
export function getMyName() {
  const profile = readProfile()
  if (profile && typeof profile.name === 'string' && profile.name.trim()) {
    return profile.name.trim()
  }
  return 'Wewe'
}

// Picha ya wasifu wako (tupu kama huna)
export function getMyAvatar() {
  const profile = readProfile()
  return profile && typeof profile.avatar === 'string' ? profile.avatar : ''
}

// "@juma_baller" -> "Juma Baller"
export function prettyName(username) {
  const words = String(username)
    .replace('@', '')
    .split(/[_.\s]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  return words.join(' ') || String(username)
}

// Jina kamili la kuonyesha kwa mtumiaji yeyote
export function displayName(username) {
  return username === ME ? getMyName() : prettyName(username)
}

// Picha ya wasifu ya mtumiaji (wewe tu ndiye mwenye picha kwa sasa)
export function getAvatarFor(username) {
  return username === ME ? getMyAvatar() : ''
}