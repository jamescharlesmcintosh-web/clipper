import { chromium } from "playwright";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(2800);

const hs = await page.evaluate(() => {
  const v = document.querySelector('[data-scene="visit"]');
  return v ? v.getBoundingClientRect().top + window.scrollY : 1600;
});

for (const [s, name] of [
  [0, "a-exploded"],
  [0.45, "b-mid"],
  [0.72, "c-assembled"],
]) {
  await page.evaluate((y) => {
    if (window.__scrollTo) window.__scrollTo(y);
    else window.scrollTo(0, y);
  }, Math.round(hs * s));
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `shots/verify/v2-${name}.png` });
  console.log("shot", name);
}

console.log("errors:", errors.length ? errors.join("|") : "none");
await browser.close();
