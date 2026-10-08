/* ============================================================
   Scroll choreography timeline
   600 viewport heights allocated across all phases
   ============================================================ */

export const PHASES = {
  /* Opening — clipper is separated, components visible */
  OPEN:        { start: 0.00, end: 0.08, label: 'OPEN' },
  /* Assembly — components snap together */
  ASSEMBLY:    { start: 0.08, end: 0.28, label: 'ASSEMBLE' },
  /* Reveal — completed clipper turns and catches light */
  REVEAL:      { start: 0.28, end: 0.36, label: 'REVEAL' },
  /* Cutting Pass 1 */
  CUT_1:       { start: 0.36, end: 0.42, label: 'CUT 1' },
  /* Cutting Pass 2 */
  CUT_2:       { start: 0.42, end: 0.48, label: 'CUT 2' },
  /* Cutting Pass 3 — clean pause */
  CUT_3:       { start: 0.48, end: 0.56, label: 'CUT 3' },
  /* Landing — clipper lifts, camera pulls back, settles */
  LANDING:     { start: 0.56, end: 0.66, label: 'LAND' },
  /* Business content — portfolio, shop, studio */
  BUSINESS:    { start: 0.66, end: 1.00, label: 'STUDIO' },
} as const

export const HERO_VIEWPORT_HEIGHTS = 600

/** Convert a scroll progress 0..1 to a pixel offset for 600vh */
export function progressToVH(p: number): number {
  return p * HERO_VIEWPORT_HEIGHTS
}

/** Check which phase a scroll progress is in */
export function getPhase(p: number): keyof typeof PHASES {
  const phases = Object.values(PHASES)
  for (const phase of phases) {
    if (p >= phase.start && p < phase.end) return phase.label as keyof typeof PHASES
  }
  if (p >= PHASES.BUSINESS.start) return 'BUSINESS'
  return 'OPEN'
}

/** Smooth step within a phase */
export function phaseProgress(p: number, phase: keyof typeof PHASES): number {
  const ph = PHASES[phase]
  const range = ph.end - ph.start
  if (range <= 0) return 0
  return Math.max(0, Math.min(1, (p - ph.start) / range))
}

/** Easing: fast snap for assembly, smooth for landing */
export function assemblyEase(t: number): number {
  /* Snap-then-hold — components lock in with a slight overshoot */
  const s = t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2
  /* Overshoot at lock point */
  if (t > 0.85) {
    return s + Math.sin((t - 0.85) / 0.15 * Math.PI) * 0.03
  }
  return s
}

export function cuttingEase(t: number): number {
  /* Sharp, confident cuts — fast in, sharp stop */
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export function landingEase(t: number): number {
  /* Smooth deceleration as it settles */
  return 1 - Math.pow(1 - t, 3)
}
