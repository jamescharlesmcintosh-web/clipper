import { chromium } from "playwright";

const BASE = process.env.BASE || "http://127.0.0.1:5173";
const browser = await chromium.launch();

const analyse = (url) => async (page) =>
  await page.evaluate(async (u) => {
    const img = new Image();
    img.src = u;
    await img.decode();
    const W = 120, H = 75;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H).data;
    let r = 0, g = 0, b = 0, n = 0, gold = 0, dark = 0;
    let edges = 0;
    const lum = (i) => d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722;
    for (let y = 0; y < H; y++) {
      for (let i = 0; i < W; i++) {
        const k = (y * W + i) * 4;
        const R = d[k], G = d[k + 1], B = d[k + 2];
        r += R; g += G; b += B; n++;
        if (R > 120 && G > 85 && B < R * 0.72 && R - B > 45) gold++;
        if (lum(k) < 26) dark++;
        if (i > 0 && Math.abs(lum(k) - lum(k - 4)) > 26) edges++;
        if (y > 0 && Math.abs(lum(k) - lum(k - W * 4)) > 26) edges++;
      }
    }
    return {
      avg: `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`,
      goldPct: +((gold / n) * 100).toFixed(1),
      darkPct: +((dark / n) * 100).toFixed(1),
      edgeDensity: +((edges / (n * 2)) * 100).toFixed(1),
    };
  }, url);

async function run(label, { reduced = false, w = 1440, h = 900 } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE " + m.text()); });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2600);

  console.log(`\n===== ${label} =====`);

  const shell = await page.evaluate(() => ({
    canvas: !!document.querySelector("canvas"),
    fallback: !!document.querySelector(".hero-fallback"),
    heroH: Math.round(document.querySelector(".hero")?.offsetHeight ?? 0),
    viewH: window.innerHeight,
    cue: document.querySelector(".hero__cue")?.innerText.replace(/\n/g, " | "),
    tag: document.querySelector(".hero__tag")?.innerText,
    note: document.querySelector(".hero__desc .t-body")?.innerText,
    brick: document.body.innerText.includes("gold brick"),
  }));
  console.log("  canvas=" + shell.canvas, "fallbackSVG=" + shell.fallback,
    "hero=" + shell.heroH + "px", "(" + Math.round((shell.heroH / shell.viewH) * 100) + "vh)");
  console.log("  cue @0% : " + shell.cue);
  console.log("  tag     : " + shell.tag);

  const ana = analyse("");
  const shot = async (name) => {
    const buf = await page.screenshot({ path: `shots/verify/${label}-${name}.png`, timeout: 20000 });
    return buf;
  };

  // scroll through the hero range
  const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  const heroScroll = await page.evaluate(() => {
    const v = document.querySelector('[data-scene="visit"]');
    return v ? v.getBoundingClientRect().top + window.scrollY : window.innerHeight * 2;
  });

  const stops = reduced ? [0, 0.5] : [0, 0.18, 0.36, 0.5, 0.65, 0.85];
  const marks = [];
  for (const s of stops) {
    await page.evaluate((y) => {
      if (window.__scrollTo) window.__scrollTo(y);
      else window.scrollTo(0, y);
    }, Math.round(heroScroll * s));
    await page.waitForTimeout(900);
    const f = await shot("h" + String(Math.round(s * 100)).padStart(3, "0"));
    // analyse from the live canvas region via the saved file
    const a = await page.evaluate(async () => {
      const gl = document.querySelector("canvas");
      return { cue: document.querySelector(".hero__cue")?.innerText.replace(/\n/g, " | ") };
    });
    marks.push({ s, cue: a.cue, bytes: f.length });
    console.log(`  hero ${String(Math.round(s * 100)).padStart(3)}%  bytes=${String(f.length).padStart(7)}  cue="${a.cue}"`);
  }

  // reversible?
  if (!reduced) {
    await page.evaluate((y) => { if (window.__scrollTo) window.__scrollTo(y); }, 0);
    await page.waitForTimeout(800);
    const back = await page.evaluate(() => document.querySelector(".hero__cue")?.innerText.replace(/\n/g, " | "));
    console.log("  reversed to 0% cue: " + back);
  }

  // page integrity
  const integ = await page.evaluate(() => {
    const cta = document.querySelector('a[href*="booksy"], a[href*="book"], .nav__cta, [data-nav-cta]');
    const navs = document.querySelectorAll("[data-nav-link]").length;
    return {
      scrollable: document.documentElement.scrollHeight > window.innerHeight + 200,
      navLinks: navs,
      cta: cta ? (cta.getAttribute("href") || "") : null,
      ctaVisible: !!cta && getComputedStyle(cta).visibility !== "hidden",
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      heroHeight: document.querySelector(".hero")?.offsetHeight ?? 0,
    };
  });
  console.log("  scrollable=" + integ.scrollable, "navLinks=" + integ.navLinks,
    "cta=" + integ.cta, "ovfX=" + integ.overflowX);

  // drag rotation only when assembled
  if (!reduced) {
    await page.evaluate((y) => { if (window.__scrollTo) window.__scrollTo(y); }, Math.round(heroScroll * 0.85));
    await page.waitForTimeout(700);
    await page.mouse.move(700, 420);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) await page.mouse.move(700 + i * 26, 420);
    await page.mouse.up();
    await page.waitForTimeout(500);
    const afterDrag = await page.evaluate(() => document.querySelector(".hero__cue")?.innerText.replace(/\n/g, " | "));
    console.log("  after drag cue: " + afterDrag + "  (page still scrollable=" + integ.scrollable + ")");
  }

  console.log("  errors: " + (errors.length ? errors.join(" | ") : "none"));
  await ctx.close();
  return errors;
}

const e1 = await run("desktop", { w: 1440, h: 900 });
const e2 = await run("mobile", { w: 390, h: 844 });
const e3 = await run("reduced", { reduced: true });

await browser.close();
const all = [...e1, ...e2, ...e3];
console.log("\nTOTAL ERRORS:", all.length ? all.join(" | ") : "none");
