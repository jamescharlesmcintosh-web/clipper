import { useEffect, useRef, useState, useCallback } from 'react'
import { shop } from '../data/shop'

/* ─────────────────────────────────────────────────────────────
   PRECISION PASS — the visual language of the site.

   A dark tactile hair-fiber surface covers the hero viewport.
   A black-and-chrome clipper travels a CONSTRAINED horizontal
   path. Its blade erases the fiber canvas (destination-out),
   exposing polished chrome typography underneath.

   - Auto intro: 0 → 1 in ~2.8s (fast editorial cuts)
   - Then drag / swipe anywhere on the surface to re-run passes
   - Progress drives: clipper x, reveal mask, typo tracking,
     specular sweep, clipping particles, micro vibration
   ───────────────────────────────────────────────────────────── */

function paintFibers(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  ctx.clearRect(0, 0, w, h)
  // base felt
  const base = ctx.createLinearGradient(0, 0, 0, h)
  base.addColorStop(0, '#171310')
  base.addColorStop(0.5, '#100d0b')
  base.addColorStop(1, '#0a0908')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)
  // fiber strands — short directional strokes
  let s = seed
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
  for (let i = 0; i < Math.min(6000, Math.floor((w * h) / 420)); i++) {
    const x = rnd() * w
    const y = rnd() * h
    const len = 6 + rnd() * 22
    const ang = (rnd() - 0.5) * 0.9 + (y > h * 0.5 ? 0.15 : -0.1)
    const light = rnd()
    ctx.strokeStyle = light > 0.86
      ? 'rgba(232,168,78,0.20)'
      : light > 0.6
        ? 'rgba(201,196,187,0.13)'
        : 'rgba(0,0,0,0.55)'
    ctx.lineWidth = 0.8 + rnd() * 1.1
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len)
    ctx.stroke()
  }
  // vignette grain
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, w, h)
}

function ClipperSVG({ hot }: { hot: boolean }) {
  return (
    <svg viewBox="0 0 560 220" className={`pass__clipper-svg${hot ? ' is-hot' : ''}`} aria-hidden="true">
      <defs>
        <linearGradient id="pbody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a352f" />
          <stop offset="38%" stopColor="#1b1815" />
          <stop offset="100%" stopColor="#0b0908" />
        </linearGradient>
        <linearGradient id="psteel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2f5f8" />
          <stop offset="34%" stopColor="#c2c8cf" />
          <stop offset="52%" stopColor="#f7f2ea" />
          <stop offset="68%" stopColor="#7c848c" />
          <stop offset="100%" stopColor="#d9dee3" />
        </linearGradient>
        <linearGradient id="pamber" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e8a84e" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffcf9c" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <ellipse cx="280" cy="196" rx="215" ry="12" fill="#000" opacity="0.6" />
      {/* body */}
      <rect x="60" y="72" width="330" height="112" rx="30" fill="url(#pbody)" stroke="#000" strokeWidth="2" />
      <rect x="60" y="72" width="330" height="26" rx="13" fill="#fff" opacity="0.06" />
      {/* grip ribs */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={120 + i * 34} y={156} width="18" height="14" rx="5" fill="#0d0b09" opacity="0.9" />
      ))}
      {/* taper lever */}
      <rect x="352" y="52" width="72" height="16" rx="8" fill="#2b2723" stroke="#c9c4bb" strokeWidth="1" opacity="0.95" transform="rotate(-14 388 60)" />
      {/* switch + amber dot */}
      <rect x="150" y="58" width="64" height="18" rx="7" fill="#1b1815" stroke="#000" />
      <rect x="162" y="62" width="26" height="10" rx="4" fill="#2b2723" />
      <circle cx="206" cy="67" r="4" fill="#e8a84e">
        {hot ? <animate attributeName="opacity" values="1;0.35;1" dur="0.5s" repeatCount="indefinite" /> : null}
      </circle>
      {/* badge */}
      <rect x="96" y="106" width="120" height="30" rx="5" fill="#b0843f" />
      <text x="156" y="127" textAnchor="middle" fontSize="15" fontFamily="Arial Narrow, Arial" fontWeight="700" fill="#171310">CLIPPER &amp; CO.</text>
      {/* mount */}
      <rect x="382" y="80" width="52" height="96" rx="12" fill="#1c1916" stroke="#000" />
      {/* fixed blade */}
      <rect x="428" y="86" width="52" height="84" rx="6" fill="url(#psteel)" stroke="#5b6167" strokeWidth="1.5" />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x={474} y={92 + i * 6.4} width="20" height="3.6" rx="1.6" fill="url(#psteel)" stroke="#6a7076" strokeWidth="0.6" />
      ))}
      {/* moving blade shimmer */}
      <rect x="428" y="86" width="52" height="10" rx="5" fill="#fff" opacity="0.35" />
      {/* amber edge light */}
      <rect x="62" y="170" width="326" height="3" fill="url(#pamber)" opacity="0.8" />
      {/* oil sheen */}
      <ellipse cx="452" cy="100" rx="22" ry="8" fill="#fff" opacity="0.28" />
    </svg>
  )
}

export default function PrecisionPass({ onFirstCut }: { onFirstCut?: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const fiberRef = useRef<HTMLCanvasElement>(null)
  const baseRef = useRef<HTMLCanvasElement>(null)
  const [progress, setProgress] = useState(0) // 0..1 blade position
  const [cuts, setCuts] = useState(0) // editorial cut flashes
  const [live, setLive] = useState(false) // intro done → interactive
  const [dragging, setDragging] = useState(false)
  const progRef = useRef(0)
  const firedRef = useRef(false)
  const dragRef = useRef<{ on: boolean; x: number } | null>(null)

  const setP = useCallback((v: number) => {
    const c = Math.max(0, Math.min(1, v))
    progRef.current = c
    setProgress(c)
  }, [])

  /* paint static fiber base once (resized) */
  useEffect(() => {
    const base = baseRef.current
    const fiber = fiberRef.current
    const wrap = wrapRef.current
    if (!base || !fiber || !wrap) return
    const paint = () => {
      const r = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(320, Math.floor(r.width * dpr))
      const h = Math.max(320, Math.floor(r.height * dpr))
      for (const c of [base, fiber]) { c.width = w; c.height = h }
      const bctx = base.getContext('2d')!
      paintFibers(bctx, w, h, 1234567)
      const fctx = fiber.getContext('2d')!
      paintFibers(fctx, w, h, 1234567)
    }
    paint()
    window.addEventListener('resize', paint)
    return () => window.removeEventListener('resize', paint)
  }, [])

  /* erase fibers along blade path — full-height wipe, no gaps */
  useEffect(() => {
    const fiber = fiberRef.current
    const base = baseRef.current
    if (!fiber || !base) return
    const ctx = fiber.getContext('2d')!
    const W = fiber.width, H = fiber.height
    // repaint from base each frame (cheap blit), then cut everything left of blade
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(base, 0, 0)
    const x = W * (0.02 + progress * 0.96)
    const feather = W * 0.06
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = 'rgba(0,0,0,1)'
    ctx.fillRect(0, 0, Math.max(0, x - feather), H)
    const g = ctx.createLinearGradient(x - feather, 0, x + 8, 0)
    g.addColorStop(0, 'rgba(0,0,0,1)')
    g.addColorStop(0.85, 'rgba(0,0,0,0.95)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(Math.max(0, x - feather), 0, feather + 8, H)
    // blade micro-serration line
    ctx.fillStyle = 'rgba(0,0,0,1)'
    ctx.fillRect(x - 2, 0, 4, H)
    // fully cleared once the pass completes — no fibre sliver at the edge
    if (progress > 0.97) {
      ctx.clearRect(0, 0, W, H)
    }
    ctx.restore()
    // spawn clipping flecks via DOM event (cheap)
    if (Math.random() < 0.5) {
      const evt = new CustomEvent('pass:clipping', { detail: { x: progress } })
      window.dispatchEvent(evt)
    }
    if (progress > 0.985 && !firedRef.current) {
      firedRef.current = true
      onFirstCut?.()
      setLive(true)
    }
  }, [progress, onFirstCut])

  /* reset fibers on demand (re-run pass) */
  const resetFibers = useCallback(() => {
    const fiber = fiberRef.current
    const base = baseRef.current
    if (!fiber || !base) return
    const ctx = fiber.getContext('2d')!
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, fiber.width, fiber.height)
    ctx.drawImage(base, 0, 0)
    firedRef.current = false
  }, [])

  /* scripted opening: black → 3 fast cuts → auto pass in ~3s */
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setP(1); setCuts(3); setLive(true); return }
    const tick = (now: number) => {
      const t = (now - t0) / 1000
      // editorial cuts at 0.15 / 0.35 / 0.55
      setCuts(t > 0.55 ? 3 : t > 0.35 ? 2 : t > 0.15 ? 1 : 0)
      if (t < 0.55) { setP(0.02 + t * 0.03); raf = requestAnimationFrame(tick); return }
      const k = Math.min(1, (t - 0.55) / 1.75)
      const eased = 1 - Math.pow(1 - k, 3)
      setP(0.04 + eased * 0.96)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [setP])

  /* constrained drag: horizontal only, clamped, drives progress */
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const down = (e: PointerEvent) => {
      if (!live && progRef.current < 0.9) return // locked during intro
      dragRef.current = { on: true, x: e.clientX }
      setDragging(true)
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d?.on) return
      const dx = e.clientX - d.x
      if (Math.abs(dx) < 2) return
      d.x = e.clientX
      const r = wrap.getBoundingClientRect()
      const delta = dx / Math.max(320, r.width * 0.8)
      let next = progRef.current + delta
      // if dragged back past start, reset fibers for a fresh pass
      if (next < 0.06 && progRef.current > 0.4) { resetFibers(); next = 0.04 }
      setP(next)
    }
    const up = () => { dragRef.current = null; setDragging(false) }
    wrap.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      wrap.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [live, setP, resetFibers])

  const travel = typeof window !== 'undefined' && window.innerWidth < 720 ? 34 : 44
  const bladeX = `${3 + progress * travel}%`
  const parked = progress > 0.97
  const sheenX = `${progress * 70}%`

  return (
    <div ref={wrapRef} className={`pass${live ? ' is-live' : ''}${dragging ? ' is-drag' : ''}`} data-pass={progress.toFixed(3)}>
      {/* polished layer underneath */}
      <div className="pass__under">
        <p className="t-label pass__kicker">{shop.kicker} — {shop.since}</p>
        <h2 className="pass__word" aria-label={shop.name}>
          {shop.word.split('').map((ch, i) => (
            <span key={i} className="pass__letter" style={{ ['--i' as string]: i }}>
              <i style={{ transform: `translateY(${(1 - Math.min(1, progress * 1.6)) * 108}%)` }}>{ch}</i>
            </span>
          ))}
        </h2>
        <div className="pass__sub" style={{ opacity: progress > 0.55 ? 1 : 0 }}>
          <p className="serif-i pass__tag">{shop.tagline}</p>
          <p className="t-body">{shop.note}</p>
          <div className="pass__actions">
            <a className="visit__book" href={shop.bookingHref}>{shop.bookingLabel}<span className="arrow">→</span></a>
            <span className="t-label pass__hint">{live ? 'Drag to run another pass' : 'The precision pass'}</span>
          </div>
        </div>
        {/* specular sweep follows blade */}
        <div className="pass__sheen" style={{ left: sheenX, opacity: Math.max(0, 0.9 - progress * 1.1) }} />
      </div>

      {/* fiber surface (erased by blade) */}
      <canvas ref={baseRef} className="pass__base" aria-hidden="true" />
      <canvas ref={fiberRef} className="pass__fiber" aria-hidden="true" />

      <div className="pass__progress" style={{ transform: `scaleX(${progress})` }} />
      {/* the clipper — constrained to the pass track */}
      <div className="pass__track" aria-hidden="true">
        <div className={`pass__clipper${parked ? ' is-parked' : ''}`} style={{ left: bladeX }}>
          <ClipperSVG hot={dragging || !live} />
          <span className="pass__edge" />
        </div>
      </div>

      {/* fast editorial cut flashes */}
      <div className={`pass__cut pass__cut--${cuts}`} aria-hidden="true" />
      <div className="pass__frame" aria-hidden="true">
        <span>PASS {progress < 0.33 ? '01' : progress < 0.7 ? '02' : '03'} / 03</span>
        <span>{live ? 'DRAG — CONSTRAINED PATH' : 'AUTO PASS — WATCH'}</span>
      </div>
    </div>
  )
}
