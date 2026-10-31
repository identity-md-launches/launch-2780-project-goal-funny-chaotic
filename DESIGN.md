# Squeek Run design system

## Overview

Squeek Run is a casual, humorous hamster runner for the Squeekchain community.
Its central visual idea is an oversized, hand-drawn hamster in a quiet little
exercise room, wearing completely inappropriate equipment. The scene supplies
the chaos; the surrounding interface stays calm and readable.

The game is the primary surface, with a compact live-data strip above it and a
wardrobe beside it on desktop. On small screens the game precedes customization.
The five-word heading and one explanatory sentence are deliberately short enough
to keep the product and **Start running** on the first 390px screen. There is no
separate marketing landing page.

The source of truth is [`src/styles.css`](src/styles.css), followed by the
component styles and Canvas drawing code in [`src/game/art.ts`](src/game/art.ts).

## Colors

The interface uses semantic CSS properties in a warm, light palette. No dark
theme is implemented.

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#f9f7ef` | Page background, inputs |
| `--surface` | `#fffdf7` | Neutral buttons, wardrobe choices, dialogs |
| `--ink` | `#29372c` | Primary text, illustration outlines |
| `--muted` | `#626c5e` | Supporting copy, labels |
| `--line` | `#d9ddd0` | Separators and neutral control outlines |
| `--accent` | `#cef16e` | Primary action background |
| `--accent-hover` | `#c1e75a` | Primary action hover |
| `--soft` | `#edf0e5` | Live-data strip and wallet rows |
| `--lavender` | `#e8e0f3` | Outfit combo explanation |
| `--error` | `#a33030` | Actionable error messages |
| `--success` | `#316243` | Confirmed transactions |
| `--focus` | `#493e87` | Keyboard focus perimeter |

Additional component colors are intentional: selected wardrobe choices use
`#edf4d8` with a `#6a803e` outline and a checkmark; the progress track/fill use
`#d4dcc7` / `#688344`; the logo’s green word uses `#5f7336`; numbered steps use
`#5e713c`. Game walls/floor are `#e8eddf` / `#dde5d5`. Fur, food and accessories
use their own flat illustrative colors; they do not encode interface state.

Calculated solid-color contrast pairs: ink/paper **11.67:1**, muted/paper
**5.12:1**, ink/accent **9.80:1**, logo-green/paper **4.90:1**, steps/paper
**5.02:1**, combo-text/lavender **9.77:1**. The focus color measures **8.43:1**
against paper and **7.08:1** against the primary action. These are measured token
pairs, not claims about every antialiased illustration pixel. The rendered probe
and accessibility results are in the validation record.

## Typography

- **Fredoka**, weight 600, `sans-serif` fallback: the brand, main heading, section
  headings and large score numerals. Local file: `public/fonts/fredoka.woff2`.
- **DM Sans**, weights 400, 600 and 700, `sans-serif` fallback: body copy, buttons,
  data and labels. The local `public/fonts/dm-sans.woff2` face is declared for
  weights 400–700; Google Fonts serves this same file for the three used weights.
- **System monospace**: full contract/player addresses only. Prose is never set
  in monospace. Chinese accessory captions fall back to the browser’s CJK face.

| Token | Size | Role |
| --- | --- | --- |
| `--sm` | 12px | Captions, metadata, control hints |
| `--body-sm` | 14px | Interface copy, buttons, data |
| `--body` | 16px | Inputs, subheadings, prominent controls |
| `--subhead` | 20px | Wardrobe title, smaller section headings |
| `--heading` | 32px | Section headings; mobile main heading |
| `--display` | 48px | Desktop main heading, result score |

There are at most six interface sizes and three weights. Headings use line-height
1.1 and tracking `-0.025em`; the mobile headline uses 1.12. Body copy uses 1.6,
captions 1.5. Headings balance wrapping; descriptions use `text-wrap: pretty`.
Addresses break anywhere so the entire value stays available. Changing scores,
timers and data use tabular numerals. Inputs remain 16px on phones. Font synthesis
is disabled, and both local faces are awaited in browser validation.

## Layout

The shared shell is at most **1240px**, with 40px minimum side gutters on wide
screens. At 1100px and below the gutters are 24px; at 540px and below they are
16px. The header, game, leaderboard and footer share those edges.

- Above 1100px: flexible game column plus a **326px** wardrobe, separated by 28px.
- 801–1100px: wardrobe is **290px**, gap 22px.
- At 800px: the wardrobe stacks below the game, navigation labels disappear,
  and the live strip becomes a two-row layout retaining all three data items.
- At 540px: phone layout, narrower heading, compact live strip, three wardrobe
  columns and a one-column leaderboard. Wallet selection becomes a bottom sheet.
- At 360px: controls and metadata compact further without hiding the primary
  action or the real-hamster indicator.

Game canvases are 480px tall on wide desktop, 450px on narrower desktop, 430px in
the stacked tablet layout, 330px on phones and 310px at the narrowest breakpoint.
Canvas resolution follows its CSS size with a device-pixel ratio capped at 2.
The animation loop waits for nonzero measured dimensions before drawing.

The wardrobe has three columns on desktop/phones and four on intermediate
stacked layouts. Its category controls sit above the choices. The leaderboard
places a device-best summary beside the public table on desktop and below it on
mobile; local scores never appear as on-chain entries. The fixed-layout table
uses a 50px rank column, a 128px score column (enough for the contract's
1,000,000,000 maximum) and a fluid name column; nicknames and player addresses
wrap anywhere and the row grows instead of scrolling the page.

Spacing is explicit in CSS: common within-group gaps are 6, 8 and 12px; section
and column gaps use 20–28px; major sections are separated by 36–54px. The interface
does not use fixed or sticky chrome that could obscure the game. Dialogs alone
occupy a higher layer. Browser validation covers 320, 390, 768 and 1440 CSS pixels;
native device zoom and physical-device behavior are separate limitations.

## Elevation & depth

The normal page is flat: tonal backgrounds and occasional 1px separators carry
structure, without card shadows or nested card surfaces. The only elevation
shadow is on dialogs (`0 24px 100px #17241930`), which have no border. Dialog
backdrops use `#1e2b2466`; the native modal top layer makes background content
inert. The Canvas uses flat fills, outlines and perspective rather than gradients
or image textures.

## Shapes

`--radius: 16px` is the game-scene radius. Primary/secondary controls and wardrobe
choices generally use 10px; the Start control and live strip use 12px; inputs and
keyboard controls use 8px. Desktop dialogs use 20px, phone dialogs 16px, and the
mobile wallet sheet has 20px top corners. The Connect control is pill-shaped;
utility icon buttons and the selected checkmark are circular. Only the visual
Canvas scene is clipped; addresses and informative text are not ellipsized.

## Components

| Pattern | Source | Behavior and reuse |
| --- | --- | --- |
| Primary/secondary/text/icon buttons | `src/styles.css`, `components/Icon.tsx` | One green primary action per active surface; neutral peers. Explicit hover/focus/active/disabled states. Icons use `currentColor`, 1.8px strokes, accessible names supplied by controls. |
| `GameBoard` | `components/GameBoard.tsx` | Ready, running, paused and ended states. Focusable control group; keyboard, pointer and touch buttons. HUD, Start, pause and feedback live inside the scene. The ended state stacks **Run again** (primary) over **View results** (secondary), which reopens the dismissed result dialog with its score and nickname. |
| `Wardrobe` | `components/Wardrobe.tsx` | Three category buttons with `aria-pressed`; native choice buttons with selected checkmarks. A disabled fieldset prevents outfit changes during play. Preview art uses the same drawing functions as the game. |
| `LiveStrip` | `components/LiveStrip.tsx` | Definition-list data, correctly nested progressbar and a text-backed spinning/idle/stale indicator. Detail action exposes source addresses and units. |
| `Leaderboard` | `components/Leaderboard.tsx` | Loading, deployment-pending, empty, filled, stale-read and retry states. Full address links; public reads never require a wallet. |
| `Modal` | `components/Modal.tsx` | Native `dialog.showModal()`, inert background, contained scrolling, Escape/backdrop/close-button dismissal and focus return. Maximum height tracks `100dvh`. |
| `Wallet` | `components/Wallet.tsx` | Named wallet rows with marks, pending/error states, four mobile app links, wrong-network switch and full connected-address view. Rows are at least 52px on mobile. |
| `Results` | `components/Results.tsx` | Run statistics, replay/share, labeled nickname field and inline validation. Submit moves through simulation, wallet confirmation, receipt pending, success or recoverable error. |

Reusable action classes are `.primary`, `.secondary`, `.text-button`,
`.icon-button`, `.button-row` and `.full`. Body text uses `.muted` and `.small`
only for their documented roles. `.address` preserves complete readable values.
Avoid inventing another button or caption scale for a new feature.

Keyboard focus is a 3px solid `--focus` outline with a 4px offset. Native controls
handle Tab, Enter and Space; game controls add arrows/A/D, Space/W/up and P/Escape.
The native dialog handles modal focus containment. Errors use inline text and
stable status regions; color alone never communicates selection or feed state.

Motion is opt-in through `prefers-reduced-motion: no-preference`: button
background/press transitions take 120ms with `cubic-bezier(.2,0,0,1)` and a pressed
scale of 0.96. A live wheel rotates only with fresh spinning telemetry. Reduced
motion removes that animation plus Canvas wheel rotation and hamster stride;
essential obstacle motion remains, with an explicit pause control. There is no
`transition: all`, decorative autoplay on the ready screen or default audio.

## Do’s and don’ts

- Start a new surface inside the existing shell and use the six-size scale.
  Place its controls before the content they change.
- Keep the visual joke in the hamster, accessories and low-stakes copy. Wallet,
  error and deployment states should say plainly what is happening.
- Use the green fill for the main action; retain text and icons for every status.
- Keep all required art, fonts and metadata assets local and URLs relative.
- Preserve complete addresses and data provenance. Do not fill unavailable
  leaderboard/feed states with sample data that appears live.
- Reuse `Modal`, `Icon` and existing action classes for another flow, then check
  its ready, pending, empty, success, failure and keyboard states at 390px.
- Do not attach scrolling, flashing, gradients, extra font families or layered
  card chrome to an already expressive game scene.

This document describes the implemented source, not a proposed redesign.
Review evidence and unperformed checks are in
[`artifacts/validation.md`](artifacts/validation.md). Design and documentation
guidance attribution is retained in [`THIRD_PARTY.md`](THIRD_PARTY.md).
