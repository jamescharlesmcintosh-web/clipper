import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { accent, state } from './state'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null

export function getLenis() {
  return lenis
}

declare global {
  interface Window {
    __scrollTo?: (y: number) => void
  }
}

if (typeof window !== 'undefined') {
  window.__scrollTo = (y: number) => {
    if (lenis) lenis.scrollTo(y, { immediate: true })
    else window.scrollTo(0, y)
    ScrollTrigger.update()
  }
}

export function scrollToTarget(target: number | string | HTMLElement, opts?: { offset?: number }) {
  if (lenis) {
    lenis.scrollTo(target as never, { offset: opts?.offset ?? 0, duration: 1.5 })
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: 'smooth' })
  } else if (typeof target === 'string') {
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
  } else {
    target.scrollIntoView({ behavior: 'smooth' })
  }
}

export function stopScroll() {
  lenis?.stop()
  document.documentElement.classList.add('is-locked')
  document.body.classList.add('is-locked')
}

export function startScroll() {
  document.documentElement.classList.remove('is-locked')
  document.body.classList.remove('is-locked')
  lenis?.start()
  ScrollTrigger.refresh()
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function setAccent(hex: string) {
  const target = hexToRgb(hex)
  gsap.to(accent, {
    ...target,
    duration: 1,
    ease: 'power2.out',
    overwrite: 'auto',
    onUpdate: () => {
      document.documentElement.style.setProperty(
        '--accent',
        `rgb(${Math.round(accent.r)}, ${Math.round(accent.g)}, ${Math.round(accent.b)})`,
      )
    },
  })
}

function measureBounds() {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  const topOf = (name: string) => {
    const el = document.querySelector<HTMLElement>(name)
    if (!el) return 0
    return el.getBoundingClientRect().top + window.scrollY
  }
  const norm = (px: number) => Math.min(1, Math.max(0, px / max))

  const thEl = document.querySelector<HTMLElement>('[data-scene="studio"]')
  const thTop = thEl ? topOf('[data-scene="studio"]') : 0
  const thH = thEl ? thEl.offsetHeight : 0

  state.bounds = {
    hero: 0,
    visit: norm(topOf('[data-scene="cuts"]') || max * 0.25),
    thresholdStart: norm(thTop),
    thresholdEnd: norm(thTop + Math.max(1, thH * 0.55)),
    roomStart: norm(thTop + Math.max(1, thH * 0.35)),
    roomEnd: norm(topOf('[data-scene="book"]') + window.innerHeight * 0.2),
    /* Phase boundaries — spread across the 600vh hero */
    openEnd: 0.08,
    assemblyEnd: 0.28,
    revealEnd: 0.36,
    cut1End: 0.42,
    cut2End: 0.48,
    cut3End: 0.56,
    landingEnd: 0.66,
  }
}

export function initScroll(reduced: boolean) {
  state.reduced = reduced

  const root = document.documentElement
  let tickerFn: ((time: number) => void) | null = null

  if (!reduced) {
    lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      touchMultiplier: 1.5,
      wheelMultiplier: 1,
    })
    lenis.on('scroll', ScrollTrigger.update)
    tickerFn = (time: number) => lenis!.raf(time * 1000)
    gsap.ticker.add(tickerFn)
    gsap.ticker.lagSmoothing(0)
  }

  const bar = { t: 0, b: 0 }
  const readBars = () => {
    const cs = getComputedStyle(root)
    bar.t = parseFloat(cs.getPropertyValue('--barT')) || 56
    bar.b = parseFloat(cs.getPropertyValue('--barB')) || 44
  }
  readBars()

  ScrollTrigger.create({
    start: 0,
    end: () => window.innerHeight * 0.85,
    onUpdate: (self) => {
      const t = bar.t + (52 - bar.t) * self.progress
      const b = bar.b * (1 - self.progress)
      root.style.setProperty('--barT', `${t.toFixed(2)}px`)
      root.style.setProperty('--barB', `${b.toFixed(2)}px`)
    },
  })

  Array.from(document.querySelectorAll<HTMLElement>('[data-accent]')).forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      end: 'bottom 40%',
      onEnter: () => setAccent(section.dataset.accent!),
      onEnterBack: () => setAccent(section.dataset.accent!),
    })
  })

  const railLabel = document.querySelector<HTMLElement>('[data-rail-label]')
  const railIndex = document.querySelector<HTMLElement>('[data-rail-index]')
  const railFill = document.querySelector<HTMLElement>('[data-rail-fill]')
  const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'))
  const navCta = document.querySelector<HTMLElement>('[data-nav-cta]')

  const sceneEls = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'))
  let scenes: { el: HTMLElement; top: number; bottom: number }[] = []

  const refreshScenes = () => {
    scenes = sceneEls.map((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY
      return { el, top, bottom: top + el.offsetHeight }
    })
  }

  const applyChrome = (scrollY: number) => {
    if (!scenes.length) return
    const mid = scrollY + window.innerHeight * 0.55
    let active = scenes[0]
    for (const s of scenes) {
      if (mid >= s.top && mid < s.bottom) {
        active = s
        break
      }
      if (mid >= s.top) active = s
    }
    const scene = active.el
    if (railLabel) railLabel.textContent = scene.dataset.label ?? scene.dataset.scene ?? ''
    if (railIndex) railIndex.textContent = scene.dataset.railN ?? '00'
    navLinks.forEach((l) => {
      l.classList.toggle('is-active', l.dataset.navLink === scene.dataset.scene)
    })
    if (navCta) navCta.classList.toggle('is-active', scene.dataset.scene === 'book')
  }

  refreshScenes()
  applyChrome(window.scrollY)

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      state.p = self.progress
      measureBounds()
      applyChrome(self.scroll())
      if (railFill) railFill.style.transform = `scaleY(${self.progress.toFixed(4)})`
    },
  })

  const onResize = () => {
    readBars()
    measureBounds()
    refreshScenes()
    applyChrome(window.scrollY)
  }
  window.addEventListener('resize', onResize)

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      window.setTimeout(() => {
        measureBounds()
        refreshScenes()
        applyChrome(window.scrollY)
        ScrollTrigger.refresh()
      }, 60)
    })
  }

  measureBounds()
  refreshScenes()
  applyChrome(window.scrollY)
  ScrollTrigger.refresh()

  return () => {
    window.removeEventListener('resize', onResize)
    if (tickerFn) gsap.ticker.remove(tickerFn)
    ScrollTrigger.getAll().forEach((t) => t.kill())
    lenis?.destroy()
    lenis = null
  }
}
