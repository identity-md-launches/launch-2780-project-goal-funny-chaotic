import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, webkit } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { previewServer } from "./preview-server.mjs";

const engine = process.argv.includes("--webkit") ? "webkit" : "chromium";
const output =
  process.argv.find((x) => x.startsWith("--out="))?.slice(6) ??
  "test/scratch/browser";
await mkdir(output, { recursive: true });
const server = await previewServer();
const browser = await { chromium, webkit }[engine].launch({
  headless: !process.argv.includes("--headed"),
});
const report = { engine, checks: [], errors: [] };
const check = (name, data = {}) => {
  report.checks.push({ name, passed: true, ...data });
  console.log(`PASS ${name}`);
};
const core = {
  schemaVersion: 1,
  installationId: "browser-fixture",
  status: "available",
  chain: { chainId: "11155111" },
  identities: { core: "0x980b4424c007caf7a1f3670b48c8eaef7ebc3d44" },
  configuration: {
    blockUnitsPerBlock: "1000000000",
    genesisTimestamp: "1793022600",
    roundDuration: "600",
  },
  core: {
    blockHeight: "5204",
    blockProgress: "637347328",
    cumulativeWork: "58518",
    settledThroughRound: "712",
    paused: false,
  },
};
const status = {
  generatedAt: new Date().toISOString(),
  measurement: {
    receivedAt: new Date().toISOString(),
    freshness: "online",
    staleAfterSeconds: 120,
    rpmMilli: 60000,
    coreStatus: "ACTIVE",
    provenance: "hardware",
  },
};
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [],
    resourceErrors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().startsWith(server.url) && r.status() >= 400)
      resourceErrors.push(`${r.status()} ${r.url()}`);
  });
  await page.route("https://api.squeekchain.com/v1/core", (route) =>
    route.fulfill({
      json: core,
      headers: {
        "access-control-allow-origin": "*",
        date: new Date().toUTCString(),
      },
    }),
  );
  await page.route("https://api.squeekchain.com/v1/status", (route) =>
    route.fulfill({
      json: status,
      headers: { "access-control-allow-origin": "*" },
    }),
  );
  await page.goto(server.url);
  await page.getByText(/^#5,?204$/).waitFor();
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width >= 1000 ? 1000 : 844 });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `overflow at ${width}`,
    );
    const action = await page
      .getByRole("button", { name: "Start running", exact: true })
      .boundingBox();
    assert.ok(
      action.y + action.height <= (width >= 1000 ? 1000 : 844),
      `Start is below the first screen at ${width}`,
    );
    await page.waitForFunction(
      () => {
        const canvas = document.querySelector(".game-canvas");
        if (!canvas || canvas.width === 0 || canvas.height === 0) return false;
        const c = canvas.getContext("2d");
        const colors = new Set();
        for (let y = 60; y < canvas.height - 40; y += 20)
          for (let x = 40; x < canvas.width - 40; x += 20)
            colors.add([...c.getImageData(x, y, 1, 1).data].join(","));
        return colors.size > 10;
      },
      undefined,
      { timeout: 5000 },
    );
    await page.screenshot({
      path: `${output}/${engine}-${width}.png`,
      fullPage: true,
    });
    check(
      `Rendered at ${width}px: no overflow, visible primary action and canvas art`,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [category, count] of [
    ["Headwear", 7],
    ["Handheld", 8],
    ["Extras", 5],
  ]) {
    await page.getByRole("button", { name: category, exact: true }).click();
    const choices = page.locator(".outfit-option");
    assert.equal(await choices.count(), count);
    const rendered = new Set();
    for (let i = 0; i < count; i++) {
      await choices.nth(i).click();
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      rendered.add(
        await page.locator(".game-canvas").evaluate((c) => c.toDataURL()),
      );
    }
    assert.equal(
      rendered.size,
      count,
      `All ${category} choices must render distinctly`,
    );
  }
  check(
    "All 20 headwear, handheld and extra choices visibly render distinctly",
  );
  await page.getByRole("button", { name: "Headwear", exact: true }).click();
  const initialArt = await page
    .locator(".game-canvas")
    .evaluate((c) => c.toDataURL());
  await page.getByRole("button", { name: "Tiny crown", exact: true }).click();
  await page.getByRole("button", { name: "Handheld", exact: true }).click();
  await page.getByRole("button", { name: "Giant spoon", exact: true }).click();
  await page.getByText("His snackjesty", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Extras", exact: true }).click();
  await page.getByRole("button", { name: "Cape", exact: true }).click();
  await page.waitForTimeout(120);
  assert.notEqual(
    initialArt,
    await page.locator(".game-canvas").evaluate((c) => c.toDataURL()),
  );
  await page.reload();
  await page.getByText("His snackjesty", { exact: true }).waitFor();
  check(
    "Customization visibly changes the hamster, applies a combo and persists across reload",
  );
  await page.getByRole("button", { name: "How to play", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  assert.equal(
    await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    ),
    "How to play",
  );
  check("Help dialog opens, Escape closes it and focus returns to the trigger");
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await page
    .getByRole("button", { name: "Coinbase Wallet", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Browser wallet", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Browser wallet", exact: true })
    .click();
  await page
    .getByText("Could not connect to this wallet.", { exact: false })
    .waitFor();
  await page.keyboard.press("Escape");
  check("No-extension wallet sheet and recoverable connection error");
  await page.evaluate(() => window.scrollTo(0, 0));
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  await writeFile(
    `${output}/${engine}-axe.json`,
    JSON.stringify(axe.violations, null, 2),
  );
  assert.deepEqual(
    axe.violations.map((v) => `${v.id}: ${v.description}`),
    [],
  );
  check("Automated axe accessibility checks on initial screen", {
    violations: axe.violations.length,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page
      .locator(".mini-wheel")
      .evaluate((e) => getComputedStyle(e).animationName),
    "none",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  check("Reduced motion stops the live wheel animation");
  await page.clock.install();
  await page.evaluate(() => {
    let n = 0;
    Math.random = () => (n++ % 2 === 0 ? 0.5 : 0.8);
  });
  await page
    .getByRole("button", { name: "Start running", exact: true })
    .click();
  await page.clock.runFor(400);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  const score = await page.locator(".hud-score").textContent();
  await page.clock.runFor(1000);
  assert.equal(await page.locator(".hud-score").textContent(), score);
  await page
    .getByRole("button", { name: "Resume running", exact: true })
    .click();
  core.core.blockHeight = "5205";
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await page.getByText(/^#5,?205$/).waitFor();
  await page.clock.runFor(200);
  assert.ok(await page.locator(".boost-timer").isVisible());
  assert.ok(
    await page.getByRole("button", { name: "Randomize outfit" }).isDisabled(),
  );
  await page.screenshot({
    path: `${output}/${engine}-running.png`,
    fullPage: false,
  });
  check(
    "Keyboard controls, pause/resume, in-run outfit lock and real-data adapter boost (mock feed increment)",
  );
  await page.clock.runFor(12000);
  await page.getByRole("heading", { name: "Wheel, that happened." }).waitFor();
  const points = Number(
    (await page.locator(".result-score strong").textContent()).replaceAll(
      ",",
      "",
    ),
  );
  assert.ok(points > 0);
  assert.equal(
    await page.evaluate(() => JSON.parse(localStorage.getItem("squeek:best"))),
    points,
  );
  assert.ok(
    await page
      .getByRole("button", { name: "Connect to submit score" })
      .isDisabled(),
  );
  await page.screenshot({ path: `${output}/${engine}-results.png` });
  check(
    "Collectibles, collision, result screen, device best and honest unconfigured submission state",
    { points },
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.sharedScore = text;
        },
      },
    });
  });
  await page.getByRole("button", { name: "Share score", exact: true }).click();
  await page.getByText("Score and link copied.", { exact: true }).waitFor();
  assert.ok(
    (await page.evaluate(() => window.sharedScore)).includes(String(points)),
  );
  check(
    "Share action copies the actual score and current page link (clipboard adapter)",
  );
  await page
    .getByRole("button", { name: "Run again", exact: true })
    .last()
    .click();
  await page.clock.runFor(100);
  assert.ok(
    await page
      .getByRole("button", { name: "Pause game", exact: true })
      .isVisible(),
  );
  check("Replay starts a new run");
  await page.close();

  const offline = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  await offline.route("https://api.squeekchain.com/**", (route) =>
    route.abort(),
  );
  await offline.goto(server.url);
  await offline.getByRole("button", { name: "Start running" }).waitFor();
  await offline.getByRole("button", { name: "Start running" }).click();
  await offline.getByRole("button", { name: "Pause game" }).waitFor();
  check("Gameplay starts when both external data feeds are unavailable");
  await offline.close();

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
    hasTouch: true,
  });
  await mobile.route("https://api.squeekchain.com/**", (route) =>
    route.abort(),
  );
  await mobile.goto(server.url);
  await mobile.getByRole("button", { name: "Connect", exact: true }).click();
  for (const name of ["MetaMask", "Coinbase Wallet", "Rabby", "Phantom"])
    assert.ok(
      await mobile
        .getByRole("link", { name: `Open in ${name}`, exact: true })
        .isVisible(),
    );
  assert.ok(
    await mobile
      .getByRole("button", { name: "Coinbase Smart Wallet", exact: true })
      .isVisible(),
  );
  await mobile.screenshot({ path: `${output}/${engine}-mobile-wallet.png` });
  check(
    "Mobile bottom sheet has all four wallet-browser links and Coinbase Smart Wallet",
  );
  await mobile.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(resourceErrors, []);
  check("No uncaught browser errors or missing local resources");
} catch (e) {
  report.errors.push(e.stack);
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
  await writeFile(
    `${output}/${engine}-report.json`,
    JSON.stringify(report, null, 2),
  );
}
