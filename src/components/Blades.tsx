import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { accent, clamp01, smoothstep, state } from '../lib/state'

const W = 1.9
const H = 0.46
const D = 0.13
const GAP = 0.07

function makeSeamTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 64
  const g = c.getContext('2d')!
  g.clearRect(0, 0, 256, 64)
  const col = g.createLinearGradient(0, 0, 256, 0)
  col.addColorStop(0, 'rgba(255, 214, 160, 0)')
  col.addColorStop(0.22, 'rgba(255, 214, 160, 0.5)')
  col.addColorStop(0.5, 'rgba(255, 248, 236, 1)')
  col.addColorStop(0.78, 'rgba(255, 214, 160, 0.5)')
  col.addColorStop(1, 'rgba(255, 214, 160, 0)')
  g.fillStyle = col
  g.fillRect(0, 0, 256, 64)
  const row = g.createLinearGradient(0, 0, 0, 64)
  row.addColorStop(0, 'rgba(255,255,255,0)')
  row.addColorStop(0.5, 'rgba(255,255,255,1)')
  row.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = row
  g.fillRect(0, 0, 256, 64)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeEnvTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 256
  const g = c.getContext('2d')!
  const base = g.createLinearGradient(0, 0, 0, 256)
  base.addColorStop(0, '#2a2824')
  base.addColorStop(0.42, '#4a4640')
  base.addColorStop(1, '#0a0908')
  g.fillStyle = base
  g.fillRect(0, 0, 512, 256)
  const band = g.createLinearGradient(0, 30, 0, 130)
  band.addColorStop(0, 'rgba(255,255,255,0)')
  band.addColorStop(0.5, 'rgba(255, 252, 246, 0.85)')
  band.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = band
  g.fillRect(0, 30, 512, 100)
  const warm = g.createRadialGradient(150, 80, 0, 150, 80, 120)
  warm.addColorStop(0, 'rgba(255, 205, 150, 0.8)')
  warm.addColorStop(0.4, 'rgba(232, 168, 78, 0.28)')
  warm.addColorStop(1, 'rgba(232, 168, 78, 0)')
  g.fillStyle = warm
  g.fillRect(0, 0, 512, 256)
  const cool = g.createRadialGradient(400, 45, 0, 400, 45, 130)
  cool.addColorStop(0, 'rgba(235, 245, 255, 0.9)')
  cool.addColorStop(0.45, 'rgba(190, 210, 230, 0.3)')
  cool.addColorStop(1, 'rgba(190, 210, 230, 0)')
  g.fillStyle = cool
  g.fillRect(0, 0, 512, 256)
  const floor = g.createLinearGradient(0, 200, 0, 256)
  floor.addColorStop(0, 'rgba(0,0,0,0)')
  floor.addColorStop(1, 'rgba(0,0,0,0.8)')
  g.fillStyle = floor
  g.fillRect(0, 200, 512, 56)
  const tex = new THREE.CanvasTexture(c)
  tex.mapping = THREE.EquirectangularReflectionMapping
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
    tex.dispose()
    pmrem.dispose()
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
    const z = 5.4 - doorT * 2.1 - roomT * 6.2
    const y = roomT * 0.45
    const look = roomT * -5.5
    const sway = state.sx * (0.2 + roomT * 0.85)
    const bob = reduced ? 0 : Math.sin(performance.now() * 0.00035) * 0.02 * roomT
    camera.position.x += (sway - camera.position.x) * k
    camera.position.y += (y + state.sy * (0.13 + roomT * 0.5) + bob - camera.position.y) * k
    camera.position.z += (z - camera.position.z) * k
    camera.lookAt(sway * 0.35, y * 0.5, look)
  })
  return null
}

function Blades({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null)
  const top = useRef<THREE.Group>(null)
  const bottom = useRef<THREE.Group>(null)
  const seam = useRef<THREE.Mesh>(null)
  const key = useRef<THREE.PointLight>(null)
  const rim = useRef<THREE.DirectionalLight>(null)

  const geo = useMemo(() => new RoundedBoxGeometry(W, H, D, 5, 0.02), [])
  const seamTexture = useMemo(() => makeSeamTexture(), [])

  const chrome = useMemo(
    () => new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#d6d0c6'),
      metalness: 1, roughness: 0.19, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.6,
      transparent: true, opacity: 1,
    }), [],
  )
  const lightColor = useMemo(() => new THREE.Color('#e8a84e'), [])

  useEffect(() => {
    return () => { geo.dispose(); seamTexture.dispose(); chrome.dispose() }
  }, [geo, seamTexture, chrome])

  useFrame((st, dt) => {
    const g = group.current
    if (!g) return
    const step = reduced ? 1 : Math.min(1, dt * 6)
    state.sx += (state.pointerX - state.sx) * step
    state.sy += (state.pointerY - state.sy) * step

    const p = state.p
    const visit = state.bounds.visit
    const t = clamp01((p - Math.max(0, visit * 0.5)) / Math.max(1e-4, 1 - Math.max(0, visit * 0.5)))
    const e = smoothstep(0, 1, t)

    const aspect = st.viewport.aspect || 1.78
    const narrow = aspect < 0.9
    const fit = narrow ? 0.5 : aspect < 1.3 ? 0.78 : 1

    /* Phase-aware positioning */
    const { cut1End, cut2End, cut3End, landingEnd } = state.bounds
    let posX = (narrow ? 0.35 : 0.62) - e * (narrow ? 0.5 : 1.05)
    let posY = (narrow ? -0.15 : 0.02) - e * 0.02
    let posZ = -e * 0.5
    let rotZ = 0.1 - e * 0.1
    let rotY = state.sx * 0.2 * (1 - e * 0.7)
    let scale = (1 - e * 0.55) * fit
    let gap = GAP * (1 + e * 0.4)
    let fade = (1 - e * 0.78) * (narrow ? 0.72 : 1)

    /* Cutting pass animation — blades close during cuts */
    if (p >= cut1End && p < cut3End) {
      const cutPhase = (p - cut1End) / (cut3End - cut1End)
      const cutT = cuttingPassEase(cutPhase)
      gap = GAP * (0.3 + 0.7 * cutT)
      /* Blade lift during cutting */
      posY += (1 - cutT) * 0.04
    }
    if (p >= cut3End && p < landingEnd) {
      /* Landing — blades lift away */
      const landT = (p - cut3End) / (landingEnd - cut3End)
      posY += landT * 0.15
      posZ += landT * 0.8
      scale = (1 - landT * 0.3) * fit
    }

    const time = reduced ? 0 : st.clock.elapsedTime
    const idle = Math.sin(time * 0.3) * 0.028
    const intro = state.reveal

    g.position.x += (posX - g.position.x) * step
    g.position.y += (posY + idle - g.position.y) * step
    g.position.z += (posZ - g.position.z) * step
    const targetScale = scale * (0.9 + 0.1 * intro)
    g.scale.x += (targetScale - g.scale.x) * step
    g.scale.y += (targetScale - g.scale.y) * step
    g.scale.z += (targetScale - g.scale.z) * step
    g.rotation.y += (rotY - g.rotation.y) * step
    g.rotation.z += (rotZ - g.rotation.z) * step
    g.rotation.x += (state.sy * 0.08 - g.rotation.x) * step
    g.visible = intro > 0.02
    chrome.opacity = fade * intro

    if (top.current) top.current.position.y = H / 2 + gap / 2
    if (bottom.current) bottom.current.position.y = -H / 2 - gap / 2
    if (seam.current) {
      const m = seam.current.material as THREE.MeshBasicMaterial
      const pulse = 0.78 + Math.sin(time * 1.1) * 0.08
      m.opacity = (1 - e * 0.72) * pulse * intro
      seam.current.scale.y = 0.5 + gap * 4
      seam.current.visible = m.opacity > 0.02
    }
    lightColor.setRGB(accent.r / 255, accent.g / 255, accent.b / 255, THREE.SRGBColorSpace)
    if (key.current) {
      key.current.color.copy(lightColor)
      key.current.position.x = state.sx * 3.2 + 0.3
      key.current.position.y = state.sy * 2.1 + 0.7
      key.current.position.z = 3.2
      key.current.intensity = (7.5 + (1 - e) * 3.5) * intro
    }
    if (rim.current) rim.current.intensity = (3.6 + e * 0.4) * intro
  })

  return (
    <>
      <Environment />
      <ambientLight intensity={0.22} />
      <directionalLight ref={rim} position={[-2.6, 3.4, -3]} intensity={3.6} color="#e4eef8" />
      <directionalLight position={[3, -1, 2.6]} intensity={1.1} color="#ffe2bc" />
      <pointLight ref={key} position={[0.3, 0.7, 3.2]} intensity={7.5} distance={15} decay={2} color="#e8a84e" />
      <Rig reduced={reduced} />
      <group ref={group} position={[0.62, 0.02, 0]}>
        <mesh ref={seam} position={[0, 0, -0.1]}>
          <planeGeometry args={[W * 1.05, 0.3]} />
          <meshBasicMaterial map={seamTexture} color="#ffffff" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
        <group ref={top} position={[0, H / 2 + GAP / 2, 0]}>
          <mesh geometry={geo} material={chrome} />
        </group>
        <group ref={bottom} position={[0, -H / 2 - GAP / 2, 0]}>
          <mesh geometry={geo} material={chrome} />
        </group>
      </group>
    </>
  )
}

function cuttingPassEase(t: number): number {
  /* Sharp, fast passes — quick in, sharp stop */
  return t < 0.3 ? 4 * t * t * t : t < 0.7 ? 1 - Math.pow(-2 * t + 2, 3) / 2 : 1
}

export default function BladesCanvas({ reduced }: { reduced: boolean }) {
  const [dpr, setDpr] = useState(1.5)
  useEffect(() => { setDpr(Math.min(window.devicePixelRatio || 1, 2)) }, [])
  return (
    <div className="blades-canvas" aria-hidden="true">
      <Canvas
        dpr={dpr}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ fov: 30, position: [0, 0, 5.4], near: 0.1, far: 50 }}
        frameloop="always"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <Blades reduced={reduced} />
      </Canvas>
      <div className="blades-canvas__fade" />
    </div>
  )
}
