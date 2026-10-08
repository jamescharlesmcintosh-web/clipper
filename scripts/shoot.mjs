import { chromium } from 'playwright'
import fs from 'node:fs'

const OUT = process.argv[2] || 'shots'
fs.mkdirSync(OUT, { recursive: true })

const viewports = [
  { name: 'wide', width: 1920, height: 1080 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 },
]

const stops = [0, 0.25, 0.42, 0.55, 0.68, 0.85, 1]

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = []

for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[${vp.name}] console: ${m.text()}`)
  })
  page.on('pageerror', (e) => errors.push(`[${vp.name}] pageerror: ${e.message}`))

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(4200)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/${vp.name}-00-hero.png` })

  const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
  console.log(`[${vp.name}] max=${max}`)
  let i = 1
  for (const s of stops.slice(1)) {
    const target = Math.round(max * s)
    await page.evaluate((y) => {
      if (window.__scrollTo) window.__scrollTo(y)
      else window.scrollTo(0, y)
      window.dispatchEvent(new Event('scroll'))
    }, target)
    await page.waitForTimeout(1600)
    const pos = await page.evaluate(() => {
      const active = [...document.querySelectorAll('[data-scene]')].find((el) => {
        const r = el.getBoundingClientRect()
        return r.top < window.innerHeight * 0.55 && r.bottom > window.innerHeight * 0.55
      })
      return {
        y: Math.round(window.scrollY),
        scene: active?.getAttribute('data-scene') ?? null,
        rail: document.querySelector('[data-rail-index]')?.textContent ?? null,
      }
    })
    console.log(`[${vp.name}] p${Math.round(s * 100)} target=${target} actual=${pos.y} scene=${pos.scene} rail=${pos.rail}`)
    await page.screenshot({ path: `${OUT}/${vp.name}-${String(i).padStart(2, '0')}-p${Math.round(s * 100)}.png` })
    i++
  }

  const overflow = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }))
  if (overflow.sw > overflow.cw + 1) {
    errors.push(`[${vp.name}] horizontal overflow ${overflow.sw} > ${overflow.cw}`)
  }

  await ctx.close()
}

await browser.close()
fs.writeFileSync(`${OUT}/errors.txt`, errors.join('\n') || 'no errors')
console.log(errors.length ? errors.join('\n') : 'no errors')