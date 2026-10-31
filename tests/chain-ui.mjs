import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { createPublicClient, createWalletClient, http } from "viem";
import { sepolia } from "viem/chains";
import { previewServer } from "./preview-server.mjs";

// Isolated Anvil validation ONLY. No local account or address is written to site config.
const output =
  process.argv.find((x) => x.startsWith("--out="))?.slice(6) ??
  "test/scratch/chain-ui";
await mkdir(output, { recursive: true });
const portProbe = createServer();
await new Promise((r) => portProbe.listen(0, "127.0.0.1", r));
const port = portProbe.address().port;
await new Promise((r) => portProbe.close(r));
const anvil = spawn(
  "anvil",
  [
    "--silent",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--chain-id",
    "11155111",
  ],
  { stdio: "ignore" },
);
const rpcUrl = `http://127.0.0.1:${port}`;
const client = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
let browser, server;
const report = {
  network: "isolated Anvil using Sepolia chain ID; NOT a Sepolia deployment",
  checks: [],
  errors: [],
};
const check = (name) => {
  report.checks.push({ name, passed: true });
  console.log(`PASS ${name}`);
};
try {
  let ready = false;
  for (let n = 0; n < 50; n++) {
    try {
      await client.getChainId();
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  assert.ok(ready, "Anvil did not start");
  const accounts = await client.request({ method: "eth_accounts" });
  const wallet = createWalletClient({
    account: accounts[0],
    chain: sepolia,
    transport: http(rpcUrl),
  });
  const artifact = JSON.parse(
    await readFile("contracts/artifacts/SqueekLeaderboard.json", "utf8"),
  );
  const hash = await wallet.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
  });
  const receipt = await client.waitForTransactionReceipt({ hash });
  assert.equal(receipt.status, "success");
  const contract = receipt.contractAddress;
  assert.ok(contract);
  check("Deployed the delivered compiled artifact to isolated Anvil");
  server = await previewServer("dist", rpcUrl);
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/config.json", (route) =>
    route.fulfill({
      json: {
        chainId: 11155111,
        leaderboardAddress: contract,
        deploymentTransaction: hash,
        rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
      },
    }),
  );
  await page.route(
    "https://ethereum-sepolia-rpc.publicnode.com/**",
    async (route) => {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: route.request().postData(),
      });
      await route.fulfill({
        status: response.status,
        body: await response.text(),
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
      });
    },
  );
  await page.route("https://api.squeekchain.com/**", (route) => route.abort());
  await page.addInitScript(
    ({ account }) => {
      let currentChain = "0x1",
        chainAdded = false,
        connected = false;
      const listeners = new Map();
      window.testWalletRequests = [];
      window.rejectNextTransaction = true;
      const provider = {
        on(event, fn) {
          const list = listeners.get(event) || [];
          list.push(fn);
          listeners.set(event, list);
        },
        removeListener(event, fn) {
          listeners.set(
            event,
            (listeners.get(event) || []).filter((x) => x !== fn),
          );
        },
        async request({ method, params }) {
          window.testWalletRequests.push({ method, params });
          if (method === "eth_accounts") return connected ? [account] : [];
          if (method === "eth_requestAccounts") {
            connected = true;
            return [account];
          }
          if (method === "eth_chainId") return currentChain;
          if (method === "wallet_switchEthereumChain") {
            if (!chainAdded)
              throw { code: 4902, message: "Unknown chain in test wallet" };
            currentChain = params[0].chainId;
            for (const fn of listeners.get("chainChanged") || [])
              fn(currentChain);
            return null;
          }
          if (method === "wallet_addEthereumChain") {
            chainAdded = true;
            currentChain = params[0].chainId;
            for (const fn of listeners.get("chainChanged") || [])
              fn(currentChain);
            return null;
          }
          if (method === "wallet_revokePermissions") return null;
          if (
            ["wallet_requestPermissions", "wallet_getPermissions"].includes(
              method,
            )
          )
            return [{ parentCapability: "eth_accounts" }];
          if (
            method === "eth_sendTransaction" &&
            window.rejectNextTransaction
          ) {
            window.rejectNextTransaction = false;
            throw { code: 4001, message: "User rejected the request" };
          }
          const response = await fetch("/__rpc", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method,
              params: params ?? [],
            }),
          });
          const body = await response.json();
          if (body.error) throw body.error;
          return body.result;
        },
      };
      window.ethereum = provider;
      const announce = () => {
        for (const [uuid, name, rdns] of [
          [
            "284c1f32-13f0-4e83-821a-11331f2d7801",
            "Test Extension A",
            "test.extension.a",
          ],
          [
            "284c1f32-13f0-4e83-821a-11331f2d7802",
            "Test Extension B",
            "test.extension.b",
          ],
        ]) {
          dispatchEvent(
            new CustomEvent("eip6963:announceProvider", {
              detail: {
                info: {
                  uuid,
                  name,
                  rdns,
                  icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" fill="green"/></svg>',
                },
                provider,
              },
            }),
          );
        }
      };
      addEventListener("eip6963:requestProvider", announce);
      announce();
    },
    { account: accounts[0] },
  );
  await page.goto(server.url);
  await page
    .getByRole("heading", { name: "The first seat is yours" })
    .waitFor();
  assert.ok(
    await page
      .getByRole("button", { name: "Connect", exact: true })
      .isVisible(),
  );
  check("Public contract reads work before a wallet is connected");
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  assert.ok(
    await page
      .getByRole("button", { name: "Test Extension A", exact: true })
      .isVisible(),
  );
  assert.ok(
    await page
      .getByRole("button", { name: "Test Extension B", exact: true })
      .isVisible(),
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Browser wallet", exact: true })
      .count(),
    0,
  );
  await page
    .getByRole("button", { name: "Test Extension A", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Switch to Sepolia", exact: true })
    .waitFor();
  check("EIP-6963 discovers both named extensions and hides the generic row");
  await page
    .getByRole("button", { name: "Switch to Sepolia", exact: true })
    .click();
  await page.waitForFunction(() =>
    document.querySelector(".wallet-button").textContent.includes("0x"),
  );
  const calls = await page.evaluate(() => window.testWalletRequests);
  assert.ok(
    calls.some(
      (x) =>
        x.method === "wallet_switchEthereumChain" &&
        x.params[0].chainId === "0xaa36a7",
    ),
  );
  assert.ok(
    calls.some(
      (x) =>
        x.method === "wallet_addEthereumChain" &&
        x.params[0].chainId === "0xaa36a7" &&
        x.params[0].rpcUrls.includes(
          "https://ethereum-sepolia-rpc.publicnode.com",
        ),
    ),
  );
  check("Wrong network prompts switch, with wallet_addEthereumChain fallback");
  await page.clock.install();
  await page.evaluate(() => {
    let n = 0;
    Math.random = () => (n++ % 2 === 0 ? 0.5 : 0.8);
  });
  await page.getByRole("button", { name: "Start running" }).click();
  await page.clock.runFor(12000);
  await page.getByRole("heading", { name: "Wheel, that happened." }).waitFor();
  await page
    .getByRole("button", { name: "Submit score on Sepolia", exact: true })
    .click();
  assert.equal(
    await page.locator("#nickname").getAttribute("aria-invalid"),
    "true",
  );
  await page
    .getByLabel("Leaderboard nickname", { exact: true })
    .fill("Integration Hamster");
  await page
    .getByRole("button", { name: "Submit score on Sepolia", exact: true })
    .click();
  await page
    .getByText("Request declined in your wallet. You can try again.", {
      exact: true,
    })
    .waitFor();
  check(
    "Nickname validation and a rejected signing request recover without losing the score",
  );
  await client.request({ method: "evm_setAutomine", params: [false] });
  await page
    .getByRole("button", { name: "Submit score on Sepolia", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Awaiting confirmation…", exact: true })
    .waitFor();
  assert.ok(
    await page
      .getByRole("button", { name: "Awaiting confirmation…", exact: true })
      .isDisabled(),
  );
  assert.ok(
    await page
      .getByRole("link", { name: "View pending transaction", exact: true })
      .isVisible(),
  );
  check(
    "Pending transaction disables repeat submissions and exposes the explorer link",
  );
  await client.request({ method: "evm_mine", params: [] });
  await client.request({ method: "evm_setAutomine", params: [true] });
  await page
    .getByText("points confirmed on Sepolia.", { exact: false })
    .waitFor({ timeout: 30000 });
  const rows = await client.readContract({
    address: contract,
    abi: artifact.abi,
    functionName: "getLeaderboard",
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].player.toLowerCase(), accounts[0].toLowerCase());
  assert.equal(rows[0].nickname, "Integration Hamster");
  assert.ok(rows[0].score > 0n);
  await page.screenshot({ path: `${output}/confirmed.png` });
  check(
    "Simulated submission executes a real local transaction, confirms receipt and refreshes the contract leaderboard",
  );
  await page
    .getByRole("button", { name: "Submit score on Sepolia", exact: true })
    .click();
  await page
    .getByText("Your on-chain best is already", { exact: false })
    .waitFor();
  check("Duplicate/lower score is caught before requesting a signature");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "View results", exact: true }).click();
  await page.getByRole("heading", { name: "Wheel, that happened." }).waitFor();
  assert.equal(
    await page.getByLabel("Leaderboard nickname", { exact: true }).inputValue(),
    "Integration Hamster",
  );
  assert.ok(
    await page.getByRole("button", { name: "Share score", exact: true }).isVisible(),
  );
  await page.getByRole("button", { name: "Close", exact: true }).click();
  check("A dismissed result reopens from the ended game with its nickname");
  await page.locator(".wallet-button").click();
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await page.getByRole("button", { name: "Connect", exact: true }).waitFor();
  await page
    .getByRole("table")
    .getByText("Integration Hamster", { exact: true })
    .waitFor();
  await page.reload();
  await page
    .getByRole("table")
    .getByText("Integration Hamster", { exact: true })
    .waitFor();
  check("Scores remain publicly readable after disconnecting and reloading");
  const maxWallet = createWalletClient({
    account: accounts[1],
    chain: sepolia,
    transport: http(rpcUrl),
  });
  const maxHash = await maxWallet.writeContract({
    address: contract,
    abi: artifact.abi,
    functionName: "submitScore",
    args: [1000000000n, "SirSqueeksalotTheGreates"],
  });
  await client.waitForTransactionReceipt({ hash: maxHash });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.reload();
    await page
      .getByRole("table")
      .getByText("1,000,000,000", { exact: true })
      .waitFor();
    const fit = await page.evaluate(() => {
      const row = [...document.querySelectorAll("tbody tr")].find((r) =>
        r.textContent.includes("SirSqueeksalotTheGreates"),
      );
      const [, name, score] = row.cells;
      return {
        doc: document.documentElement.scrollWidth,
        view: document.documentElement.clientWidth,
        nameScroll: name.scrollWidth,
        nameClient: name.clientWidth,
        scoreScroll: score.scrollWidth,
        scoreClient: score.clientWidth,
        scoreRight: score.getBoundingClientRect().right,
      };
    });
    assert.ok(fit.doc <= fit.view, `${width}: ${JSON.stringify(fit)}`);
    assert.ok(fit.nameScroll <= fit.nameClient, `${width}: ${JSON.stringify(fit)}`);
    assert.ok(fit.scoreScroll <= fit.scoreClient, `${width}: ${JSON.stringify(fit)}`);
    assert.ok(fit.scoreRight <= fit.view, `${width}: ${JSON.stringify(fit)}`);
    await page
      .getByRole("table")
      .screenshot({ path: `${output}/max-entry-${width}.png` });
  }
  check(
    "A MAX_SCORE entry with a 24-character nickname fits the board at 320 and 390",
  );
  assert.deepEqual(errors, []);
  check("No uncaught exceptions during transaction flow");
} catch (e) {
  report.errors.push(e.stack);
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await server?.close();
  anvil.kill("SIGTERM");
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}
