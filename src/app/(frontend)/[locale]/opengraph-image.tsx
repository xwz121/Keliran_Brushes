import { ImageResponse } from 'next/og'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Keliran — Industrial sealing and strip brushes'
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#171d32',
        display: 'flex',
        flexDirection: 'column',
        padding: 72,
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', fontSize: 32, color: '#d4ad50', letterSpacing: 6 }}>KELIRAN</div>
      <div style={{ fontSize: 68, display: 'flex', marginTop: 64, lineHeight: 1.08 }}>
        Industrial sealing.
        <br />
        Industrial strip brushes.
      </div>
      <div style={{ height: 2, background: '#d49b00', width: 80, marginTop: 44 }} />
      <div style={{ display: 'flex', fontSize: 26, color: '#c4c8d2', marginTop: 28 }}>
        Drawing-led sourcing & quality management
      </div>
    </div>,
    size,
  )
}
