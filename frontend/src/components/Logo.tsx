export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer diamond — subtle depth layer */}
      <polygon
        points="18,1 35,18 18,35 1,18"
        fill="none"
        stroke="#93c5fd"
        strokeWidth="1"
        opacity="0.35"
      />
      {/* Mid diamond — structure layer */}
      <polygon
        points="18,7 29,18 18,29 7,18"
        fill="#1d4ed8"
        opacity="0.55"
      />
      {/* Inner diamond — core */}
      <polygon
        points="18,12 24,18 18,24 12,18"
        fill="#3b82f6"
      />
      {/* Center — precision point */}
      <circle cx="18" cy="18" r="2.2" fill="white" opacity="0.95" />
    </svg>
  )
}

export function LogoFull() {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={36} />
      <div>
        <p className="text-white font-bold text-sm tracking-wide leading-none">PROFUNDITY</p>
        <p className="text-blue-300 text-xs mt-0.5 tracking-widest font-medium">SCM PLATFORM</p>
      </div>
    </div>
  )
}
