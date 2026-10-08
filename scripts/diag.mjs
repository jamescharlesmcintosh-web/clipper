import { chromium } from "playwright";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(2600);

const info = await page.evaluate(() => {
  const hero = document.querySelector(".hero");
  const visit = document.querySelector('[data-scene="visit"]');
  return {
    heroH: hero?.offsetHeight,
    heroTop: hero ? hero.getBoundingClientRect().top + window.scrollY : null,
    visitTop: visit ? visit.getBoundingClientRect().top + window.scrollY : null,
    docH: document.documentElement.scrollHeight,
    viewH: window.innerHeight,
  };
});
console.log("layout:", JSON.stringify(info));

for (const y of [0, 200, 500, 900, 1300, 1700, 2100]) {
  await page.evaluate((v) => {
    if (window.__scrollTo) window.__scrollTo(v);
    else window.scrollTo(0, v);
  }, y);
  await page.waitForTimeout(700);
  const s = await page.evaluate(() => {
    const cue = document.querySelector(".hero__cue")?.innerText.replace(/\n/g, " | ");
    const sticky = document.querySelector(".hero-sticky")?.getBoundingClientRect();
    return {
      y: Math.round(window.scrollY),
      cue,
      stickyTop: sticky ? Math.round(sticky.top) : null,
      stickyBottom: sticky ? Math.round(sticky.bottom) : null,
    };
  });
  console.log("scrollY=" + String(s.y).padStart(5), "sticky=[" + s.stickyTop + "," + s.stickyBottom + "]", "cue=" + s.cue);
}
await browser.close();
