import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { previewServer } from "../tests/preview-server.mjs";

// Reuse the actual game renderer to create the locally bundled social image.
// Build once before running this script, then rebuild to include the PNGs.
const server = await previewServer();
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  });
  await page.route("https://api.squeekchain.com/**", (route) => route.abort());
  await page.goto(server.url);
  await page.getByRole("button", { name: "Start running" }).waitFor();
  await page.waitForTimeout(200);
  const art = await page.locator(".game-canvas").evaluate((c) => c.toDataURL());
  const fredoka = (await readFile("public/fonts/fredoka.woff2")).toString(
    "base64",
  );
  const sans = (await readFile("public/fonts/dm-sans.woff2")).toString(
    "base64",
  );
  const favicon = (await readFile("public/favicon.svg")).toString("base64");
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<!doctype html><html><head><style>
    @font-face{font-family:Fredoka;src:url(data:font/woff2;base64,${fredoka})} @font-face{font-family:Sans;src:url(data:font/woff2;base64,${sans})}
    *{box-sizing:border-box}body{margin:0;background:#f9f7ef;color:#29372c;width:1200px;height:630px;overflow:hidden;font-family:Sans}
    .left{position:absolute;left:60px;top:55px;width:530px}.brand{display:flex;align-items:center;gap:12px;font:600 34px Fredoka}.brand img{width:48px;height:48px}
    h1{font:600 76px/1.05 Fredoka;letter-spacing:-2px;margin:68px 0 24px}h1 span{color:#677b3f}p{font:24px/1.5 Sans;max-width:450px;margin:0}.note{display:inline-block;padding:14px 22px;border-radius:12px;background:#cef16e;font:600 20px Sans;margin-top:34px}
    .art{position:absolute;left:625px;top:48px;width:575px;height:534px;background:#e8eddf;border-radius:260px 0 0 260px;overflow:hidden}.art img{position:absolute;width:850px;max-width:none;height:528px;left:-137px;top:16px;object-fit:fill}
    </style></head><body><div class="left"><div class="brand"><img src="data:image/svg+xml;base64,${favicon}"/>Squeek Run</div><h1>Small hamster.<br/><span>Big problems.</span></h1><p>A chaotic runner powered by real Squeekchain activity.</p><div class="note">Play free. Dress irresponsibly.</div></div><div class="art"><img src="${art}"/></div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "public/share.png", scale: "css" });
  await page.setViewportSize({ width: 180, height: 180 });
  await page.setContent(
    `<body style="margin:0"><img style="display:block;width:180px;height:180px" src="data:image/svg+xml;base64,${favicon}"></body>`,
  );
  await page.screenshot({ path: "public/touch-icon.png", scale: "css" });
  console.log(
    "Rendered public/share.png (1200×630) and public/touch-icon.png (180×180).",
  );
} finally {
  await browser.close();
  await server.close();
}
