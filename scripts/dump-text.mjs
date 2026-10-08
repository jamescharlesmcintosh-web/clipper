import { chromium } from 'playwright'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(4500)

const text = await page.evaluate(() => document.body.innerText)
console.log('--- LIVE TEXT ---')
console.log(text.replace(/\n{3,}/g, '\n\n'))
await browser.close()