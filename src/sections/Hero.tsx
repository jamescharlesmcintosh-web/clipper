import { useState } from 'react'
import PrecisionPass from './Pass'

export default function Hero() {
  const [, setCut] = useState(false)
  return (
    <section className="hero2 section" id="top" data-scene="hero" data-label="Cut" data-rail-n="00" data-accent="#E8A84E">
      <PrecisionPass onFirstCut={() => { setCut(true); document.body.classList.add('is-assembled') }} />
    </section>
  )
}
