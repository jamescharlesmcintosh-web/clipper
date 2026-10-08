import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { clamp01, lerp, smoothstep, state } from '../lib/state'
import { assemblyEase, landingEase } from '../config/phases'

/* ────────────────────────────────────────────────────────────
   The clipper — 600vh choreographed timeline.

   Phases (normalized 0..1):
   0.00–0.08  OPEN         — components separated, visible
   0.08–0.28  ASSEMBLY     — snap together
   0.28–0.36  REVEAL       — completed clipper turns, catches light
   0.36–0.42  CUT 1        — first fast pass
   0.42–0.48  CUT 2        — second pass, improving fade
   0.48–0.56  CUT 3        — third pass, clean pause
   0.56–0.66  LANDING      — clipper lifts, camera pulls back, settles
   0.66–1.00  BUSINESS     — settled into the page
   ──────────────────────────────────────────────────────────── */

export const HERO_ASSEMBLED = 0.65

export function heroProgress() {
  const end = state.bounds.visit
  if (!(end > 0.001)) {
    // new short hero: drive assembly off global scroll instead
    const p = state.p
    return Math.min(1, p / 0.12 + 0.28)
  }
  return end > 0.001 ? clamp01(state.p / end) : 0
}

/* final position, exploded offset, assembly window */
const SPEC: { key: string; p: [number, number, number]; r?: [number, number, number]; ep: [number, number, number]; er?: [number, number, number]; a: number; b: number }[] = [
  { key: 'chassis', p: [0, 0, 0], ep: [-0.1, 0, -0.72], a: 0.0, b: 0.08 },
  { key: 'rear', p: [-0.42, 0, 0], ep: [-1.14, 0.08, 0], a: 0.08, b: 0.16 },
  { key: 'front', p: [0.42, 0, 0], ep: [1.1, -0.07, 0], a: 0.10, b: 0.18 },
  { key: 'lever', p: [0.72, -0.08, 0.372], r: [0, 0, -0.34], ep: [0.76, -0.08, 0.96], er: [0, 0, -0.9], a: 0.14, b: 0.22 },
  { key: 'switch', p: [-0.12, 0.342, 0], ep: [-0.12, 0.92, 0], a: 0.16, b: 0.24 },
  { key: 'badge', p: [-0.52, 0.02, 0.342], ep: [-0.52, 0.02, 0.92], a: 0.18, b: 0.26 },
  { key: 'mount', p: [0.92, 0.1, 0], ep: [1.5, 0.1, 0], a: 0.24, b: 0.30 },
  { key: 'fixed', p: [1.18, 0.22, 0], r: [0, 0, -0.22], ep: [1.98, 0.42, 0.06], er: [0, 0, -0.52], a: 0.30, b: 0.36 },
  { key: 'moving', p: [1.115, 0.35, 0], r: [0, 0, -0.22], ep: [1.88, 0.62, -0.08], er: [0, 0, -0.52], a: 0.32, b: 0.38 },
  { key: 'screwA', p: [1.225, 0.22, 0.285], r: [0, 0, Math.PI / 2], ep: [2.2, 0.3, 0.285], er: [0, 0, Math.PI / 2 + 1.1], a: 0.38, b: 0.44 },
  { key: 'screwB', p: [1.225, 0.22, -0.285], r: [0, 0, Math.PI / 2], ep: [2.2, 0.3, -0.285], er: [0, 0, Math.PI / 2 + 1.1], a: 0.40, b: 0.46 },
]

function usePart(key: string) {
  const ref = useRef<THREE.Group>(null)
  const spec = SPEC.find((s) => s.key === key)!
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const hp = state.reduced ? HERO_ASSEMBLED : heroProgress()
    const t = state.reduced ? 1 : getPartT(hp)

    const idle = state.reduced ? 0 : Math.sin(performance.now() * 0.00055 + spec.p[0] * 3.1) * 0.006
    const idleY = state.reduced ? 0 : Math.cos(performance.now() * 0.00043 + spec.p[2] * 2.7) * 0.005

    g.position.set(
      lerp(spec.ep[0], spec.p[0], t),
      lerp(spec.ep[1], spec.p[1], t) + (1 - t) * idleY + t * idle * 0.35,
      lerp(spec.ep[2], spec.p[2], t),
    )
    if (spec.r || spec.er) {
      const er = spec.er ?? [0, 0, 0]
      const fr = spec.r ?? [0, 0, 0]
      g.rotation.set(lerp(er[0], fr[0], t), lerp(er[1], fr[1], t), lerp(er[2], fr[2], t))
    }
  })
  return ref
}

/** Get the seat factor t for the current scroll progress based on phase */
function getPartT(hp: number): number {
  const { openEnd, assemblyEnd, revealEnd, cut1End, cut2End, cut3End, landingEnd } = state.bounds

  if (hp < openEnd) {
    /* OPEN phase — fully exploded */
    return 0
  }
  if (hp < assemblyEnd) {
    /* ASSEMBLY phase — snap together */
    return assemblyEase((hp - openEnd) / (assemblyEnd - openEnd))
  }
  if (hp < revealEnd) {
    /* REVEAL phase — hold assembled */
    return 1
  }
  if (hp < cut1End) {
    /* CUT 1 — blade engages */
    return 1
  }
  if (hp < cut2End) {
    /* CUT 2 — moving blade passes */
    return 1
  }
  if (hp < cut3End) {
    /* CUT 3 — final pass, pause */
    return 1
  }
  if (hp < landingEnd) {
    /* LANDING — lift and settle */
    return landingEase((hp - cut3End) / (landingEnd - cut3End))
  }
  /* BUSINESS — fully assembled and settled */
  return 1
}

/** Cutting pass progress 0..1 for the current phase */
function getCutProgress(hp: number): { pass: number; t: number } {
  const { cut1End, cut2End, cut3End } = state.bounds
  if (hp < cut1End) return { pass: 0, t: 0 }
  if (hp < cut2End) return { pass: 1, t: (hp - cut1End) / (cut2End - cut1End) }
  if (hp < cut3End) return { pass: 2, t: (hp - cut2End) / (cut3End - cut2End) }
  return { pass: 3, t: 1 }
}

function seat(a: number) {
  const t = clamp01(a)
  const s = smoothstep(0, 1, t)
  const lock = t > 0.86 ? Math.sin(((t - 0.86) / 0.14) * Math.PI) * 0.014 : 0
  return s + lock
}

function win(hp: number, a: number, b: number) {
  return seat((hp - a) / (b - a))
}

type PartSpec = {
  key: string
  p: [number, number, number]
  r?: [number, number, number]
  ep: [number, number, number]
  er?: [number, number, number]
  a: number
  b: number
}

/* materials */
const matte = { color: '#14120f', metalness: 0.28, roughness: 0.5, clearcoat: 0.32, clearcoatRoughness: 0.5, envMapIntensity: 0.95 }
const satin = { color: '#2b2723', metalness: 0.94, roughness: 0.33, envMapIntensity: 1.25 }
const steel = { color: '#c2c7cc', metalness: 1, roughness: 0.21, envMapIntensity: 1.55 }
const grip = { color: '#0d0b09', metalness: 0.06, roughness: 0.82, envMapIntensity: 0.55 }
const brass = { color: '#b0843f', metalness: 1, roughness: 0.31, envMapIntensity: 1.4 }

function Badge() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 160
    const g = c.getContext('2d')!
    g.fillStyle = '#171310'
    g.fillRect(0, 0, 512, 160)
    g.fillStyle = '#c79a52'
    g.font = '600 74px "Arial Narrow", Arial, sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('CLIPPER & CO.', 256, 84)
    g.strokeStyle = '#8a6730'
    g.lineWidth = 3
    g.strokeRect(14, 14, 484, 132)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  useEffect(() => () => tex.dispose(), [tex])
  return (
    <mesh>
      <boxGeometry args={[0.3, 0.082, 0.014]} />
      <meshPhysicalMaterial map={tex} {...brass} />
    </mesh>
  )
}

function ScrewHead() {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.032, 0.032, 0.018, 20]} />
        <meshPhysicalMaterial {...steel} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.011, 0]}>
        <boxGeometry args={[0.036, 0.004, 0.008]} />
        <meshPhysicalMaterial color="#7d8288" metalness={1} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.011, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.036, 0.004, 0.008]} />
        <meshPhysicalMaterial color="#7d8288" metalness={1} roughness={0.42} />
      </mesh>
    </group>
  )
}

function Teeth({ count, width, depth, height, y, z, fin }: {
  count: number; width: number; depth: number; height: number; y: number; z: number; fin: boolean
}) {
  const items = useMemo(() => {
    const arr: { z: number; h: number }[] = []
    const pitch = width / count
    for (let i = 0; i < count; i++) {
      arr.push({
        z: -width / 2 + pitch * (i + 0.5) + (fin ? pitch * 0.5 : 0),
        h: height * (fin ? 0.72 : 1),
      })
    }
    return arr
  }, [count, width, height, fin])
  return (
    <group>
      {items.map((t, i) => (
        <mesh key={i} position={[depth * 0.5, y, t.z]}>
          <boxGeometry args={[depth, t.h, width / count * 0.42]} />
          <meshPhysicalMaterial {...steel} roughness={fin ? 0.17 : 0.23} />
        </mesh>
      ))}
      <mesh position={[depth * 0.28, y, z]}>
        <boxGeometry args={[depth * 0.5, height * 1.06, width * 1.02]} />
        <meshPhysicalMaterial {...steel} />
      </mesh>
    </group>
  )
}

function ClipperParts({ cutPass }: { cutPass: number }) {
  const chassis = usePart('chassis')
  const rear = usePart('rear')
  const front = usePart('front')
  const lever = usePart('lever')
  const sw = usePart('switch')
  const badge = usePart('badge')
  const mount = usePart('mount')
  const fixed = usePart('fixed')
  const moving = usePart('moving')
  const screwA = usePart('screwA')
  const screwB = usePart('screwB')

  const shell = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 5, 0.05), [])
  useEffect(() => () => shell.dispose(), [shell])

  const bladeLift = cutPass === 0 ? 0 : cutPass === 1 ? 0.02 : cutPass === 2 ? -0.01 : -0.03

  return (
    <group>
      <group ref={chassis}>
        <mesh geometry={shell} scale={[1.3, 0.42, 0.46]}>
          <meshPhysicalMaterial color="#3a3733" metalness={0.88} roughness={0.4} envMapIntensity={1.15} />
        </mesh>
        <mesh position={[-0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.17, 0.17, 0.34, 24]} />
          <meshPhysicalMaterial color="#55514b" metalness={1} roughness={0.36} envMapIntensity={1.3} />
        </mesh>
        <mesh position={[0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.125, 0.125, 0.2, 18]} />
          <meshPhysicalMaterial {...satin} />
        </mesh>
      </group>

      <group ref={rear}>
        <mesh geometry={shell} scale={[0.9, 0.66, 0.7]} position={[-0.02, 0, 0]}>
          <meshPhysicalMaterial {...matte} />
        </mesh>
        <mesh position={[-0.5, 0, 0]} geometry={shell} scale={[0.32, 0.56, 0.62]}>
          <meshPhysicalMaterial {...matte} />
        </mesh>
        <mesh position={[0.44, 0, 0]}>
          <boxGeometry args={[0.012, 0.6, 0.64]} />
          <meshPhysicalMaterial color="#080706" metalness={0.3} roughness={0.7} />
        </mesh>
      </group>

      <group ref={front}>
        <mesh geometry={shell} scale={[0.88, 0.66, 0.7]} position={[0.02, 0, 0]}>
          <meshPhysicalMaterial {...matte} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0.08 + i * 0.1, -0.3, 0]}>
            <boxGeometry args={[0.05, 0.04, 0.6]} />
            <meshPhysicalMaterial {...grip} />
          </mesh>
        ))}
        <mesh position={[0.18, 0, 0.352]}>
          <boxGeometry args={[0.5, 0.44, 0.012]} />
          <meshPhysicalMaterial {...grip} />
        </mesh>
        <mesh position={[0.18, 0, -0.352]}>
          <boxGeometry args={[0.5, 0.44, 0.012]} />
          <meshPhysicalMaterial {...grip} />
        </mesh>
        <mesh position={[-0.43, 0, 0]}>
          <boxGeometry args={[0.012, 0.6, 0.64]} />
          <meshPhysicalMaterial color="#080706" metalness={0.3} roughness={0.7} />
        </mesh>
      </group>

      <group ref={lever}>
        <mesh geometry={shell} scale={[0.22, 0.05, 0.075]}>
          <meshPhysicalMaterial {...satin} roughness={0.38} />
        </mesh>
        <mesh position={[0.11, -0.012, 0]}>
          <boxGeometry args={[0.05, 0.062, 0.086]} />
          <meshPhysicalMaterial {...satin} roughness={0.42} />
        </mesh>
      </group>

      <group ref={sw}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.19, 0.038, 0.115]} />
          <meshPhysicalMaterial color="#1b1815" metalness={0.35} roughness={0.55} />
        </mesh>
        <mesh position={[0.012, 0.026, 0]}>
          <boxGeometry args={[0.075, 0.03, 0.088]} />
          <meshPhysicalMaterial {...satin} roughness={0.4} />
        </mesh>
        <mesh position={[-0.075, 0.021, 0]}>
          <boxGeometry args={[0.026, 0.02, 0.07]} />
          <meshBasicMaterial color="#c79a52" toneMapped={false} />
        </mesh>
      </group>

      <group ref={badge}>
        <Badge />
      </group>

      <group ref={mount}>
        <mesh geometry={shell} scale={[0.38, 0.62, 0.78]}>
          <meshPhysicalMaterial color="#1c1916" metalness={0.42} roughness={0.46} clearcoat={0.4} envMapIntensity={1} />
        </mesh>
        <mesh position={[0.16, 0.18, 0]}>
          <boxGeometry args={[0.13, 0.28, 0.72]} />
          <meshPhysicalMaterial {...satin} />
        </mesh>
        <mesh position={[-0.13, -0.22, 0]}>
          <boxGeometry args={[0.12, 0.13, 0.56]} />
          <meshPhysicalMaterial {...grip} />
        </mesh>
      </group>

      <group ref={fixed}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.17, 0.42, 0.86]} />
          <meshPhysicalMaterial {...steel} />
        </mesh>
        <mesh position={[-0.085, -0.14, 0]}>
          <boxGeometry args={[0.12, 0.2, 0.9]} />
          <meshPhysicalMaterial {...steel} roughness={0.28} />
        </mesh>
        <Teeth count={15} width={0.86} depth={0.19} height={0.3} y={-0.05} z={0} fin={false} />
      </group>

      <group ref={moving} position={[0, bladeLift, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.15, 0.26, 0.76]} />
          <meshPhysicalMaterial color="#aeb4ba" metalness={1} roughness={0.19} envMapIntensity={1.6} />
        </mesh>
        <Teeth count={15} width={0.76} depth={0.15} height={0.2} y={-0.03} z={0} fin />
        <mesh position={[-0.09, -0.08, 0]}>
          <boxGeometry args={[0.08, 0.12, 0.44]} />
          <meshPhysicalMaterial color="#8f959b" metalness={1} roughness={0.3} />
        </mesh>
      </group>

      <group ref={screwA}>
        <ScrewHead />
      </group>
      <group ref={screwB}>
        <ScrewHead />
      </group>
    </group>
  )
}

/* ── drag-to-inspect ──────────────────────────────────── */
const BASE_Y = -0.72
const BASE_X = 0.3

function useInspect(active: boolean) {
  const [spin, setSpin] = useState({ y: BASE_Y, x: BASE_X })
  const vel = useRef({ y: 0, x: 0 })
  const drag = useRef<{ on: boolean; x: number; y: number; moved: number; horiz: boolean }>({
    on: false, x: 0, y: 0, moved: 0, horiz: true,
  })

  useEffect(() => {
    if (!active) return
    const down = (e: PointerEvent) => {
      drag.current = { on: true, x: e.clientX, y: e.clientY, moved: 0, horiz: true }
    }
    const move = (e: PointerEvent) => {
      const d = drag.current
      if (!d.on) return
      const dx = e.clientX - d.x
      const dy = e.clientY - d.y
      d.moved += Math.abs(dx) + Math.abs(dy)
      if (d.moved > 10 && Math.abs(dy) > Math.abs(dx) * 1.25) d.horiz = false
      if (!d.horiz) return
      d.x = e.clientX
      d.y = e.clientY
      vel.current.y = dx * 0.0055
      vel.current.x = dy * 0.0032
      setSpin((s) => ({
        y: Math.max(BASE_Y - 0.8, Math.min(BASE_Y + 0.8, s.y + vel.current.y)),
        x: Math.max(BASE_X - 0.34, Math.min(BASE_X + 0.34, s.x + vel.current.x)),
      }))
    }
    const up = () => { drag.current.on = false }
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [active])

  useFrame(() => {
    const d = drag.current
    if (d.on) return
    const v = vel.current
    if (Math.abs(v.y) < 0.00002 && Math.abs(v.x) < 0.00002) return
    setSpin((s) => ({
      y: Math.max(BASE_Y - 0.8, Math.min(BASE_Y + 0.8, s.y + v.y)),
      x: Math.max(BASE_X - 0.34, Math.min(BASE_X + 0.34, s.x + v.x)),
    }))
    v.y *= 0.9
    v.x *= 0.9
  })

  return { spin, dragging: drag.current.on }
}

export function Clipper({ reduced, coarse }: { reduced: boolean; coarse: boolean }) {
  const root = useRef<THREE.Group>(null)
  const [active, setActive] = useState(false)
  const { spin, dragging } = useInspect(active)

  useEffect(() => {
    const el = document.querySelector('.hero-sticky')
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => setActive(e.isIntersecting && !reduced),
      { threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  useFrame(() => {
    const g = root.current
    if (!g) return
    const hp = state.reduced ? HERO_ASSEMBLED : heroProgress()
    const assembled = hp >= state.bounds.assemblyEnd - 0.02

    const targetY = assembled && active ? spin.y : BASE_Y
    const targetX = assembled && active ? spin.x : BASE_X
    const k = reduced ? 1 : dragging ? 0.28 : 0.07
    g.rotation.y += (targetY - g.rotation.y) * k
    g.rotation.x += (targetX - g.rotation.x) * k

    const intro = smoothstep(0, 0.15, hp)
    g.position.z += (-0.22 * intro - g.position.z) * (reduced ? 1 : 0.06)

    if (!reduced && !dragging) {
      const t = performance.now() * 0.00032
      g.rotation.z = 0.05 + Math.sin(t) * 0.012
    }
  })

  const quality = coarse ? 1 : 0

  return (
    <group position={[-1.02, 0.72, 0]} scale={quality ? 0.42 : 0.5}>
      <group ref={root} rotation={[BASE_X, BASE_Y, 0.05]}>
        <ClipperParts cutPass={0} />
      </group>
      <ambientLight intensity={0.2} />
      <directionalLight position={[-3.4, 4.2, 3.6]} intensity={2.6} color="#f2ece2" />
      <directionalLight position={[3.2, 1.1, 2.4]} intensity={1.35} color="#ffd9a8" />
      <directionalLight position={[0.4, -2.6, -2.8]} intensity={0.65} color="#9fb6cc" />
      <pointLight position={[-1.6, 1.4, 2.6]} intensity={5.5} distance={11} decay={2} color="#ffcf9c" />
      <pointLight position={[2.4, -0.6, 2.2]} intensity={2.2} distance={9} decay={2} color="#e8a84e" />
    </group>
  )
}

export function ClipperFallback() {
  return (
    <svg className="hero-fallback" viewBox="0 0 640 320" role="img" aria-label="Professional cordless barber clipper">
      <defs>
        <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2622" />
          <stop offset="55%" stopColor="#15120f" />
          <stop offset="100%" stopColor="#0b0908" />
        </linearGradient>
        <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e7ec" />
          <stop offset="50%" stopColor="#a9b0b7" />
          <stop offset="100%" stopColor="#7c848c" />
        </linearGradient>
      </defs>
      <ellipse cx="320" cy="268" rx="220" ry="16" fill="#000" opacity="0.55" />
      <rect x="120" y="128" width="180" height="104" rx="26" fill="url(#body)" />
      <rect x="286" y="126" width="176" height="108" rx="26" fill="url(#body)" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={318 + i * 30} y={214} width="16" height="12" rx="4" fill="#0d0b09" />
      ))}
      <rect x="452" y="132" width="62" height="92" rx="12" fill="#1c1916" />
      <rect x="506" y="140" width="46" height="72" rx="6" fill="url(#steel)" />
      <rect x="512" y="122" width="36" height="24" rx="4" fill="#b8bfc6" />
      {Array.from({ length: 11 }).map((_, i) => (
        <rect key={i} x={548} y={146 + i * 6.2} width="17" height="3.4" rx="1.6" fill="url(#steel)" />
      ))}
      <rect x="424" y="112" width="66" height="15" rx="7" fill="#2b2723" transform="rotate(-16 456 119)" />
      <rect x="196" y="112" width="56" height="17" rx="6" fill="#1b1815" />
      <rect x="206" y="106" width="24" height="12" rx="4" fill="#2b2723" />
      <rect x="146" y="168" width="86" height="24" rx="5" fill="#b0843f" />
      <text x="189" y="185" textAnchor="middle" fontSize="12" fontFamily="Arial, sans-serif" fill="#1b1815">CLIPPER &amp; CO.</text>
    </svg>
  )
}
