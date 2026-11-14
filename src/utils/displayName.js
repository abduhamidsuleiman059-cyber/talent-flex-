const PROFILE_KEY = 'talentflex-profile'
const ME = '@wewe'

// Jina la wasifu wako (lile ulilolihariri kwenye Wasifu)
export function getMyName() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILE_KEY))
    if (raw && typeof raw.name === 'string' && raw.name.trim()) {
      return raw.name.trim()
    }
  } catch {
    // tumia chaguo-msingi
  }
  return 'Wewe'
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