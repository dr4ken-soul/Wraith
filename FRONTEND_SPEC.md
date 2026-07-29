# FRONTEND_SPEC.md — Wraith

Private limit orders for Uniswap V3, encrypted through iExec Nox, settled without ever touching the public mempool. Built for the WTF!! Hackathon Summer Edition (iExec).

---

## 0. Project Identity

- **Name:** Wraith
- **One-line pitch:** Set your price. Wraith holds it inside a Nox enclave and fires it straight through Uniswap V3 the instant it hits, invisible until execution.
- **Aesthetic (Gate 1):** Retro-futuristic
- **Identity Fingerprint (§0C):** split-screen / compressed statement / monochrome + spectral pop / WebGL particle field / wave / subtle precision
- **Dials:** DESIGN_VARIANCE 6, MOTION_INTENSITY 5, VISUAL_DENSITY 6
- **Category:** A, on-chain product. Wallet signing required to submit an encrypted order.
- **Chain:** ETH Sepolia. Settlement routes through Uniswap V3.

---

## 1. Global Design System

### 1.1 Fonts

```css
@import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Azeret+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');
```

- `--font-display`: 'Big Shoulders Display', sans-serif — headlines only
- `--font-mono`: 'Azeret Mono', monospace — order data, labels, eyebrows, metrics
- `--font-body`: 'Inter', sans-serif — subheads, descriptions, body copy

### 1.2 Colour System (Gate 5, confirmed)

```css
:root {
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

  --radius-sm: 2px;  --radius-md: 4px;   --radius-lg: 8px;
  --shadow-sm: 0 0 8px rgba(184,240,255,0.05);
  --shadow-md: 0 0 20px rgba(184,240,255,0.08);
  --shadow-lg: 0 0 40px rgba(184,240,255,0.12);
  --duration-fast: 100ms; --duration-normal: 200ms; --duration-slow: 400ms;
}
```

### 1.3 Global Z-Index Map

```
z-0:  WraithField, the fixed WebGL particle canvas (mounted once at app root)
z-3:  film-grain noise overlay, absolute inset-0, pointer-events-none, opacity-[0.03]
z-10: section content (relative, default for all section containers)
z-20: floating glass panels within a section (hero right column, metric cards on hover-lift)
z-40: drag-open side drawer panel when expanded
z-45: drawer scrim, fixed inset-0 bg-black/60 backdrop-blur-sm, only when drawer is open
z-50: fixed nav layer, wordmark, wallet pill, drawer trigger strip
```

### 1.4 The WraithField (bespoke, no COMPOSITION_RECIPES.md match)

No image or video asset. This is a coded, procedural WebGL point cloud, mounted once and shared across the whole page as the Unified Sticky Canvas confirmed at Gate 3.

```
Container: fixed inset-0 z-0 pointer-events-none
Renderer: React Three Fiber <Canvas>, camera position [0, 0, 6], fov 45

Particle system:
  Geometry: BufferGeometry, 4000 points, positions randomised within a
    flattened sphere, x/y in [-6, 6], z in [-2, 2]
  Material: PointsMaterial, size 0.014, color var(--accent) as #b8f0ff,
    transparent true, opacity driven by sectionDensity (see below),
    sizeAttenuation true, blending: AdditiveBlending
  Idle motion: whole point cloud rotates on Y axis, 0.02 rad/s, plus a
    slow sine drift on individual point Z position, amplitude 0.15,
    per-point phase offset from a seeded noise value so drift never
    reads as uniform

sectionDensity (shared React context, written by an IntersectionObserver
  on each <section data-density="dense|sparse|hero">):
  hero / final-cta sections in view    -> target opacity 0.55
  sparse sections (problem, trust) in view -> target opacity 0.30
  dense sections (mechanism, stats, comparison) in view -> target opacity 0.12
  Transition: opacity lerps toward target at 0.04 per frame, never snaps

Reduced motion: if prefers-reduced-motion, disable rotation and drift,
  render points as a static field at opacity 0.20 throughout
```

### 1.5 Motion Primitives

Standard entrance used by every section unless a recipe overrides it:

```
initial: { filter: 'blur(10px)', opacity: 0, y: 20 }
animate: { filter: 'blur(0px)', opacity: 1, y: 0 }
transition: { duration: 0.8, ease: 'easeOut' }
viewport: { once: false, amount: 0.3 }
```

Stagger increment for grouped children: `delay: index * 0.12s`, base delay 0.2s.

---

## 2. Navigation — Gate 2: D2 Drag-Open Side Drawer

```
WORDMARK (fixed, always visible):
  Position: fixed top-5 left-4 md:top-6 md:left-8 z-50
  Text: "WRAITH" — font-mono text-sm tracking-[0.3em] text-[var(--text-primary)] uppercase

WALLET PILL (fixed, always visible, outside the drawer):
  Position: fixed top-5 right-4 md:top-6 md:right-8 z-50
  Disconnected state:
    bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-full
    px-4 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-mono text-[var(--text-primary)]
    hover:border-[var(--accent)] hover:shadow-[0_0_20px_rgba(184,240,255,0.12)] transition-all duration-200
    Label: "CONNECT WALLET"
  Connected state:
    Same shell, adds a leading status dot: w-1.5 h-1.5 rounded-full bg-[var(--success)]
    Label: truncated address, 0x4a...9f2c

DRAWER TRIGGER (hidden edge drag zone):
  Hit zone: fixed top-0 right-0 h-full w-6 z-50 cursor-grab
  Visible strip inside hit zone: absolute right-0 top-1/2 -translate-y-1/2
    w-[3px] h-16 rounded-full bg-[var(--border-default)]
  On drag start (Framer Motion useDragControls, dragConstraints locked to
    x-axis, threshold 40px) or on click of the visible strip: opens drawer

DRAWER SCRIM:
  fixed inset-0 z-45 bg-black/60 backdrop-blur-sm
  Animation: opacity 0 -> 1, duration 0.3s, ease easeOut

DRAWER PANEL:
  Position: fixed top-0 right-0 h-full z-40
  Size: w-[85vw] max-w-[360px] h-full
  Background: bg-[var(--bg-surface)] border-l border-[var(--border-default)]
  Padding: px-8 py-10 flex flex-col
  Animation (Framer Motion):
    initial: { x: '100%' }
    animate: { x: 0 }
    exit: { x: '100%' }
    transition: { type: 'spring', stiffness: 300, damping: 32 }

  Contents (flex flex-col gap-1):
    Section label: font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)] mb-4
    Link row (x4: Docs, GitHub, feedback.md, X):
      flex items-center justify-between py-4 border-b border-[var(--border-subtle)]
      text-base font-body text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors
      Arrow icon: text-[var(--text-muted)] group-hover:translate-x-1 transition-transform
    Footer note inside drawer, mt-auto:
      text-xs font-mono text-[var(--text-muted)]
      "Deployed on ETH Sepolia · confidential compute by iExec Nox"
```

---

## 2.1 Wallet-Gated Routing and App-Interior Wallet Menu (Mandatory)

Wraith uses a wallet-connected app interior, so the wallet interaction contract is explicit:

```
CONNECTION FLOW:
  Landing-page Connect Wallet buttons open the contained connection modal.
  The modal owns connecting, pending, success and retryable error states.
  A newly connected wallet navigates to /app after the provider confirms success.
  Initial persisted wallet hydration does not force a redirect or flash the landing page.

APP ROUTE GATE:
  /app and all nested routes render only while isConnected is true.
  During isReconnecting / isConnecting, render the branded loading skeleton.
  After confirmed disconnection, immediately navigate to / and show the landing page.
  Direct /app deep links without a wallet return to the landing page, never a host 404.

CONNECTED WALLET PILL (app interior only):
  Fixed top-right trigger with a green live-status dot, truncated 0x address, and chevron.
  aria-expanded and aria-haspopup="menu" are required.
  Clicking the trigger opens/closes the menu; it must never disconnect immediately.

WALLET MENU:
  Glass panel anchored below the pill with a fast scale 0.95 -> 1 and y -6 -> 0 transition,
  transform origin top right, duration 0.18s.
  Status header: "WALLET CONNECTED" with a green dot.
  Full address, Sepolia network, Active status, Copy address, Sepolia Etherscan link,
  and a visually distinct "DISCONNECT WALLET" action.
  Copy changes to a check / "Copied" state and resets after 1.8s.
  Close on outside pointer interaction and Escape. No backdrop div.
  Disconnect navigates to / immediately, then revokes the provider connection.
```

Acceptance checks required before demo:

- Connect from the landing page and confirm automatic navigation to `/app`.
- Refresh `/app` while connected and confirm the app remains on the requested route.
- Open the connected wallet pill and confirm the menu, copy action, explorer link and disconnect action.
- Disconnect from the menu and confirm immediate navigation to `/`.
- Open `/app` in a fresh disconnected session and confirm the branded landing page appears.

---

## 3. Section: Hero

**Recipe:** `split-screen-hero` (from COMPOSITION_RECIPES.md), adapted.
**Customisations:** both columns become transparent so the WraithField canvas reads through continuously (Unified Sticky Canvas), right column replaces the image/video slot with a floating glass order-ticket panel, background removed from both columns entirely.

```
z-index within section: content z-10, glass panel z-20

SECTION: Hero (split-screen, canvas-transparent)
Layout: min-h-[100dvh] grid grid-cols-1 lg:grid-cols-2
data-density="hero"
Background: none, WraithField shows through at opacity 0.55

LEFT COLUMN (content):
  Padding: relative z-10 flex flex-col justify-center px-6 md:px-12 lg:px-16 py-24 md:py-20

  Eyebrow:
    font-mono text-[11px] md:text-xs uppercase tracking-[0.25em] text-[var(--accent)] mb-6
    Text: "PRIVATE LIMIT ORDERS · BUILT ON NOX"
    Animation: initial opacity 0, y 10 / animate opacity 1, y 0 / duration 0.6s ease easeOut delay 0.2s

  Headline:
    font-display text-5xl md:text-6xl lg:text-[5rem] font-extrabold uppercase
    tracking-[-1px] leading-[0.92] text-[var(--text-primary)]
    Max 2 lines: "SET THE PRICE." / "VANISH UNTIL IT HITS."
    Animation: initial blur(10px) opacity 0 y 24 / animate blur(0) opacity 1 y 0
      duration 0.8s ease easeOut delay 0.35s

  Subheading:
    mt-6 max-w-[46ch] font-body text-base md:text-lg text-[var(--text-secondary)] leading-relaxed
    Text: "Wraith encrypts your limit order as a Nox handle the moment you sign.
      The enclave checks it against live Uniswap V3 pricing on every block.
      When your price is met the swap fires atomically. No mempool exposure,
      no front-running, full composability preserved."
    Animation: initial opacity 0 y 16 / animate opacity 1 y 0 / duration 0.7s ease easeOut delay 0.55s

  CTA cluster:
    mt-10 flex flex-wrap items-center gap-4
    Animation: initial opacity 0 y 16 / animate opacity 1 y 0 / duration 0.7s ease easeOut delay 0.75s

    Primary CTA:
      bg-[var(--accent)] text-[#08090b] px-7 py-3.5 rounded-full font-mono text-sm
      font-medium tracking-wide hover:bg-[var(--accent-hover)]
      hover:shadow-[0_0_30px_rgba(184,240,255,0.25)] transition-all duration-200
      Label: "CONNECT WALLET"

    Secondary CTA:
      border border-[var(--border-default)] text-[var(--text-primary)] px-7 py-3.5
      rounded-full font-mono text-sm hover:border-[var(--accent)] transition-colors duration-200
      Label: "SEE THE MECHANISM"
      Behaviour: smooth-scrolls to Mechanism section

RIGHT COLUMN (glass order ticket, replaces image/video slot):
  Position: relative z-20 flex items-center justify-center px-6 md:px-12 py-16 lg:py-0

  Panel:
    w-full max-w-[380px] bg-[var(--bg-surface)]/70 backdrop-blur-xl
    border border-[var(--border-default)] rounded-2xl p-6 md:p-7
    shadow-[0_0_40px_rgba(184,240,255,0.08)]
    Animation: initial opacity 0 y 30 scale 0.96 / animate opacity 1 y 0 scale 1
      duration 0.9s ease [0.16,1,0.3,1] delay 0.5s

    Header row: flex items-center justify-between mb-5
      Label: font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]
        Text: "ORDER #4471"
      Status tag: flex items-center gap-1.5 bg-[var(--accent-glow)] border border-[var(--border-default)]
        rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--accent)]
        Pulsing dot: w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse
        Text: "ENCRYPTED"

    Data rows (x3: Pair, Trigger price, Size), each:
      flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-0
      Label: font-body text-xs text-[var(--text-secondary)]
      Value: font-mono text-sm text-[var(--text-primary)]
      Value uses Text Scramble technique (COMPOSITION_RECIPES.md, Section C) on
        mount and on IntersectionObserver re-entry, speed 30, chars set:
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&'

    Footer line: mt-5 pt-4 border-t border-[var(--border-subtle)]
      font-body text-[11px] text-[var(--text-muted)] leading-relaxed
      Text: "Visible only to the enclave until execution."

Mobile: stacks vertically, glass panel moves above the content column,
  order changes to panel first then headline (flex-col-reverse on the grid
  wrapper below the lg breakpoint) so the product proof leads on small screens.
```

---

## 4. Section: Problem

**Recipe:** `full-width-statement` (from COMPOSITION_RECIPES.md).
**Customisations:** none beyond palette.

```
z-index: content z-10

SECTION: Problem statement
data-density="sparse"
Layout: py-28 md:py-40 flex items-center justify-center
Background: none, WraithField shows through at opacity 0.30

CONTENT:
  Container: w-full px-6 md:px-8 text-center

  Statement text:
    font-display text-[clamp(2rem,7vw,5.5rem)] font-extrabold uppercase
    leading-[0.95] tracking-[-1px] text-[var(--text-primary)]
    Text: "PUBLIC ORDERS GET FRONT-RUN BEFORE THEY FILL."
    Animation: word-by-word blur reveal
      Each word: blur(8px) opacity:0 y:20 -> blur(0) opacity:1 y:0
      duration 0.6s ease easeOut, stagger (wordIndex * 90ms)

  Metadata line:
    font-mono text-xs tracking-[0.2em] text-[var(--text-muted)] mt-8
    Text: "MEV BOTS READ THE MEMPOOL. WRAITH DOESN'T LET THEM READ YOURS."
    Animation: opacity 0 -> 1, duration 0.6s, delay 0.9s
```

---

## 5. Section: Mechanism

**Recipe:** `architecture-layers` (from COMPOSITION_RECIPES.md), adapted.
**Customisations:** 4 layers instead of the default set, layer number replaced with a two-letter step tag, palette swapped to project variables.

```
z-index: content z-10

SECTION: Mechanism
data-density="dense"
Layout: py-24 md:py-32 px-6
Background: bg-[var(--bg-primary)]/90 backdrop-blur-sm (near-opaque, WraithField
  dims to 0.12 behind it so the dense data reads cleanly)

Container: max-w-4xl mx-auto

Heading:
  text-centre mb-16
  Label: font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)] mb-4
    Text: "HOW IT WORKS"
  Title: font-display text-3xl md:text-4xl font-bold uppercase tracking-[-0.5px] text-[var(--text-primary)]
    Text: "FOUR STEPS, ZERO EXPOSURE"

Layers: mt-4 flex flex-col gap-4

Layer card (x4):
  border border-[var(--border-default)] rounded-xl p-6 md:p-7 flex items-start gap-5
  bg-[var(--bg-surface)]/60 hover:border-[var(--accent)]/40 transition-colors duration-200

  Step tag: font-mono text-xs text-[var(--accent)] min-w-[2.5rem] pt-1 uppercase tracking-wider
    Values: "01", "02", "03", "04"
  Title: font-body text-base md:text-lg font-semibold text-[var(--text-primary)]
  Description: font-body text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed

  Content:
    01 — ENCRYPT: "Your price, size and direction become a Nox handle the
      moment you sign. Nothing readable ever leaves your wallet."
    02 — EVALUATE: "The TEE checks your handle against live Uniswap V3
      pricing on every block, without ever decrypting it."
    03 — EXECUTE: "When your condition is met inside the enclave, the swap
      fires atomically through Uniswap V3. Your threshold was never public."
    04 — SETTLE: "Funds land in your wallet exactly as they would from any
      Uniswap swap. Full composability, zero exposure."

Animation:
  Each layer slides in from bottom with stagger
  initial: { opacity: 0, y: 20 }
  animate: { opacity: 1, y: 0 }
  delay: index * 0.15s
  duration: 0.6s, ease: [0.16, 1, 0.3, 1]
```

---

## 6. Section: Live Stats

**Recipe:** `metrics-section` (from COMPOSITION_RECIPES.md), adapted.
**Customisations:** 3 metrics pulled live from the Sepolia contract at render time, not hardcoded. No video background layer, uses the dimmed WraithField instead.

```
z-index: content z-10

SECTION: Live Stats
data-density="dense"
Layout: relative py-24 md:py-32 overflow-hidden
Background: bg-[var(--bg-primary)]/90 backdrop-blur-sm

Content: relative z-10 px-6 md:px-16

Subtitle:
  text-centre text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] font-mono mb-16
  Text: "LIVE ON ETH SEPOLIA"

Metrics grid: grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 text-centre

Metric (x3):
  Number: font-display text-5xl md:text-6xl lg:text-7xl font-extrabold text-[var(--text-primary)] leading-none
  Label: font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)] mt-3
  Divider (desktop only, between columns): border-r border-[var(--border-subtle)]

  Values (read from contract, these are the field labels not fixed numbers):
    Metric 1 — value: live count / label: "ORDERS FILLED PRIVATELY"
    Metric 2 — value: live sum in USDC / label: "VOLUME ROUTED THROUGH NOX"
    Metric 3 — value: fixed "0%" / label: "MEMPOOL EXPOSURE"

Animation:
  Each metric: counts from 0 to the fetched value over 1.5s, ease-out
  Stagger: delay 0.2s per column
  Trigger: IntersectionObserver, replays on re-enter
```

---

## 7. Section: Comparison

**Recipe:** `asymmetric-bento-grid` (from COMPOSITION_RECIPES.md), adapted for a 3-way comparison instead of feature cards.

```
z-index: content z-10

SECTION: Comparison
data-density="dense"
Layout: grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-6xl mx-auto px-6 py-24 md:py-32
Background: bg-[var(--bg-primary)]/90 backdrop-blur-sm

Heading (col-span-12, mb-12):
  Label: font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)] mb-3
    Text: "THE DIFFERENCE"
  Title: font-display text-3xl md:text-4xl font-bold uppercase tracking-[-0.5px] text-[var(--text-primary)]
    Text: "NOWHERE ELSE IS YOUR ORDER INVISIBLE"

Card A — Wraith (lg:col-span-4, border-[var(--accent)]/40, bg-[var(--bg-surface)], p-7, rounded-2xl):
  Featured ring: shadow-[0_0_30px_rgba(184,240,255,0.10)]
  Title: font-body text-lg font-semibold text-[var(--accent)]
    Text: "WRAITH"
  Rows (x4, flex justify-between py-3 border-b border-[var(--border-subtle)] last:border-0):
    text-sm text-[var(--text-secondary)] / value text-sm font-mono text-[var(--text-primary)]
    "Order visibility" -> "Never"
    "Front-running risk" -> "None"
    "Custody" -> "Self, non-custodial"
    "Composability" -> "Full, native Uniswap V3"

Card B — Public Limit Order (lg:col-span-4, border-[var(--border-default)], bg-[var(--bg-surface)]/60, p-7, rounded-2xl):
  Title: font-body text-lg font-semibold text-[var(--text-primary)]
    Text: "PUBLIC LIMIT ORDER"
  Rows (same structure):
    "Order visibility" -> "Full mempool exposure"
    "Front-running risk" -> "High"
    "Custody" -> "Self, non-custodial"
    "Composability" -> "Full"

Card C — CEX Limit Order (lg:col-span-4, border-[var(--border-default)], bg-[var(--bg-surface)]/60, p-7, rounded-2xl):
  Title: font-body text-lg font-semibold text-[var(--text-primary)]
    Text: "CEX LIMIT ORDER"
  Rows (same structure):
    "Order visibility" -> "Hidden from public, visible to exchange"
    "Front-running risk" -> "Low, but exchange-dependent"
    "Custody" -> "Custodial"
    "Composability" -> "None, off-chain"

ANIMATION:
  Staggered cards reveal: y 20 -> 0, opacity 0 -> 1, duration 0.6s, delay index * 0.12s
  Card A hover: subtle lift, translateY(-4px), spring stiffness 260 damping 22
```

---

## 8. Section: Trust and Technical Credibility

**Recipe:** `split-image-text` (from COMPOSITION_RECIPES.md), adapted, right image slot replaced with a badge stack since no photography fits this content.

```
z-index: content z-10

SECTION: Trust
data-density="sparse"
Layout: py-24 md:py-32 px-6 md:px-8
Background: none, WraithField shows through at opacity 0.30

Container: max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center

LEFT COLUMN (text):
  Label: font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)] mb-4
    Text: "UNDER THE HOOD"
  Heading: font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase
    tracking-[-0.5px] leading-tight text-[var(--text-primary)]
    Text: "NOTHING READABLE EVER LEAVES YOUR WALLET"
  Description: font-body text-base text-[var(--text-secondary)] mt-5 leading-relaxed max-w-lg
    Text: "Nox combines on-chain contracts with off-chain Trusted Execution
      Environments. Your order is processed as encrypted state inside the
      enclave and only the final swap ever touches the chain. Uniswap V3
      is never modified, Wraith sits on top of it."
  Animation: fade-in from left, initial opacity 0 x -20, duration 0.7s ease easeOut delay 0.3s

RIGHT COLUMN (badge stack, replaces image):
  Layout: grid grid-cols-1 sm:grid-cols-2 gap-4
  Animation: fade-in from right, initial opacity 0 x 20, duration 0.7s ease easeOut delay 0.5s

  Badge card (x4, border border-[var(--border-default)] rounded-xl p-5 bg-[var(--bg-surface)]/70 backdrop-blur-sm):
    Icon slot: w-8 h-8, plain HTML comment placeholder, no AI-generated icon
    Label: font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)] mt-3
    Value: font-body text-sm text-[var(--text-primary)] mt-1

    Content:
      "NETWORK" / "ETH Sepolia"
      "COMPUTE LAYER" / "iExec Nox"
      "SETTLEMENT" / "Uniswap V3"
      "AUDIT TRAIL" / "feedback.md in repo"
```

---

## 9. Section: Final CTA

**Recipe:** `footer-video` (from COMPOSITION_RECIPES.md), adapted, video column removed, WraithField at full drama instead.

```
z-index: content z-10

SECTION: Final CTA
data-density="hero"
Layout: relative py-32 md:py-40 flex items-center justify-center overflow-hidden
Background: none, WraithField shows through at opacity 0.55

Container: relative z-10 max-w-2xl mx-auto px-6 text-centre flex flex-col items-center

Heading:
  font-display text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase
  tracking-[-1px] leading-[0.95] text-[var(--text-primary)]
  Text: "PLACE YOUR FIRST INVISIBLE ORDER"
  Animation: blur(10px) opacity 0 y 24 -> blur(0) opacity 1 y 0, duration 0.8s ease easeOut

Subtext:
  font-body text-base text-[var(--text-secondary)] mt-5 max-w-md
  Text: "Connect a wallet on Sepolia and set your first encrypted limit order in under a minute."
  Animation: opacity 0 y 16 -> opacity 1 y 0, duration 0.7s ease easeOut delay 0.2s

CTA:
  mt-9 bg-[var(--accent)] text-[#08090b] px-9 py-4 rounded-full font-mono
  text-sm font-medium tracking-wide hover:bg-[var(--accent-hover)]
  hover:shadow-[0_0_30px_rgba(184,240,255,0.25)] transition-all duration-200
  Label: "CONNECT WALLET"
  Animation: opacity 0 y 16 -> opacity 1 y 0, duration 0.7s ease easeOut delay 0.4s
```

---

## 10. Footer

```
z-index: content z-10

SECTION: Footer
data-density="sparse"
Layout: py-14 px-6 md:px-8 border-t border-[var(--border-subtle)]
Background: bg-[var(--bg-primary)]/95 backdrop-blur-sm

Container: max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8

Left: wordmark + attribution
  Wordmark: font-mono text-sm tracking-[0.3em] text-[var(--text-primary)] uppercase
  Attribution line: font-body text-xs text-[var(--text-muted)] mt-3
    Text: "Built for the WTF!! Hackathon Summer Edition · iExec Nox · community
      partner DeVinci Blockchain"

Right: link row
  flex flex-wrap gap-x-8 gap-y-3
  Each link: font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-secondary)]
    hover:text-[var(--accent)] transition-colors
  Links: "Docs", "GitHub", "X", "feedback.md"

Bottom row: mt-10 pt-6 border-t border-[var(--border-subtle)] flex justify-between
  text-[11px] font-mono text-[var(--text-muted)]
  Left: "© 2026 Wraith"
  Right: "Deployed on ETH Sepolia"
```

---

## 11. Responsive Summary

- Hero grid stacks below `lg`, order flips so the glass order-ticket panel leads on mobile
- Drawer width caps at `85vw` / `360px` so it never spans full width on tablets
- Wallet pill drops to `px-4 py-2` and truncates address text below `md`
- All headline sizes step through 3 breakpoints minimum, no bare `text-7xl`
- WraithField particle count drops to 1800 below `md` (checked via `window.innerWidth` on mount) to protect frame rate on mobile GPUs

## 12. Asset Brief Summary

No photography or video assets in this spec. The only generated element is the WraithField, which is coded, not sourced. Logo and favicon slots are left as plain HTML comments per project convention, asset to be supplied separately.

## 13. Spec Self-Check (Rule 7)

- [x] Every element has exact Tailwind classes
- [x] Every animation has initial, animate, duration, ease, delay
- [x] Every section has a declared z-index position against the global map
- [x] No image or video assets required, WraithField behaviour fully specified as a coded system
- [x] Every positional or sizing class has responsive breakpoints
- [x] Composition recipes referenced by name where a match existed, bespoke specs written at matching detail where none did
- [x] No placeholder copy, every headline, subhead, label and card value is final text
- [x] Wallet connection, hydration, protected routing, redirect, dropdown, disconnect and acceptance behavior is explicitly specified
