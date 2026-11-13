// Rangi za avatar, kila jina linapata rangi yake ile ile kila mara
const AVATAR_COLORS = [
  'linear-gradient(135deg, #ff9a1f, #ff5e3a)',
  'linear-gradient(135deg, #22d3ee, #3b82f6)',
  'linear-gradient(135deg, #a855f7, #ec4899)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #6366f1, #8b5cf6)'
]

export function avatarGradient(username) {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function avatarLetter(username) {
  return username.replace('@', '').charAt(0).toUpperCase() || '?'
}