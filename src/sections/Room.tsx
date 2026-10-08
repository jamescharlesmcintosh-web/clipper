import { useEffect, useState } from 'react'
import { shop } from '../data/shop'
import { Fade, Reveal, Rule } from '../components/Reveal'
import { useHotspot } from '../components/Scene'
import { scrollToTarget } from '../lib/scroll'

declare global {
  interface Window { __gl?: { xr: { enabled: boolean; setSession: (s: unknown) => void } } }
}

function useXRSupport() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    const xr = (navigator as unknown as { xr?: { isSessionSupported: (m: string) => Promise<boolean> } }).xr
    if (!xr?.isSessionSupported) return
    xr.isSessionSupported('immersive-vr').then(setOk).catch(() => setOk(false))
  }, [])
  return ok
}

async function enterXR() {
  const gl = window.__gl
  const xr = (navigator as unknown as { xr?: { requestSession: (m: string, o?: object) => Promise<unknown> } }).xr
  if (!gl || !xr) return
  try {
    const session = await xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] })
    gl.xr.setSession(session)
  } catch { /* headset not ready */ }
}

export function Threshold() {
  return (
    <section className="threshold" id="threshold" data-scene="threshold" data-label="Knock" data-rail-n="02" data-accent={shop.accent}>
      <div className="threshold__inner">
        <p className="t-label threshold__cue">Scroll — knock twice</p>
        <div className="threshold__rule" />
        <p className="threshold__whisper serif-i">{shop.room.label}</p>
      </div>
    </section>
  )
}

export default function Room() {
  const hotspot = useHotspot()
  const xrReady = useXRSupport()

  return (
    <section className="section room" id="room" data-scene="room" data-label={shop.room.label} data-rail-n="03" data-accent={shop.accent}>
      <div className="container room__head">
        <div className="sec-head">
          <p className="t-label t-label--accent">03 / {shop.room.label}</p>
          <p className="t-label">{shop.room.hint}</p>
        </div>
        <Rule />
      </div>

      <div className="container room__grid">
        <div className="room__copy">
          <Reveal as="h2" className="room__title" lines={[shop.room.title]} />
          <Fade delay={220}>
            <p className="t-body room__blurb">{shop.room.blurb}</p>
          </Fade>
          <Fade delay={360}>
            <div className="room__actions">
              <a className="visit__book" href={shop.bookingHref}>
                {shop.bookingLabel}
                <span className="arrow" aria-hidden="true">→</span>
              </a>
              {xrReady && <button className="room__xr" type="button" onClick={() => enterXR()}>Enter XR</button>}
            </div>
          </Fade>
        </div>

        <div className="room__stage">
          <div className={`room__card ${hotspot ? 'is-on' : ''}`}>
            <p className="t-label">On the wall</p>
            <p className="room__card-name">{hotspot ?? '—'}</p>
            <p className="room__card-kind">{shop.room.posters.find((p) => p.name === hotspot)?.kind ?? 'Hover a frame'}</p>
          </div>
          <ul className="room__legend">
            {shop.room.posters.map((p) => (
              <li key={p.name} className={hotspot === p.name ? 'is-on' : ''}>
                <span className="room__dot" style={{ background: p.accent }} />
                <span>{p.name}</span>
                <span className="room__kind">{p.kind}</span>
              </li>
            ))}
          </ul>
          <div className="room__tags">
            <span>{shop.room.chair}</span>
            <span>{shop.room.shelf}</span>
          </div>
        </div>
      </div>

      {/* Creative Space Studio entrance */}
      <div className="container" style={{ marginTop: 'clamp(48px, 8vh, 96px)' }}>
        <div className="studio-entrance">
          <div className="studio-entrance__head">
            <p className="t-label t-label--accent">Creative Space Studio</p>
            <Reveal as="h2" className="visit__title" lines={['Your space. Your shoot.']} />
          </div>
          <div className="studio-entrance__grid">
            {shop.studio.map((s, i) => (
              <Fade key={s.name} delay={200 + i * 120} as="div" className="studio-card">
                <div className="studio-card__name">{s.name}</div>
                <p className="t-body">{s.desc}</p>
              </Fade>
            ))}
          </div>
          <Fade delay={700}>
            <div className="studio-entrance__cta">
              <a className="visit__book" href={shop.bookingHref}>
                Book the studio
                <span className="arrow" aria-hidden="true">→</span>
              </a>
            </div>
          </Fade>
        </div>
      </div>

      <div className="container room__foot">
        <Fade delay={200}>
          <a className="room__back" href="#top" onClick={(e) => { e.preventDefault(); scrollToTarget(0) }}>
            Back to the street
          </a>
        </Fade>
      </div>
    </section>
  )
}
