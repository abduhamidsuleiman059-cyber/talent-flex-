// Ikoni kwenye video za mfano (zisizo na faili halisi)
function TileGlyph({ category }) {
  if (category === 'ball') {
    return (
      <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polygon points="12 8 15.5 10.5 14.2 14.5 9.8 14.5 8.5 10.5" />
        <line x1="12" y1="8" x2="12" y2="3.2" />
        <line x1="15.5" y1="10.5" x2="20" y2="9" />
        <line x1="14.2" y1="14.5" x2="17" y2="18.5" />
        <line x1="9.8" y1="14.5" x2="7" y2="18.5" />
        <line x1="8.5" y1="10.5" x2="4" y2="9" />
      </svg>
    )
  }

  if (category === 'music') {
    return (
      <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" width="44" height="44" fill="currentColor">
      <polygon points="7 4 20 12 7 20 7 4" />
    </svg>
  )
}

export default TileGlyph