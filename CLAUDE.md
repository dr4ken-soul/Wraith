# Wraith — Agent Context

## What This Is

Wraith is a private limit order engine for Uniswap V3. A trader sets a price, a size and a direction, the order is encrypted client-side into a Nox handle and submitted to a vault contract. A keeper checks the order against live Uniswap V3 pricing by asking the Nox enclave to compare the current price against the encrypted trigger, without ever decrypting the trigger itself. Only when the condition is met does that single order's price and size become decryptable, at which point the vault executes an ordinary Uniswap V3 swap and funds settle straight to the trader's wallet.

Built for the WTF!! Hackathon Summer Edition, iExec Nox, submission window 5 July to 1 August 2026, deadline 1 August 2026 22:59.

---

## One-Line Pitch

Set your price. Wraith holds it inside a Nox enclave and fires it straight through Uniswap V3 the instant it hits, invisible until execution.

---

## MVP Features

1. Encrypted order submission — trigger price and size are encrypted client-side via the Nox JS SDK before ever reaching the chain, pair and direction stay plaintext
2. Confidential trigger evaluation — the keeper feeds the live, already-public Uniswap V3 price into the enclave, which compares it against the encrypted trigger and returns a result nobody can read until it is deliberately made public
3. Non-custodial private execution — the vault never holds a standing balance, it pulls exactly the triggered amount via a pre-existing approval, swaps through Uniswap V3, forwards the output straight to the trader
4. Order ticket dashboard — a connected wallet reads and decrypts only its own orders, filtered on-chain by `msg.sender`, no off-chain database exists to leak anything

Post-hackathon, not in MVP: a protocol fee and treasury wallet, encrypting trade direction as well as price and size, multi-hop routing, order modification beyond cancel and resubmit, mainnet deployment, gas abstraction.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Animation | motion/react |
| 3D | React Three Fiber, @react-three/drei |
| Wallet | wagmi + viem |
| Confidential compute | Nox Solidity library (`@iexec-nox/nox-protocol-contracts`), `@iexec-nox/handle` JS SDK |
| Contracts | Solidity 0.8.27, Hardhat, based on the official `nox-hardhat-starter` |
| Settlement | Uniswap V3 periphery, router address resolved from Uniswap's official Sepolia deployment docs, never hardcoded from memory |
| Chain | Ethereum Sepolia |
| Keeper | Node.js, viem, `@iexec-nox/handle` |
| Database | None. Every read comes straight off the chain |
| Hosting | Vercel |

No off-chain index of any kind. If it is not readable from `getMyOrders()` or a contract event, it does not exist as far as Wraith's frontend is concerned.

---

## Project Structure

```
wraith/
├── contracts/
│   ├── contracts/
│   │   └── WraithVault.sol           (Order struct, submit, cancel, evaluate, trigger, execute)
│   ├── scripts/
│   │   └── deploy.ts
│   ├── test/
│   ├── hardhat.config.ts
│   └── package.json
├── keeper/
│   └── src/
│       ├── price.ts                  (Uniswap V3 slot0 reader)
│       ├── evaluate.ts               (requestEvaluation + publicDecrypt poll)
│       ├── execute.ts                (markTriggered + executeOrder)
│       ├── index.ts                  (poll loop entrypoint)
│       └── abi/
├── web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              (landing page)
│   │   │   ├── app/
│   │   │   │   ├── page.tsx          (wallet-gated order dashboard)
│   │   │   │   └── orders/new/page.tsx
│   │   │   └── layout.tsx            (WagmiProvider, WraithField mount)
│   │   ├── components/
│   │   │   ├── three/
│   │   │   │   └── WraithField.tsx   (procedural particle canvas, unified sticky)
│   │   │   ├── layout/
│   │   │   │   └── Nav.tsx           (D2 drag-open drawer, fixed wallet pill)
│   │   │   └── sections/
│   │   │       ├── Hero.tsx
│   │   │       ├── Problem.tsx
│   │   │       ├── Mechanism.tsx
│   │   │       ├── LiveStats.tsx
│   │   │       ├── Comparison.tsx
│   │   │       ├── Trust.tsx
│   │   │       ├── FinalCta.tsx
│   │   │       └── Footer.tsx
│   │   ├── hooks/
│   │   │   └── useSubmitOrder.ts     (encryptOrderInputs wrapper)
│   │   ├── lib/
│   │   │   └── wagmi.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── public/
│   │   ├── logo.svg                  (not yet provided, comment slot until then)
│   │   └── favicon.ico               (not yet provided, comment slot until then)
│   ├── tailwind.config.ts
│   └── package.json
├── feedback.md                       (required hackathon deliverable, written near the end)
└── README.md
```

---

## Design System

All seven gates confirmed, do not deviate from any value below.

**Aesthetic:** Retro-futuristic
**Identity fingerprint:** split-screen / compressed statement / monochrome plus a single spectral pop / WebGL particle field / wave section rhythm / subtle precision motion

**Fonts:**
- Display: Big Shoulders Display
- Body: Inter
- Mono: Azeret Mono

```css
@import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Azeret+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');
```

**Colour palette:**
```css
--bg-primary:     #08090b;
--bg-secondary:   #0d0f12;
--bg-surface:     #131519;
--bg-elevated:    #191c21;
--accent:         #b8f0ff;
--accent-hover:   #d4f7ff;
--accent-glow:    rgba(184, 240, 255, 0.10);
--text-primary:   #ececec;
--text-secondary: #8d9096;
--text-muted:     #4a4d52;
--border-subtle:  rgba(184, 240, 255, 0.05);
--border-default: rgba(184, 240, 255, 0.10);
--success:        #7ee89a;
--error:          #ff5c7a;
```

**Nav:** D2 drag-open side drawer. No hamburger icon, the right viewport edge is a hidden drag zone with a thin visible strip. Wordmark fixed top-left, Connect Wallet pill fixed top-right, both always visible outside the drawer. Drawer holds only secondary links: Docs, GitHub, feedback.md, X.

**WraithField:** the site's one visual asset, and it is coded, not sourced. A procedural WebGL point cloud mounted once at the app root, fixed across the whole page as a Unified Sticky Canvas. Opacity shifts by section density, 0.55 behind hero and final CTA, 0.30 behind sparse sections, 0.12 behind dense data sections. Full spec in FRONTEND_SPEC.md Section 1.4.

---

## Landing Page Sections (in order)

1. **Hero** — split-screen, headline and CTA left, floating glass order-ticket panel right with text-scramble encrypted values
2. **Problem** — one full-width statement, mempool front-running
3. **Mechanism** — four architecture-layer cards, encrypt, evaluate, execute, settle
4. **Live stats** — three metrics, two live from the contract, one fixed at 0% mempool exposure
5. **Comparison** — three-way card grid, Wraith against a public limit order against a CEX limit order
6. **Trust** — Nox, Sepolia and Uniswap V3 badge stack, no photography
7. **Final CTA** — crescendo, WraithField at full opacity again
8. **Footer** — wordmark, hackathon attribution, links

Full section-by-section spec with exact classes, copy and animation values lives in FRONTEND_SPEC.md, this list is the map, not the territory.

---

## Logo and Favicon

Neither exists yet. Leave both as plain comment slots:

```tsx
{/* Logo slot: replace with public/logo.svg once provided */}
```

```html
<!-- Favicon slot: replace with public/favicon.ico once provided -->
```

Never substitute a hardcoded placeholder, an AI-generated icon or an emoji in either slot.

---

## Nox Integration

Nox's Runner is event-driven, triggered by on-chain calls through an Ingestor and NATS queue, not a continuous per-block watcher. Every evaluation is a two-phase request and fulfilment pattern, request in one call, poll `publicDecrypt` until the Runner has processed it, never assume a synchronous answer in the same transaction. Full function-level detail is in APP_BLUEPRINT.md, the shape to remember:

```
encrypt (client)     handleClient.encryptInput(value, 'uint256', vaultAddress)
submit (contract)    Nox.fromExternal → euint256, Nox.allowThis, Nox.allow(owner)
evaluate (contract)  Nox.toEuint256(livePrice), Nox.ge / Nox.le → ebool, Nox.allowPublicDecryption
read (keeper)         handleClient.publicDecrypt(resultHandle)
trigger (contract)   Nox.allowPublicDecryption(order.amountIn), only this one order
execute (contract)   pull via approve/transferFrom, swap via Uniswap V3, forward to owner
```

Direction (`triggerAbove`) stays plaintext in MVP, this is a stated scoping decision, not an oversight, see APP_BLUEPRINT.md's "What Is Not Being Built" section.

---

## Code Rules (follow without exception)

**Solidity:**
- NatSpec comments on every external and public function
- Never hardcode the Uniswap router address, read it from an immutable set in the constructor
- Restrict `requestEvaluation`, `markTriggered` and `executeOrder` to the `keeper` address, checked with a `require`
- Wrapping arithmetic in Nox operations is expected behaviour, not a bug, do not add redundant overflow checks on top of it

**TypeScript / React:**
- camelCase for all variables and functions
- JSDoc comments on every function and custom hook
- CSS variables from the design system used directly, never hardcoded hex values in component files
- CSS class-based hover states only, no inline `onMouseEnter` or `onMouseLeave`
- Framer Motion for all entrance animations, imported from `motion/react`
- Blur-in entrance as the default: `initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}` animating to `{ opacity: 1, filter: 'blur(0px)', y: 0 }`
- Loading states use skeleton shimmer, never spinners
- Never use `localStorage` or `sessionStorage` anywhere in the frontend
- Never use JetBrains Mono anywhere in this project

**Writing rules (apply to all copy, labels, code comments, JSDoc, README, feedback.md):**
- British English throughout
- No em dashes anywhere
- Periods only when necessary
- Commas only when necessary
- Short direct sentences, no filler such as "seamlessly", "powerful", "cutting-edge", "unlock"
- Keeper logs are factual only, no celebration emoji, no ASCII art
- No lorem ipsum or placeholder copy anywhere, every headline and label in FRONTEND_SPEC.md is final text

---

## Never Do These

- Never let the trigger price or the size be readable in calldata, an event, or an off-chain store at any point before execution
- Never make more than one order's amount publicly decryptable at a time, only the order that has just triggered
- Never let the vault hold a standing balance, it pulls exactly the triggered amount and forwards it in the same flow
- Never store `KEEPER_PRIVATE_KEY` anywhere but the keeper's own environment, it never touches the frontend
- Never assume a Nox evaluation result is ready in the same transaction that requested it
- Never send trader command or order data to any service outside the chain and the Nox handle gateway itself

---

## Hackathon Checklist

- Project name: Wraith
- Hackathon: WTF!! Hackathon Summer Edition, iExec Nox, community partner DeVinci Blockchain
- Submission window: 5 July to 1 August 2026, deadline 1 August 2026 22:59
- Public GitHub repository, complete code, README with install and usage instructions
- Functional frontend end to end, no mock data
- Deployed on ETH Sepolia
- `feedback.md` in the repository root covering the real Nox developer experience
- Demo video, 4 minutes maximum
- X post tagging @iEx_ec with description, demo video and GitHub link
- Not a reused idea from the prior Vibe Coding Hackathon, this is a fresh build
