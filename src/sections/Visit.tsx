import { useEffect, useState } from 'react'
import { shop } from '../data/shop'
import { Fade, Reveal, Rule } from '../components/Reveal'

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()))
    return () => window.clearInterval(id)
  }, [])
  return now
}

export default function Visit() {
  const now = useClock()
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const minPrice = shop.services.reduce((m, s) => { const p = parseInt(s.price.replace('$', '')); return p < m ? p : m; }, Infinity)

  return (
    <section
      className="section visit"
      id="visit"
      data-scene="visit"
      data-label="Visit"
      data-rail-n="01"
      data-accent={shop.accent}
    >
      <div className="container">
        <div className="sec-head">
          <p className="t-label t-label--accent">01 / Visit</p>
          <p className="t-label">{shop.street}</p>
        </div>
        <Rule />

        <div className="visit__grid" style={{ paddingTop: 'clamp(36px, 6vh, 76px)' }}>
          <div>
            <Reveal as="h2" className="visit__title" lines={['Find the chair.', 'Take a seat.']} />
            <Fade delay={300}>
              <a className="visit__email" href={`mailto:${shop.email}`}>
                {shop.email}
                <span className="arrow" aria-hidden="true">↗</span>
              </a>
            </Fade>
            <Fade delay={380}>
              <a className="visit__phone" href={shop.phoneHref}>
                {shop.phone}
              </a>
            </Fade>
            <Fade delay={460}>
              <a className="visit__book" href={shop.bookingHref}>
                {shop.bookingLabel}
                <span className="arrow" aria-hidden="true">→</span>
              </a>
            </Fade>
          </div>

          <div className="visit__side">
            <Fade delay={160}>
              <div className="visit__block">
                <p className="t-label">Address</p>
                <p>{shop.street}<br />{shop.city}</p>
              </div>
            </Fade>
            <Fade delay={260}>
              <div className="visit__block">
                <p className="t-label">Hours</p>
                <ul className="visit__hours">
                  {shop.hours.map((h) => (
                    <li key={h.day}><span>{h.day}</span><span>{h.time}</span></li>
                  ))}
                </ul>
              </div>
            </Fade>
            <Fade delay={340}>
              <div className="visit__block">
                <p className="t-label">Services</p>
                <ul className="visit__hours" style={{ gap: '4px' }}>
                  {shop.services.slice(0, 4).map((s) => (
                    <li key={s.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', borderBottom: '1px dashed var(--line)', paddingBottom: '8px' }}>
                      <span>{s.name}</span>
                      <span style={{ color: 'var(--accent)' }}>{s.price}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ marginTop: '10px', fontSize: '0.86rem', color: 'var(--bone-2)' }}>
                  Full menu: {shop.services.length} services &middot; from {'$'}{minPrice}
                </p>
              </div>
            </Fade>
            <Fade delay={420}>
              <div className="visit__block">
                <p className="t-label">Walk-ins</p>
                <p>Before noon most days. Call ahead after two.</p>
              </div>
            </Fade>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  const now = useClock()
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__meta">
          <span>© {now.getFullYear()} {shop.name}</span>
          <span>{shop.city}</span>
          <span>Local {time}</span>
        </div>
        <div className="footer__meta">
          <span>{shop.since}</span>
          <a className="footer__top" href="#top">Back to top</a>
        </div>
      </div>
    </footer>
  )
}
