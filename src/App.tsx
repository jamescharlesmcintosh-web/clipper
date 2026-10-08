import { useCallback, useEffect, useState } from 'react'
import { Grain, Letterbox, Rail } from './components/Chrome'
import Cursor from './components/Cursor'
import Loader from './components/Loader'
import Nav from './components/Nav'
import SceneCanvas from './components/Scene'
import { useCoarsePointer, usePrefersReducedMotion } from './lib/hooks'
import { initScroll, setAccent, startScroll, stopScroll } from './lib/scroll'
import { state } from './lib/state'
import Hero from './sections/Hero'
import Cuts from './sections/Cuts'
import Studio from './sections/Studio'
import Book from './sections/Book'
import { shop } from './data/shop'

export default function App() {
  const reduced = usePrefersReducedMotion()
  const coarse = useCoarsePointer()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    state.reduced = reduced
    state.coarse = coarse
  }, [reduced, coarse])

  useEffect(() => {
    const cleanup = initScroll(reduced)
    stopScroll()
    return cleanup
  }, [reduced])

  const onLoaded = useCallback(() => {
    setReady(true)
    state.loaded = true
    document.body.classList.add('is-loaded')
    startScroll()
    setAccent(shop.accent)
  }, [])

  useEffect(() => {
    if (!ready) return
    let raf = 0
    const loop = () => {
      state.reveal += (1 - state.reveal) * 0.05
      if (state.reveal > 0.999) state.reveal = 1
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [ready])

  return (
    <>
      <Loader onDone={onLoaded} />
      <SceneCanvas reduced={reduced} />
      <Letterbox />
      <Nav />
      <Rail />
      <Cursor enabled={!coarse && !reduced} />
      <Grain />

      <main>
        <Hero />
        <Cuts />
        <Studio />
        <Book />
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <div className="footer__meta">
            <span>© {new Date().getFullYear()} {shop.name}</span>
            <span>{shop.city}</span>
          </div>
          <div className="footer__meta">
            <span>{shop.since}</span>
            <a className="footer__top" href="#top">Back to top</a>
          </div>
        </div>
      </footer>
    </>
  )
}
