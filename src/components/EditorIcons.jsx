function Svg({ size, children, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  )
}

export function BackIcon({ size = 24 }) {
  return (
    <Svg size={size} strokeWidth="2.4">
      <polyline points="15 18 9 12 15 6" />
    </Svg>
  )
}

export function CloseIcon({ size = 20 }) {
  return (
    <Svg size={size} strokeWidth="2.4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  )
}

export function CheckIcon({ size = 20 }) {
  return (
    <Svg size={size} strokeWidth="2.8">
      <polyline points="20 6 9 17 4 12" />
    </Svg>
  )
}

export function MusicIcon({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </Svg>
  )
}

export function GearIcon({ size = 22 }) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  )
}

export function ScissorsIcon({ size = 28 }) {
  return (
    <Svg size={size}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </Svg>
  )
}

export function TextIcon({ size = 28 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <text
        x="12"
        y="17.5"
        textAnchor="middle"
        fontSize="16"
        fontWeight="800"
        fontFamily="Roboto, Arial, sans-serif"
        fill="currentColor"
      >
        Aa
      </text>
    </svg>
  )
}

export function StickerIcon({ size = 28 }) {
  return (
    <Svg size={size}>
      <path d="M21 11.5V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h5.5" />
      <path d="M21 11.5L11.5 21c5 0 9.5-4.5 9.5-9.5z" />
      <circle cx="9" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
      <path d="M8.5 13.5c1 1.4 3.5 1.4 4.5 0" />
    </Svg>
  )
}

export function FilterIcon({ size = 28 }) {
  return (
    <Svg size={size}>
      <circle cx="9" cy="9" r="5.5" />
      <circle cx="15" cy="9" r="5.5" />
      <circle cx="12" cy="15" r="5.5" />
    </Svg>
  )
}

export function MinusIcon({ size = 18 }) {
  return (
    <Svg size={size} strokeWidth="2.6">
      <line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  )
}

export function PlusIcon({ size = 18 }) {
  return (
    <Svg size={size} strokeWidth="2.6">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  )
}

export function EditIcon({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </Svg>
  )
}

export function TrashIcon({ size = 18 }) {
  return (
    <Svg size={size}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </Svg>
  )
}

export function BoxTextIcon({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <rect
        x="2.5"
        y="4.5"
        width="19"
        height="15"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <text
        x="12"
        y="16.2"
        textAnchor="middle"
        fontSize="11"
        fontWeight="800"
        fontFamily="Roboto, Arial, sans-serif"
        fill="currentColor"
      >
        A
      </text>
    </svg>
  )
}

export function PlayIcon({ size = 30 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <polygon points="7 4 20 12 7 20 7 4" />
    </svg>
  )
}