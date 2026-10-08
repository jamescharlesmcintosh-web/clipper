import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { shop } from '../data/shop'
import {
  accent, bus, clamp01, lerp, playKnock, setHotspot, smoothstep, state,
} from '../lib/state'
import { Clipper, ClipperFallback } from './Clipper'

const W = 1.9
const H = 0.46
const D = 0.13

function makeEnvTexture() {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 256
  const g = c.getContext('2d')!
  const base = g.createLinearGradient(0, 0, 0, 256)
  base.addColorStop(0, '#2a2824'); base.addColorStop(0.42, '#4a4640'); base.addColorStop(1, '#0a0908')
  g.fillStyle = base; g.fillRect(0, 0, 512, 256)
  const band = g.createLinearGradient(0, 30, 0, 130)
  band.addColorStop(0, 'rgba(255,255,255,0)'); band.addColorStop(0.5, 'rgba(255,252,246,0.85)'); band.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = band; g.fillRect(0, 30, 512, 100)
  const warm = g.createRadialGradient(150, 80, 0, 150, 80, 120)
  warm.addColorStop(0, 'rgba(255,205,150,0.8)'); warm.addColorStop(0.4, 'rgba(232,168,78,0.28)'); warm.addColorStop(1, 'rgba(232,168,78,0)')
  g.fillStyle = warm; g.fillRect(0, 0, 512, 256)
  const cool = g.createRadialGradient(400, 45, 0, 400, 45, 130)
  cool.addColorStop(0, 'rgba(235,245,255,0.9)'); cool.addColorStop(0.45, 'rgba(190,210,230,0.3)'); cool.addColorStop(1, 'rgba(190,210,230,0)')
  g.fillStyle = cool; g.fillRect(0, 0, 512, 256)
  const floor = g.createLinearGradient(0, 200, 0, 256)
  floor.addColorStop(0, 'rgba(0,0,0,0)'); floor.addColorStop(1, 'rgba(0,0,0,0.8)')
  g.fillStyle = floor; g.fillRect(0, 200, 512, 56)
  const tex = new THREE.CanvasTexture(c)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makePosterTexture(name: string, kind: string, hex: string) {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 640
  const g = c.getContext('2d')!
  const bg = g.createLinearGradient(0, 0, 0, 640)
  bg.addColorStop(0, '#1b1815'); bg.addColorStop(0.55, '#12100e'); bg.addColorStop(1, '#0a0908')
  g.fillStyle = bg; g.fillRect(0, 0, 512, 640)
  const halo = g.createRadialGradient(256, 250, 10, 256, 250, 280)
  halo.addColorStop(0, hex + '55'); halo.addColorStop(1, hex + '00')
  g.fillStyle = halo; g.fillRect(0, 0, 512, 640)
  g.strokeStyle = hex; g.lineWidth = 3; g.beginPath()
  g.moveTo(72, 72); g.lineTo(440, 72); g.stroke()
  g.fillStyle = hex; g.fillRect(72, 72, 64, 6)
  g.fillStyle = '#efe8dc'; g.font = '600 74px "Arial Narrow", Arial, sans-serif'
  g.textBaseline = 'top'; g.fillText(name.toUpperCase(), 72, 430)
  g.fillStyle = 'rgba(239,232,220,0.55)'; g.font = '400 26px ui-monospace, monospace'
  g.fillText(kind.toUpperCase(), 72, 528)
  const noise = g.createLinearGradient(0, 0, 512, 640)
  noise.addColorStop(0, 'rgba(255,255,255,0.03)'); noise.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = noise; g.fillRect(0, 0, 512, 640)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function Environment() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const tex = makeEnvTexture()
    const pmrem = new THREE.PMREMGenerator(gl)
    const rt = pmrem.fromEquirectangular(tex)
    scene.environment = rt.texture
    tex.dispose(); pmrem.dispose()
    return () => { scene.environment = null; rt.dispose() }
  }, [gl, scene])
  return null
}

function Rig({ reduced }: { reduced: boolean }) {
  const camera = useThree((s) => s.camera)
  useFrame(() => {
    const k = reduced ? 1 : 0.05
    const b = state.bounds
    const p = state.p
    const doorT = smoothstep(b.thresholdStart, b.thresholdEnd, p)
    const roomT = smoothstep(b.roomStart, b.roomEnd, p)
    /* Camera pulls back during landing */
    const landT = smoothstep(b.cut3End, b.landingEnd, p)
    const z = 5.4 - doorT * 2.1 - roomT * 6.2 - landT * 3.5
    const y = roomT * 0.45 + landT * 0.2
    const look = roomT * -5.5 - landT * 2
    const sway = state.sx * (0.2 + roomT * 0.85)
    const bob = reduced ? 0 : Math.sin(performance.now() * 0.00035) * 0.02 * roomT
    camera.position.x += (sway - camera.position.x) * k
    camera.position.y += (y + state.sy * (0.13 + roomT * 0.5) + bob - camera.position.y) * k
    camera.position.z += (z - camera.position.z) * k
    camera.lookAt(sway * 0.35, y * 0.5, look)
  })
  return null
}

function Poster({ name, kind, hex, position, rotation }: {
  name: string; kind: string; hex: string; position: [number, number, number]; rotation?: [number, number, number]
}) {
  const tex = useMemo(() => makePosterTexture(name, kind, hex), [name, kind, hex])
  useEffect(() => () => tex.dispose(), [tex])
  const [hover, setHover] = useState(false)
  return (
    <group position={position} rotation={rotation}>
      <mesh onPointerOver={(e) => { e.stopPropagation(); setHover(true); setHotspot(name); document.body.classList.add('has-hotspot') }}
            onPointerOut={() => { setHover(false); setHotspot(null); document.body.classList.remove('has-hotspot') }}>
        <planeGeometry args={[1.28, 1.6]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[1.42, 1.74, 0.06]} />
        <meshPhysicalMaterial color={hover ? '#e8e2d8' : '#2a2622'} metalness={0.9} roughness={0.32} clearcoat={0.8} envMapIntensity={1.1} />
      </mesh>
      <mesh position={[0, 0.94, 0.02]}>
        <boxGeometry args={[0.5, 0.02, 0.02]} />
        <meshBasicMaterial color={hex} toneMapped={false} />
      </mesh>
    </group>
  )
}

function BarberChair() {
  const chrome = <meshPhysicalMaterial color="#b9b3a9" metalness={1} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} envMapIntensity={1.5} />
  const leather = <meshPhysicalMaterial color="#181410" metalness={0.15} roughness={0.52} clearcoat={0.5} clearcoatRoughness={0.35} envMapIntensity={0.7} />
  return (
    <group position={[0, 0, -8.2]}>
      <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.72, 0.82, 0.12, 48]} />{chrome}</mesh>
      <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.11, 0.14, 0.9, 24]} />{chrome}</mesh>
      <mesh position={[0, 1.06, 0]}><boxGeometry args={[1.05, 0.18, 1.02]} />{leather}</mesh>
      <mesh position={[0, 1.62, -0.42]} rotation={[-0.16, 0, 0]}><boxGeometry args={[1.02, 1.15, 0.16]} />{leather}</mesh>
      <mesh position={[-0.62, 1.32, -0.05]}><boxGeometry args={[0.12, 0.1, 0.9]} />{chrome}</mesh>
      <mesh position={[0.62, 1.32, -0.05]}><boxGeometry args={[0.12, 0.1, 0.9]} />{chrome}</mesh>
      <mesh position={[0, 2.28, -0.52]} rotation={[-0.16, 0, 0]}><boxGeometry args={[0.52, 0.22, 0.14]} />{leather}</mesh>
      <mesh position={[0, 2.05, -0.5]} rotation={[-0.16, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.38, 12]} />{chrome}</mesh>
    </group>
  )
}

function Bench() {
  return (
    <group position={[-4.6, 0, -7.2]} rotation={[0, 0.55, 0]}>
      <mesh position={[0, 0.92, 0]}><boxGeometry args={[2.2, 0.1, 0.7]} /><meshPhysicalMaterial color="#2a2622" metalness={0.35} roughness={0.4} clearcoat={0.7} envMapIntensity={0.9} /></mesh>
      {[-1, 1].map((x) => <mesh key={x} position={[x, 0.46, 0]}><boxGeometry args={[0.08, 0.92, 0.62]} /><meshPhysicalMaterial color="#16130f" metalness={0.6} roughness={0.42} envMapIntensity={0.8} /></mesh>)}
      {[-0.55, 0.15, 0.75].map((x, i) => (
        <group key={i} position={[x, 1.06, 0]} rotation={[0, 0.2 * i - 0.2, 0]}>
          <mesh><boxGeometry args={[0.42, 0.09, 0.18]} /><meshPhysicalMaterial color="#c9c4bb" metalness={1} roughness={0.16} clearcoat={1} envMapIntensity={1.5} /></mesh>
          <mesh position={[0.14, 0.075, 0]}><boxGeometry args={[0.3, 0.05, 0.1]} /><meshPhysicalMaterial color="#8d8880" metalness={1} roughness={0.22} envMapIntensity={1.3} /></mesh>
        </group>
      ))}
    </group>
  )
}

function Pendant({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 3.75, 0]}><cylinderGeometry args={[0.012, 0.012, 1.5, 8]} /><meshBasicMaterial color="#2a2622" /></mesh>
      <mesh position={[0, 2.95, 0]}><cylinderGeometry args={[0.22, 0.3, 0.34, 24, 1, true]} /><meshPhysicalMaterial color="#1a1714" metalness={0.85} roughness={0.35} side={THREE.DoubleSide} envMapIntensity={1.1} /></mesh>
      <mesh position={[0, 2.82, 0]}><sphereGeometry args={[0.13, 16, 12]} /><meshBasicMaterial color="#ffe2b8" toneMapped={false} /></mesh>
      <pointLight position={[0, 2.7, 0]} intensity={14} distance={9} decay={2} color="#ffcf9c" />
    </group>
  )
}

function Lounge({ visible }: { visible: boolean }) {
  const group = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!group.current) return
    const b = state.bounds
    const roomT = smoothstep(b.roomStart, b.roomEnd, state.p)
    const doorT = smoothstep(b.thresholdStart, b.thresholdEnd, state.p)
    const target = Math.max(roomT * 0.85 + doorT * 0.25, 0) * state.reveal
    group.current.visible = visible && target > 0.01
    group.current.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
      if (!m) return
      const mats = Array.isArray(m) ? m : [m]
      mats.forEach((mat) => {
        const any = mat as THREE.MeshStandardMaterial
        if (any.opacity !== undefined && any.transparent) any.opacity = target
      })
    })
  })
  return (
    <group ref={group} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}><planeGeometry args={[26, 26]} /><meshPhysicalMaterial color="#12100e" metalness={0.55} roughness={0.32} clearcoat={0.6} clearcoatRoughness={0.28} envMapIntensity={0.85} /></mesh>
      <mesh position={[0, 2.6, -12.6]}><planeGeometry args={[26, 6.2]} /><meshStandardMaterial color="#1a1714" metalness={0.2} roughness={0.78} envMapIntensity={0.5} /></mesh>
      <mesh position={[-8.6, 2.6, -8]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[14, 6.2]} /><meshStandardMaterial color="#171310" metalness={0.2} roughness={0.8} envMapIntensity={0.45} /></mesh>
      <mesh position={[8.6, 2.6, -8]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[14, 6.2]} /><meshStandardMaterial color="#171310" metalness={0.2} roughness={0.8} envMapIntensity={0.45} /></mesh>
      <mesh position={[0, 0.42, -12.52]}><boxGeometry args={[26, 0.84, 0.08]} /><meshPhysicalMaterial color="#2a2622" metalness={0.7} roughness={0.35} clearcoat={0.8} envMapIntensity={1} /></mesh>
      <mesh position={[0, 5.55, -8]}><planeGeometry args={[26, 14]} /><meshStandardMaterial color="#0c0b0a" metalness={0.1} roughness={0.92} /></mesh>
      <BarberChair />
      <Bench />
      <Pendant x={-1.9} z={-8.2} />
      <Pendant x={1.9} z={-8.2} />
      {shop.room.posters.map((poster, i) => {
        const n = shop.room.posters.length
        const spread = 1.85
        const x = (i - (n - 1) / 2) * spread
        return <Poster key={poster.name} name={poster.name} kind={poster.kind} hex={poster.accent} position={[x, 2.35, -12.32]} />
      })}
      <mesh position={[-7.2, 2.1, -11.9]} rotation={[0, 0.35, 0]}><planeGeometry args={[1.5, 1.9]} /><meshPhysicalMaterial color="#c9c4bb" metalness={1} roughness={0.12} clearcoat={1} envMapIntensity={1.6} /></mesh>
      <mesh position={[7.2, 2.1, -11.9]} rotation={[0, -0.35, 0]}><planeGeometry args={[1.5, 1.9]} /><meshPhysicalMaterial color="#c9c4bb" metalness={1} roughness={0.12} clearcoat={1} envMapIntensity={1.6} /></mesh>
      <ambientLight intensity={0.16} />
      <pointLight position={[0, 3.2, -6.4]} intensity={22} distance={16} decay={2} color="#ffcf9c" />
      <pointLight position={[0, 2.4, -11]} intensity={10} distance={10} decay={2} color="#e8a84e" />
    </group>
  )
}

function useWebGL() {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    let live = true
    try {
      const c = document.createElement('canvas')
      const gl = c.getContext('webgl2') || c.getContext('webgl') || (c.getContext('experimental-webgl') as WebGLRenderingContext | null)
      if (!live) return
      setOk(!!gl)
    } catch { if (live) setOk(false) }
    return () => { live = false }
  }, [])
  return ok
}

function useRenderGate() {
  const [gate, setGate] = useState(true)
  useEffect(() => {
    let visible = !document.hidden
    let heroIn = true
    const apply = () => {
      setGate(visible && heroIn)
      // Fade the frozen WebGL frame out once the hero leaves —
      // otherwise the last clipper frame photobombs the cuts section.
      document.body.classList.toggle('is-past-hero', !heroIn)
    }
    const onVis = () => { visible = !document.hidden; apply() }
    document.addEventListener('visibilitychange', onVis)
    const el = document.querySelector('.hero2')
    let io: IntersectionObserver | null = null
    if (el) {
      io = new IntersectionObserver(([e]) => { heroIn = e.isIntersecting; apply() }, { threshold: 0.01 })
      io.observe(el)
    }
    return () => { document.removeEventListener('visibilitychange', onVis); io?.disconnect(); document.body.classList.remove('is-past-hero') }
  }, [])
  return gate
}

export default function SceneCanvas({ reduced }: { reduced: boolean }) {
  const [dpr, setDpr] = useState(1.5)
  const webgl = useWebGL()
  const gate = useRenderGate()
  const [coarse, setCoarse] = useState(false)
  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, 2))
    setCoarse(window.matchMedia('(pointer: coarse)').matches)
  }, [])
  if (webgl === false) {
    return <div className="blades-canvas blades-canvas--fallback" aria-hidden="true"><ClipperFallback /></div>
  }
  return (
    <div className="blades-canvas" aria-hidden="true">
      <Canvas
        dpr={dpr}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ fov: 30, position: [0, 0, 5.8], near: 0.1, far: 60 }}
        frameloop={gate ? 'always' : 'never'}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        onCreated={({ gl }) => { gl.xr.enabled = true; (window as unknown as { __gl?: THREE.WebGLRenderer }).__gl = gl }}
      >
        <Environment />
        <Rig reduced={reduced} />
        <Clipper reduced={reduced} coarse={coarse} />
        <Lounge visible />
      </Canvas>
      <div className="blades-canvas__fade" />
    </div>
  )
}

export function useHotspot() {
  const [name, setName] = useState<string | null>(null)
  useEffect(() => {
    const handler = (e: Event) => setName((e as CustomEvent<string | null>).detail)
    bus.addEventListener('hotspot', handler)
    return () => bus.removeEventListener('hotspot', handler)
  }, [])
  return name
}
