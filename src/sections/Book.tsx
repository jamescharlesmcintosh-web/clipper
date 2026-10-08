import { shop } from '../data/shop'
import { Fade, Reveal } from '../components/Reveal'

/* 04 — BOOKING. One decisive action + finishing edge-up. */
export default function Book() {
  return (
    <section className="book" id="book" data-scene="book" data-label="Book" data-rail-n="03" data-accent="#E8A84E">
      <div className="container book__inner">
        <p className="t-label t-label--accent">04 / Book</p>
        <Reveal as="h2" className="book__title" lines={['Take the chair.']} />
        <Fade delay={180}>
          <p className="serif-i book__line">{shop.tagline}</p>
        </Fade>
        <Fade delay={280}>
          <div className="book__actions">
            <a className="book__cta" href={shop.bookingHref}>{shop.bookingLabel}<span aria-hidden="true"> →</span></a>
            <a className="visit__phone" href={shop.phoneHref}>{shop.phone}</a>
          </div>
        </Fade>
        <Fade delay={380}>
          <div className="book__meta">
            <span>{shop.street} — {shop.city}</span>
            <span>{shop.hours[0].day} {shop.hours[0].time}</span>
            <span>{shop.email}</span>
          </div>
        </Fade>
      </div>
      {/* finishing edge-up: thin clipper line returns across the footer */}
      <div className="book__edge" aria-hidden="true"><span /></div>
    </section>
  )
}
