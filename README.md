# Squeek Run

A silly browser runner for a hamster with terrible fashion sense. Put a pressure
cooker on its head, hand it a toilet plunger, and try to survive the wheel.

This is an **unofficial community project for Squeekchain / the Buildooooor badge**.
There is no login, purchase, token reward, or wallet requirement to play.

## Delivery status

| Deliverable                                       | Status                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| Playable static website                           | Included in `dist/`, alongside complete source and lockfile              |
| Real Squeekchain integration                      | Uses the public Sepolia core and wheel telemetry APIs                    |
| Solidity leaderboard                              | Implemented, compiled and tested with Foundry; ABI and bytecode included |
| Wallet / score submission / public contract reads | Implemented and exercised against an isolated Anvil chain                |
| **Deployed Sepolia leaderboard address**          | **Not deployed; no address exists for this build**                       |
| **Live site URL**                                 | **Publication pending the assignment’s static-export publishing step**   |

No authorized funded Sepolia signer or signing service was supplied. Rather than
repeat the previous attempt’s input-only stop, this build provides the usable
game, tested contract and deployment tooling. `public/config.json` deliberately
has `leaderboardAddress: null`. The frontend states that the board is awaiting
deployment and disables submission. It never substitutes device scores or
invented players for a public leaderboard. The mandatory **live Sepolia
deployment remains unfinished**, and a public site URL cannot be stated before
publication. Local Anvil validation is not a Sepolia deployment.

## Install, run and rebuild

Use Node **22.18+** and npm. No environment file or private credential is needed.

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

`npm run build` produces `dist/index.html` and its assets. Publish the **entire
`dist/` directory**, not just the HTML. Vite uses `base: './'`; assets, fonts,
wallet marks, public configuration, favicon and share image are local and use
relative URLs. The only navigation uses page anchors, so static hosting needs no
rewrite rules. Preview through HTTP rather than opening a `file://` URL.

The assignment build installed dependencies in an external temporary build
directory, leaving no `node_modules` in this repository. A normal local `npm ci`
is sufficient for a contributor. Dependency and cache directories are ignored at
every nesting level; `dist/` is intentionally included. No vendored registry or
dependency archives are required.

## Play

- **Move:** left/right arrows or A/D; on touch, tap the left/right part of the
  game or use the arrow buttons.
- **Jump:** Space, up arrow, W, the center of the game, or the Jump button.
- **Pause:** P, Escape, or the pause control. Opening a dialog or switching to a
  background tab pauses an active run. Resume explicitly.
- **Collect:** sunflower seeds (10), arcade SQK coins (30), and lost socks (50).
  These are game points, not transferable SQK tokens.
- **Avoid:** cones, rogue toasters, and surprise poop. Jump or switch lanes. One
  collision ends the run. Speed increases gradually.
- **Replay / share:** the result dialog saves a device best, offers another run,
  and uses native sharing or copies your score and the page link.

Sound is opt-in. Reduced motion stops decorative spinning and running bobbing;
the game’s obstacle movement remains essential. Keyboard and tap controls are
supported, but this visual timing game does not have a nonvisual play mode.

## Dress irresponsibly

All **280 combinations** are drawn with Canvas during the run. No remote art
service or image asset download is needed.

| Slot           | Choices                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| Headwear       | Sunglasses (墨镜), pressure cooker (高压锅), traffic cone, banana peel, dunce cap, tiny crown, VR headset          |
| Handheld       | Sword, water gun, toilet brush (厕所刷), plunger (吸马桶的), giant spoon, rubber chicken, selfie stick, lightsaber |
| Optional extra | None, mustache, cape, tiny rocket backpack, googly eyes                                                            |

The default cooker + plunger outfit earns **+2 per collectible** (“Domestic
menace”). Crown + spoon and VR + lightsaber earn +3. Mustache + chicken earns +2.
Other outfits earn +1. These bonuses are intentionally tiny; a block boost
doubles the collectible’s base points plus the outfit bonus. Clothing cannot
change mid-run. Outfit and device best persist in local storage; storage failures
never prevent play.

## Real Squeekchain data

The brief permits either its named core contract or the public API. This build
chooses the API, with no API key:

- [`GET /v1/core`](https://api.squeekchain.com/v1/core): completed Squeek block
  height, settled work, settled round, next-block units, pause state, and source
  identity.
- [`GET /v1/status`](https://api.squeekchain.com/v1/status): wheel state, RPM,
  freshness, generation time, and telemetry provenance.

See the [official API schema](https://docs.squeekchain.com/developers/api/).
Polling runs every 15 seconds while visible, with an 8-second request timeout.
Failed requests retain last-known values with a stale label. Missing values show
unavailable, not zero. Old cached “online” telemetry is also treated as stale.
The spinning indicator requires a fresh active reading with nonzero RPM; idle
reads say “Snack break.” Non-hardware provenance is labeled test telemetry.

**Round progress and block progress are different.** The first-screen round bar
estimates elapsed time from API genesis time and round duration, using the local
clock (an accessible response Date header corrects it when available). The data
dialog separately shows settled progress toward the next Squeek block, computed
from the API’s block-unit denominator. It also shows settled work, RPM and the
full source contract address.

A higher completed block height, observed after the initial baseline and on the
same source identity, grants an active run **12 seconds of 2× collectible
points**. Initial load, unchanged height, a changed deployment, and reorg
recovery to an already-observed height do not award a boost. No timer or random
number pretends to be a new chain block. Multiple completed blocks in one poll
refresh one boost; boosts do not stack. Offline gameplay continues without new
block boosts.

During validation on 2026-10-31, the API reported core
`0x980b4424c007caf7a1f3670b48c8eaef7ebc3d44`, whereas the brief names
`0x74665dAecA35A2303e767E76a2FF1FB6F93e119f`. The app makes this distinction
visible and follows the explicitly allowed API source; it does not silently
claim to read the brief’s address directly. A changed API identity resets the
boost baseline. Counts use `bigint` rather than lossy floating-point arithmetic.

## On-chain leaderboard

[`contracts/src/SqueekLeaderboard.sol`](contracts/src/SqueekLeaderboard.sol)
stores a descending top 50 with player address, score and nickname. Each wallet
gets one row; only an improved personal best is accepted. Earlier entries win
ties. An evicted player’s personal best remains recorded. All loops are bounded
by 50 entries. Scores must be 1–1,000,000,000. Nicknames accept 1–24 ASCII letters,
digits, internal spaces, dots, dashes and underscores. No leading/trailing spaces.

There is no owner, upgradeability, game fee, payable function, or token transfer.
Anyone can call `getLeaderboard()` without connecting a wallet. The app reads it
directly over Sepolia RPC, checks chain/version/capacity, and refreshes every 30
seconds and after a confirmed submission. It never reads a hosted scores API.

After a run, a player connects, switches to Sepolia if necessary, chooses a
nickname and submits. The app checks their on-chain personal best, simulates the
call, requests a signature, waits for a successful receipt, then refreshes the
table. Rejection, pending, reverted and read-error states have recovery text.
Pending transaction hashes survive reloads. Nicknames and addresses are public;
the wallet shows the network fee in **Sepolia test ETH** before confirmation.

**Trust model:** the contract records player-reported scores; it does not prove
browser gameplay or prevent cheating and multiple-wallet entries. This is a
casual, no-prize arcade MVP. Do not attach monetary rewards to this contract
without redesigning score verification.

### Wallets

The single Connect control uses wagmi’s EIP-6963 discovery, named extension
icons, a generic browser-wallet fallback and Coinbase Wallet / Smart Wallet.
Phones also get links that open this page inside MetaMask, Coinbase Wallet,
Rabby or Phantom. There is no relay, WalletConnect project ID, or login. The
wrong-network action uses switch-chain with add-chain fallback. Connected
players can inspect/copy their full address or disconnect.

The mobile links follow the supplied connector reference; the Rabby command
was checked against its [universal-link handler](https://github.com/RabbyHub/rabby-mobile/blob/develop/apps/mobile/src/hooks/universalLink.ts).
Native wallet-app handoff and a real Coinbase passkey ceremony were not performed
on a physical phone during this build.

## After launch: deploy and enable the shared board

The site operator must supply an authorized wallet funded with Sepolia test ETH.
No private key belongs in this repository, static configuration or frontend.
Use Foundry with an existing encrypted keystore account or a hardware wallet.
The deployment script rejects chains other than Sepolia.

```sh
forge build --root contracts
forge test --root contracts -vv
npm run contract:artifact

# Set DEPLOYER_ACCOUNT to your existing Foundry keystore account name.
# The RPC is public. Foundry prompts for the keystore password.
forge script contracts/script/Deploy.s.sol:Deploy --root contracts \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
  --account "$DEPLOYER_ACCOUNT" --broadcast
```

For a hardware wallet, replace the account option with Foundry’s `--ledger`
option. Inspect the transaction in your wallet before authorizing it. The
repository contains no key or preselected deployer address.

Use the **real address and transaction hash from the confirmed deployment**:

```sh
npm run configure:leaderboard -- "$LEADERBOARD_ADDRESS" "$DEPLOYMENT_TX_HASH"
npm run typecheck
npm run build
```

`configure:leaderboard` verifies the RPC chain ID, successful creation receipt,
exact runtime bytecode against the delivered artifact, version and capacity. It
then updates `public/config.json` and `contracts/deployment.json`. It accepts no
zero address or unconfirmed made-up deployment. Rebuild and publish the updated
export, and replace the pending address/status above with the actual address and
site URL. Configuration in the static files is public and site-operator managed;
visitors cannot change it through the UI.

If changing RPC providers, set the public HTTPS endpoint in `public/config.json`.
The read client has a second public Sepolia endpoint as fallback. Do not put a
secret provider credential in public configuration.

## Checks and project map

```sh
npm run typecheck
npm test
forge test --root contracts -vv
npx playwright install chromium webkit
npm run test:browser
npm run test:browser -- --webkit
npm run test:chain-ui  # Requires the Foundry anvil executable.
```

Browser tests serve the committed export at `/preview/` and close their own
server. They use explicitly isolated fixtures for failure, boost and wallet
states. The transaction test deploys the included artifact to a temporary Anvil
instance; it never writes the local address into production configuration.

Actual results, design findings/fixes and remaining limitations are recorded in
[`artifacts/validation.md`](artifacts/validation.md). The final production
build, typecheck, 10 Node tests, 11 Foundry tests (including 256 fuzz cases),
Chromium and WebKit interaction checks, and local transaction flow passed.
The pinned design probe passed all 16 checks.

Revision checks (2026-10-31), run after the final source change: `npm run
typecheck` and `npm run build` succeeded; `npm test` 10/10; `forge test` 11/11;
`npm run test:browser` (Chromium) 17/17; `npm run test:chain-ui` 12/12 on
isolated Anvil, including two new checks: a dismissed result reopens from the
ended game's **View results** button with its nickname, and a contract-maximum
1,000,000,000 score with a 24-character unbroken nickname fits the leaderboard at
320 and 390 wide (document scrollWidth equals clientWidth). Against the previous
CSS the same check failed at 320 with document width 328. The design probe again
passed 16/16. WebKit runs were not repeated in this revision. Build warnings about an unused
dependency’s browser-externalized `node:worker_threads` import and a large main
chunk are recorded there; they are not claimed as runtime failures or omitted.

| Source                                                      | Purpose                                                                            |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/game/engine.ts`                                        | Render-independent runner simulation and scoring                                   |
| `src/game/art.ts`, `outfits.ts`                             | All locally drawn hamster/accessory/game artwork and bonuses                       |
| `src/lib/squeek.ts`, `src/hooks/useSqueek.ts`               | API validation, freshness, round timing, polling, block tracking                   |
| `src/lib/chain.ts`, `src/components/Wallet.tsx`             | Sepolia configuration, ABI, wallet discovery and connections                       |
| `src/hooks/useLeaderboard.ts`, `src/components/Results.tsx` | Public reads and transaction lifecycle                                             |
| `public/config.json`                                        | Public operator-set deployment configuration                                       |
| `contracts/`                                                | Foundry source, tests, deployment script, compiled runtime artifact                |
| `tests/`                                                    | Unit and browser/transaction validation; disposable output goes to `test/scratch/` |
| `DESIGN.md`                                                 | Implemented tokens, typography, components and responsive behavior                 |
| `dist/`                                                     | Complete production export                                                         |

`npm run assets:share` regenerates the PNG share card and touch icon from the
actual Canvas renderer after a build. Rebuild again to include those files in
the export. Fonts, wallet marks and design-reference attribution are documented
in [`THIRD_PARTY.md`](THIRD_PARTY.md); their licenses are retained in `licenses/`.
