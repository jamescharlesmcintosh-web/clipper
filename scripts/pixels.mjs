import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173";
const files = process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE + "/?x=1", { waitUntil: "domcontentloaded" });

console.log("file".padEnd(26), "objWxH".padEnd(12), "aspect".padEnd(7), "edges%".padEnd(8), "gold%".padEnd(7), "steel%".padEnd(7), "dark%".padEnd(7));
for (const f of files) {
  const r = await page.evaluate(async (u) => {
    const img = new Image();
    img.src = u;
    await img.decode();
    const W = 200, H = 125;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H).data;
    const lum = (i) => d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722;

    // background is the near-black page; object = anything notably lit
    let minX = W, maxX = 0, minY = H, maxY = 0, n = 0;
    let edges = 0, gold = 0, steel = 0, dark = 0;
    for (let y = 0; y < H; y++) {
      for (let i = 0; i < W; i++) {
        const k = (y * W + i) * 4;
        const R = d[k], G = d[k + 1], B = d[k + 2];
        const L = lum(k);
        if (L > 30) {
          if (i < minX) minX = i;
          if (i > maxX) maxX = i;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          n++;
          if (R > 110 && G > 80 && B < R * 0.72 && R - B > 40) gold++;
          if (L > 120 && Math.abs(R - B) < 34 && R > 90) steel++;
          if (L < 22) dark++;
        }
        if (i > 0 && Math.abs(lum(k) - lum(k - 4)) > 24) edges++;
        if (y > 0 && Math.abs(lum(k) - lum(k - W * 4)) > 24) edges++;
      }
    }
    const objW = maxX - minX + 1;
    const objH = maxY - minY + 1;
    return {
      box: `${objW}x${objH}`,
      aspect: +(objW / Math.max(1, objH)).toFixed(2),
      edges: +((edges / (W * H * 2)) * 100).toFixed(1),
      gold: +((gold / Math.max(1, n)) * 100).toFixed(1),
      steel: +((steel / Math.max(1, n)) * 100).toFixed(1),
      dark: +((dark / Math.max(1, n)) * 100).toFixed(1),
    };
  }, `${BASE}/${f}`);

  console.log(
    f.replace("shots/verify/", "").padEnd(26),
    r.box.padEnd(12),
    String(r.aspect).padEnd(7),
    String(r.edges).padEnd(8),
    String(r.gold).padEnd(7),
    String(r.steel).padEnd(7),
    String(r.dark).padEnd(7),
  );
}
await browser.close();
