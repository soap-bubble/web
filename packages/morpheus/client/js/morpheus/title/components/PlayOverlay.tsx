import type { ReactNode, MouseEventHandler } from 'react'

interface PlayOverlayProps {
  onClick?: MouseEventHandler<HTMLDivElement>
  children?: ReactNode
}

function PlayOverlay({ onClick, children = null }: PlayOverlayProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <div className="play-background" />
      <div className="play-overlay" onClick={onClick}>
        {children}
      </div>
    </div>
  )
}

export default PlayOverlay
