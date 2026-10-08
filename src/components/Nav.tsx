import { scrollToTarget } from '../lib/scroll'
import { shop } from '../data/shop'

export default function Nav() {
  return (
    <header className="nav">
      <a
        className="nav__brand"
        href="#top"
        onClick={(e) => {
          e.preventDefault()
          scrollToTarget(0)
        }}
      >
        <span className="nav__mark" />
        {shop.name}
      </a>

      <nav className="nav__links" aria-label="Primary">
        <a
          className="nav__link"
          data-nav-link="hero"
          href="#top"
          onClick={(e) => {
            e.preventDefault()
            scrollToTarget(0)
          }}
        >
          <span>00</span>
          Cut
        </a>
        <a
          className="nav__link"
          data-nav-link="cuts"
          href="#cuts"
          onClick={(e) => {
            e.preventDefault()
            const el = document.getElementById('cuts')
            if (el) scrollToTarget(el, { offset: -40 })
          }}
        >
          <span>01</span>
          Cuts
        </a>
        <a
          className="nav__link"
          data-nav-link="book"
          href="#book"
          onClick={(e) => {
            e.preventDefault()
            const el = document.getElementById('book')
            if (el) scrollToTarget(el, { offset: -40 })
          }}
        >
          <span>02</span>
          Book
        </a>
      </nav>

      <a
        className="nav__cta"
        data-nav-cta
        href={shop.bookingHref}
        onClick={(e) => {
          if (shop.bookingHref.startsWith('#')) {
            e.preventDefault()
            const el = document.getElementById('visit')
            if (el) scrollToTarget(el)
          }
        }}
      >
        {shop.bookingLabel}
      </a>
    </header>
  )
}