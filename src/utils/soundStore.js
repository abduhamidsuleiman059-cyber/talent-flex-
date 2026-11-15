const PREF_KEY = 'talentflex-pref-sound'

function readPref() {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off'
  } catch {
    return true
  }
}

let soundOn = readPref()
const listeners = new Set()

export function subscribeSound(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getSound() {
  return soundOn
}

// Badilisha sauti ya sasa tu (mfano kivinjari kikikataa sauti)
export function setSound(value) {
  soundOn = value
  listeners.forEach(l => l())
}

// Chaguo la kudumu la Mipangilio
export function getSoundDefault() {
  return readPref()
}

export function setSoundDefault(value) {
  try {
    localStorage.setItem(PREF_KEY, value ? 'on' : 'off')
  } catch {
    // hakuna cha kufanya
  }
  setSound(value)
}