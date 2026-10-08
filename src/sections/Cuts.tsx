import { shop } from '../data/shop'
import { Fade, Reveal, Rule } from '../components/Reveal'

/* 02 — THE CUTS. Full-bleed editorial, no cards. */
export default function Cuts() {
  return (
    <section className="cuts" id="cuts" data-scene="cuts" data-label="Cuts" data-rail-n="01" data-accent="#E8A84E">
      <div className="container cuts__head">
        <div className="sec-head">
          <p className="t-label t-label--accent">02 / The cuts</p>
          <p className="t-label">Selected work — clipper first</p>
        </div>
        <Rule />
        <Reveal as="h2" className="cuts__title" lines={['Sharp is', 'a discipline.']} />
      </div>

      <div className="cuts__wall">
        {shop.portfolio.map((p, i) => (
          <article key={p.title} className={`cut cut--${i % 3}`}>
            <div className="cut__media" aria-hidden="true">
              {/* procedural campaign frame: sheen + fade gradient per cut */}
              <span className="cut__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="cut__sheen" />
              <span className="cut__bars" />
            </div>
            <div className="container cut__row">
              <Fade delay={80}>
                <h3 className="cut__name">{p.title}</h3>
              </Fade>
              <Fade delay={160}>
                <p className="t-body cut__desc">{p.desc}</p>
              </Fade>
              <Fade delay={220}>
                <p className="t-label cut__tag">{p.tag}</p>
              </Fade>
            </div>
            {i < shop.portfolio.length - 1 && <div className="cut__wipe" aria-hidden="true"><span /></div>}
          </article>
        ))}
      </div>

      <div className="container cuts__menu">
        <div className="sec-head">
          <p className="t-label t-label--accent">Menu</p>
          <p className="t-label">{shop.services.length} services</p>
        </div>
        <ul className="menu">
          {shop.services.map((s) => (
            <li key={s.name} className="menu__row">
              <span className="menu__name">{s.name}</span>
              <span className="menu__dots" aria-hidden="true" />
              <span className="menu__desc">{s.desc}</span>
              <span className="menu__price">{s.price}</span>
              <span className="menu__time">{s.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
