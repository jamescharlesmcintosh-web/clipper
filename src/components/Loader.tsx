import { useEffect, useRef, useState } from 'react'
import { shop } from '../data/shop'

export default function Loader({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const fired = useRef(false)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const duration = 900
    const timers: ReturnType<typeof setTimeout>[] = []

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setCount(Math.round(eased * 100))
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      }
    }

    const finish = () => {
      if (fired.current) return
      fired.current = true
      setCount(100)
      const el = root.current
      if (!el) { onDone(); return }
      el.classList.add('is-ready')
      timers.push(setTimeout(() => {
        el.classList.add('is-done')
        onDone()
        timers.push(setTimeout(() => el.classList.add('is-gone'), 1200))
      }, 750))
    }

    // Timer-driven completion: fires even when rAF is starved on cold load.
    timers.push(setTimeout(finish, duration + 250))
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout) }
  }, [onDone])

  return (
    <div className="loader" ref={root} aria-hidden="true">
      <div className="loader__half loader__half--l" />
      <div className="loader__half loader__half--r" />
      <div className="loader__seam" />
      <div className="loader__ui">
        <div className="loader__brand">
          {shop.name} — {shop.since}
        </div>
        <div className="loader__count">{String(count).padStart(3, '0')}</div>
        <div className="loader__bar">
          <i style={{ transform: `scaleX(${count / 100})` }} />
        </div>
      </div>
    </div>
  )
}