import { shop } from '../data/shop'
import { Fade, Reveal, Rule } from '../components/Reveal'

/* 03 — THE STUDIO. His place, no invented biography. */
export default function Studio() {
  return (
    <section className="studio" id="studio" data-scene="studio" data-label="Studio" data-rail-n="02" data-accent="#E8A84E">
      <div className="container">
        <div className="sec-head">
          <p className="t-label t-label--accent">03 / The studio</p>
          <p className="t-label">{shop.street}</p>
        </div>
        <Rule />
        <div className="studio__grid">
          <div>
            <Reveal as="h2" className="studio__title" lines={['One chair.', 'No noise.']} />
            <Fade delay={200}>
              <p className="t-body">{shop.note}</p>
            </Fade>
            <Fade delay={300}>
              <div className="studio__fig" aria-label="The barber — campaign portrait">
                <div className="studio__sil" />
                <div className="studio__rim" />
                <p className="t-label studio__cap">The barber — in the chair light</p>
              </div>
            </Fade>
          </div>
          <div className="studio__list">
            {shop.studio.map((s, i) => (
              <Fade key={s.name} delay={140 + i * 100}>
                <div className="studio__row">
                  <span className="studio__idx">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="studio__name">{s.name}</p>
                    <p className="t-body">{s.desc}</p>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
