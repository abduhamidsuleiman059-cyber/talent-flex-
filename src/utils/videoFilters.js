export const FILTERS = [
  { id: 'none', label: 'Asili', css: 'none' },
  { id: 'warm', label: 'Joto', css: 'sepia(0.28) saturate(1.3) brightness(1.05)' },
  { id: 'cool', label: 'Baridi', css: 'saturate(1.1) hue-rotate(12deg) brightness(1.03) contrast(1.05)' },
  { id: 'vivid', label: 'Kali', css: 'saturate(1.6) contrast(1.15)' },
  { id: 'mono', label: 'Nyeusi', css: 'grayscale(1) contrast(1.1)' },
  { id: 'retro', label: 'Zamani', css: 'sepia(0.55) contrast(1.05) saturate(1.1)' },
  { id: 'night', label: 'Usiku', css: 'brightness(0.88) contrast(1.2) saturate(0.9) hue-rotate(-8deg)' }
]

export function getFilterCss(id) {
  const found = FILTERS.find(f => f.id === id)
  return found ? found.css : 'none'
}