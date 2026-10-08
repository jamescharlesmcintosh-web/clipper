import { useEffect, useRef } from 'react'
import { state } from '../lib/state'

export default function Cursor({ enabled }: { enabled: boolean }) {
  const ring = useRef<HTMLDivElement>(null)
  const spot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let rx = x
    let ry = y
    let sx = x
    let sy = y
    let raf = 0
    let active = false

    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      state.pointerX = (x / window.innerWidth) * 2 - 1
      state.pointerY = -((y / window.innerHeight) * 2 - 1)
      if (!active) {
        active = true
        document.body.classList.add('has-cursor')
        rx = x
        ry = y
        sx = x
        sy = y
      }
    }

    const loop = () => {
      rx += (x - rx) * 0.22
      ry += (y - ry) * 0.22
      sx += (x - sx) * 0.075
      sy += (y - sy) * 0.075
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      if (spot.current) spot.current.style.transform = `translate3d(${sx}px, ${sy}px, 0)`
      raf = requestAnimationFrame(loop)
    }

    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null
      const hot = t?.closest('a, button, [data-hot]')
      ring.current?.classList.toggle('is-hot', Boolean(hot))
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      cancelAnimationFrame(raf)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <div className="spot" ref={spot} aria-hidden="true" />
      <div className="cursor" ref={ring} aria-hidden="true" />
    </>
  )
}