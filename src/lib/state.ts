export type Bounds = {
  hero: number
  visit: number
  thresholdStart: number
  thresholdEnd: number
  roomStart: number
  roomEnd: number
  /* Phase boundaries normalized 0..1 */
  openEnd: number
  assemblyEnd: number
  revealEnd: number
  cut1End: number
  cut2End: number
  cut3End: number
  landingEnd: number
}

export const state = {
  p: 0,
  pointerX: 0,
  pointerY: 0,
  sx: 0,
  sy: 0,
  reveal: 0,
  loaded: false,
  reduced: false,
  coarse: false,
  knockPlayed: false,
  bounds: {
    hero: 0,
    visit: 0.22,
    thresholdStart: 0.38,
    thresholdEnd: 0.56,
    roomStart: 0.52,
    roomEnd: 0.92,
    openEnd: 0.08,
    assemblyEnd: 0.28,
    revealEnd: 0.36,
    cut1End: 0.42,
    cut2End: 0.48,
    cut3End: 0.56,
    landingEnd: 0.66,
  } as Bounds,
}

export const accent = { r: 232, g: 168, b: 78 }

export const bus = new EventTarget()

export function setHotspot(name: string | null) {
  bus.dispatchEvent(new CustomEvent('hotspot', { detail: name }))
}

export function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export function smoothstep(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a || 1e-6))
  return t * t * (3 - 2 * t)
}

export function track(p: number, keys: [number, number][]) {
  if (p <= keys[0][0]) return keys[0][1]
  const last = keys[keys.length - 1]
  if (p >= last[0]) return last[1]
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]
    const b = keys[i + 1]
    if (p >= a[0] && p <= b[0]) {
      const k = b[0] === a[0] ? 1 : (p - a[0]) / (b[0] - a[0])
      const e = k * k * (3 - 2 * k)
      return a[1] + (b[1] - a[1]) * e
    }
  }
  return last[1]
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function playKnock() {
  try {
    const Ctx =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const hit = (t: number, f: number) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 320
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(f, ctx.currentTime + t)
      osc.frequency.exponentialRampToValueAtTime(f * 0.45, ctx.currentTime + t + 0.16)
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.32, ctx.currentTime + t + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.22)
      osc.connect(filter)
      filter.connect(g)
      g.connect(ctx.destination)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.25)
    }
    hit(0, 96)
    hit(0.18, 82)
    setTimeout(() => ctx.close(), 900)
  } catch {
    /* audio is optional */
  }
}
