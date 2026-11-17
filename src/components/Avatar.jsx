import { avatarGradient, avatarLetter } from '../utils/avatar'
import { displayName, getAvatarFor } from '../utils/displayName'
import '../styles/avatar-img.css'

// username: "@juma_baller"
// src: picha (kama haijatolewa, inatafutwa yenyewe kwa username)
// label: jina la kutolea herufi (kama haijatolewa, jina kamili la username)
function Avatar({ username, src, label, size = 40, className = '' }) {
  const image = src !== undefined ? src : getAvatarFor(username)
  const name = label || displayName(username)

  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.42)
  }
  if (!image) style.background = avatarGradient(username)

  return (
    <span className={`tf-avatar ${className}`.trim()} style={style}>
      {image ? <img src={image} alt="" draggable={false} /> : avatarLetter(name)}
    </span>
  )
}

export default Avatar