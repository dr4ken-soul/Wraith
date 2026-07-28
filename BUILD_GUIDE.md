# Wraith — Build Guide

## Before You Write a Single Line of Code

Read APP_BLUEPRINT.md and FRONTEND_SPEC.md in full. Every data structure, contract function and Nox call pattern is in APP_BLUEPRINT.md. Every class, animation value, z-index and piece of copy for the landing page is in FRONTEND_SPEC.md. This guide sequences the build, it does not repeat content that already exists at full fidelity elsewhere. Where a step says "as specified in X", go and read that section before writing the file, do not guess. CLAUDE.md, once written, becomes the persistent context file for future sessions and sits alongside this guide rather than replacing it.

---

## Prerequisites

```bash
node --version    # 18 or higher
npm --version     # 9 or higher
git --version     # any recent version
```

A Sepolia wallet funded with test ETH from a faucet such as `sepoliafaucet.com`, since deploying and testing consumes gas across every phase.

Clone the official Nox Hardhat starter as the reference project structure rather than hand-rolling a Hardhat config, the hackathon points to it directly and it already wires the correct plugin and network settings:

```bash
git clone https://github.com/iExec-Nox/nox-hardhat-starter wraith-contracts-reference
```

Treat it as a reference to copy configuration from, not a folder to build inside directly.

A WalletConnect Cloud project ID for wagmi, created at `cloud.walletconnect.com`.

---

## Repository Setup

```bash
mkdir wraith && cd wraith
git init
mkdir -p contracts/{contracts,scripts,test}
mkdir -p keeper/src
mkdir -p web/src/{app,components/{ui,layout,sections,three},lib,hooks,styles}
```

Root `.env` (copied into each package as needed, never committed):

```
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=
NEXT_PUBLIC_WRAITH_VAULT_ADDRESS=
NEXT_PUBLIC_UNISWAP_SWAP_ROUTER_ADDRESS=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
KEEPER_PRIVATE_KEY=
KEEPER_RPC_URL=
KEEPER_POLL_INTERVAL_MS=15000
```

---

## Phase 1 — Smart Contracts

### Step 1.1: Hardhat project setup

```bash
cd contracts
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox typescript ts-node @types/node
npm install @iexec-nox/nox-protocol-contracts @openzeppelin/contracts
npx hardhat init
```

Copy the network configuration, Solidity compiler version and any Nox-specific plugin registration from the cloned `nox-hardhat-starter` reference into `hardhat.config.ts`. Set the Sepolia network entry to read `KEEPER_RPC_URL` and a deployer private key from environment variables, never hardcoded.

---

### Step 1.2: WraithVault, storage and submission

Create `contracts/contracts/WraithVault.sol`. Implement the `Order` struct and `OrderStatus` enum exactly as specified in APP_BLUEPRINT.md, Data Structures section. Implement `submitOrder` and `cancelOrder` exactly as specified in the Nox Integration Detail section of APP_BLUEPRINT.md. `cancelOrder` requires `msg.sender == order.owner` and `order.status == OrderStatus.Open`, and never touches Nox handles since nothing needs decrypting to cancel.

Implement `getMyOrders()` as a view function that iterates orders and returns only those where `owner == msg.sender`. Keep it O(n) for the MVP order volume expected during a hackathon demo, do not over-engineer indexing here.

---

### Step 1.3: Evaluation and execution

Implement `requestEvaluation`, `markTriggered` and `executeOrder` exactly as specified in APP_BLUEPRINT.md. Import the Uniswap V3 `ISwapRouter` interface from `@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol` rather than redefining it. Store the router address as an immutable set in the constructor, read from the deployment script's environment, never hardcoded in source.

Restrict `requestEvaluation`, `markTriggered` and `executeOrder` to a single `keeper` address set in the constructor, checked with a `require(msg.sender == keeper)` modifier. This is a hackathon-scoped simplification, a production version would open evaluation to any address with an incentive to call it, noted in APP_BLUEPRINT.md under what is not being built.

---

### Step 1.4: Deployment script

Create `contracts/scripts/deploy.ts`:

```typescript
/**
 * Deploys WraithVault to the configured network, wiring the Uniswap V3
 * router address and keeper address from environment variables.
 * Prints the deployed address so it can be copied into .env for the
 * keeper and web packages.
 */
import { ethers } from 'hardhat'

async function main() {
  const swapRouter = process.env.NEXT_PUBLIC_UNISWAP_SWAP_ROUTER_ADDRESS
  const keeper = process.env.KEEPER_ADDRESS

  if (!swapRouter || !keeper) {
    throw new Error('missing swapRouter or keeper address in environment')
  }

  const WraithVault = await ethers.getContractFactory('WraithVault')
  const vault = await WraithVault.deploy(swapRouter, keeper)
  await vault.waitForDeployment()

  console.log('WraithVault deployed to:', await vault.getAddress())
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
```

Resolve the actual Sepolia Uniswap V3 `SwapRouter02` or `UniversalRouter` address from `docs.uniswap.org/contracts/v3/reference/deployments` at this point, per the note in APP_BLUEPRINT.md's tech stack table, and confirm the pool for the pair being demoed actually has liquidity on Sepolia before relying on it.

---

### Step 1.5: Deploy and verify

```bash
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat verify --network sepolia <deployed_address> <swapRouter> <keeper>
```

Copy the deployed address into `NEXT_PUBLIC_WRAITH_VAULT_ADDRESS` in both the keeper and web `.env` files. Confirm on `sepolia.etherscan.io` that the contract is verified before moving on, an unverified contract makes the demo video look unfinished.

---

## Phase 2 — Keeper Service

### Step 2.1: Keeper package setup

```bash
cd keeper
npm init -y
npm install viem @iexec-nox/handle dotenv
npm install --save-dev typescript tsx @types/node
```

---

### Step 2.2: Pool price reader

Create `keeper/src/price.ts`:

```typescript
/**
 * Reads the current price of a Uniswap V3 pool from its slot0 state.
 * This value is already public on-chain, reading it plainly is correct,
 * only the order's trigger threshold needs to stay encrypted.
 * @param poolAddress - the Uniswap V3 pool contract address
 * @param publicClient - a viem public client connected to Sepolia
 * @returns the current price as a uint256, in the same format the
 *          vault's stored triggerPrice values use
 */
import type { PublicClient } from 'viem'
import { poolAbi } from './abi/pool'

export async function getCurrentPrice(
  poolAddress: `0x${string}`,
  publicClient: PublicClient,
): Promise<bigint> {
  const [sqrtPriceX96] = (await publicClient.readContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: 'slot0',
  })) as [bigint, ...unknown[]]

  // Convert sqrtPriceX96 to the plain price format used across the
  // vault. Keep this conversion identical to whatever format the
  // frontend uses when the trader sets a trigger price, or the
  // comparison in requestEvaluation will be comparing two different scales.
  const price = (sqrtPriceX96 * sqrtPriceX96) >> 192n
  return price
}
```

---

### Step 2.3: Evaluation loop

Create `keeper/src/evaluate.ts`:

```typescript
/**
 * Requests a confidential evaluation for a single order, then polls
 * publicDecrypt until the enclave has processed it and returns the
 * plaintext boolean result. Nox's Runner is event-driven, not
 * synchronous, so this genuinely needs to poll rather than expect an
 * immediate answer in the same transaction.
 * @param orderId - the order to evaluate
 * @param currentPrice - the live pool price read via getCurrentPrice
 * @param handleClient - the Nox handle client for publicDecrypt calls
 * @param vaultContract - a viem contract instance for WraithVault
 * @returns true if the order's trigger condition has been met
 */
export async function evaluateOrder(
  orderId: bigint,
  currentPrice: bigint,
  handleClient: NoxHandleClient,
  vaultContract: WraithVaultContract,
): Promise<boolean> {
  const tx = await vaultContract.write.requestEvaluation([orderId, currentPrice])
  const receipt = await vaultContract.publicClient.waitForTransactionReceipt({ hash: tx })
  const resultHandle = extractHandleFromEvent(receipt, 'EvaluationRequested')

  // The Runner processes asynchronously. Poll with a short backoff
  // rather than assuming it is ready on the first read.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const decrypted = await handleClient.publicDecrypt(resultHandle)
      return Boolean(decrypted)
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  return false
}
```

---

### Step 2.4: Trigger and execute loop

Create `keeper/src/execute.ts`. Implement `triggerAndExecute(orderId)` which calls `markTriggered`, waits for the amount handle to become publicly decryptable using the same poll pattern as Step 2.3, reads the plaintext amount via `handleClient.publicDecrypt`, and calls `executeOrder(orderId, revealedAmount)`. Log the transaction hash and the amount executed, nothing more, following the writing rules, no celebration language, factual output only.

---

### Step 2.5: Keeper entrypoint

Create `keeper/src/index.ts`. Use `node-cron` or a plain `setInterval` reading `KEEPER_POLL_INTERVAL_MS` to loop over all open orders returned by `getMyOrders`-equivalent admin read, call `getCurrentPrice`, then `evaluateOrder`, then `triggerAndExecute` for any that return true. Wrap every iteration in a try/catch that logs and continues rather than crashing the process on a single order's failure.

---

## Phase 3 — Frontend

### Step 3.1: Next.js and Tailwind setup

```bash
cd web
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir=false
npm install motion lucide-react wagmi viem @tanstack/react-query
npm install three @react-three/fiber @react-three/drei
npm install @iexec-nox/handle
```

Translate the colour system and font imports from FRONTEND_SPEC.md, Section 1.1 and 1.2, into `tailwind.config.ts` and `src/styles/globals.css` exactly as written there, this is the one part of the spec that does get copied in full since it is foundational wiring, not section content.

---

### Step 3.2: Wallet provider setup

Create `src/lib/wagmi.ts` configuring the Sepolia chain, the RPC URL from `NEXT_PUBLIC_RPC_URL`, and WalletConnect using `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`. Wrap the app in `WagmiProvider` and `QueryClientProvider` in `src/app/layout.tsx`.

---

### Step 3.3: WraithField

Create `src/components/three/WraithField.tsx`. Implement exactly as specified in FRONTEND_SPEC.md, Section 1.4, including the `sectionDensity` context, the `IntersectionObserver` wiring per section, and the reduced-motion fallback. Mount it once in `layout.tsx`, not per-page, so it persists across route changes between `/` and `/app`.

---

### Step 3.4: Navigation

Create `src/components/layout/Nav.tsx`. Implement exactly as specified in FRONTEND_SPEC.md, Section 2, the wordmark, the fixed wallet pill wired to `useAccount` and `useConnect` from wagmi, and the drag-open drawer with its scrim and link rows.

---

### Step 3.5: Landing sections

One component file per section in `src/components/sections/`, implemented exactly as specified in the matching numbered section of FRONTEND_SPEC.md:

- `Hero.tsx` — Section 3
- `Problem.tsx` — Section 4
- `Mechanism.tsx` — Section 5
- `LiveStats.tsx` — Section 6, wire the two live metrics to real `getMyOrders`-adjacent contract reads, the third is the fixed `0%` value
- `Comparison.tsx` — Section 7
- `Trust.tsx` — Section 8
- `FinalCta.tsx` — Section 9
- `Footer.tsx` — Section 10

Assemble them in `src/app/page.tsx` in the order given in FRONTEND_SPEC.md Section 7 gate confirmation, nav then hero through footer.

---

### Step 3.6: Order encryption hook

Create `src/hooks/useSubmitOrder.ts` wrapping the `encryptOrderInputs` function exactly as specified in APP_BLUEPRINT.md's Nox Integration Detail. Wire it to a form at `src/app/app/orders/new/page.tsx`: pair selector, trigger price input, size input, direction toggle, calling `encryptOrderInputs` then `submitOrder` on the vault contract via wagmi's `useWriteContract`.

---

### Step 3.7: Order dashboard and wallet gate

Create `src/app/app/page.tsx` and a `ProtectedRoute` wrapper following the pattern in FRONTEND_SKILL.md Step 13, redirecting to `/` with a connect prompt if no wallet is connected. Call `getMyOrders()`, then for each order the connected wallet owns, decrypt `triggerPrice` and `amountIn` client-side via the Nox JS SDK `decrypt()` method, rendering the same glass order-ticket visual language from the hero, now live rather than illustrative.

---

### Step 3.8: Build and deploy

```bash
npm run build
vercel --cwd web
```

---

## Phase 4 — Quality Audit

Run through this list before recording the demo video.

**Contracts audit:**
- `submitOrder` produces a transaction with no readable price or amount in calldata, confirmed by reading it back on Sepolia Etherscan directly
- `cancelOrder` reverts correctly for a non-owner
- `requestEvaluation` on an order below its trigger returns a result that fails `publicDecrypt`
- `executeOrder` reverts if called before `markTriggered`
- Contract is verified on Sepolia Etherscan

**Keeper audit:**
- Runs continuously without crashing on a single failed order
- Logs are factual, no emoji, no celebration language
- `KEEPER_PRIVATE_KEY` is read from environment only, never logged, never committed

**Frontend audit (in addition to the FRONTEND_SPEC.md self-check already confirmed):**
- No mock data anywhere, every number in Live Stats and the dashboard is a real contract read
- Logo and favicon are still plain HTML comments if no asset has been supplied yet
- Drawer opens and closes correctly on both drag and click of the visible strip
- WraithField opacity actually shifts between hero, dense and sparse sections on scroll
- Mobile viewport: hero stacks correctly, glass panel leads, no horizontal overflow

**Final checklist, matching APP_BLUEPRINT.md's Hackathon Deliverables Checklist:**
- Public GitHub repository with a complete README
- `feedback.md` written covering the real Nox developer experience from this build
- Demo video, 4 minutes maximum
- X post published tagging @iEx_ec with description, demo video and GitHub link
