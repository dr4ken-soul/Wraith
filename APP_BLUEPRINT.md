# Wraith — App Blueprint

## Product Summary

Wraith is a private limit order engine for Uniswap V3. A trader sets a price, a size and a direction, the order is encrypted client-side into a Nox handle and submitted to a vault contract. An off-chain keeper checks the order against live Uniswap V3 pricing by asking the Nox enclave to compare the current price against the encrypted trigger, without ever decrypting the trigger itself. Only when the condition is met does the order's price and size become decryptable, and only for that single order, at which point the vault executes an ordinary Uniswap V3 swap and the funds settle to the trader's wallet.

Built for the WTF!! Hackathon Summer Edition, iExec Nox, submission window 5 July to 1 August 2026 22:59, deadline 1 August 2026 22:59. Nox is the entire privacy layer. Remove it and Wraith is a plain limit order bot with every threshold visible in the mempool before it fills.

---

## Market Context

**Who this is for:**

1. DeFi traders who currently avoid on-chain limit orders because a visible trigger price is a standing invitation for MEV bots to front-run the fill
2. Funds and larger wallets who need to move size without signalling intent, and who currently route around this by using centralised exchange limit orders, which reintroduces custodial risk
3. Protocol teams and hackathon judges evaluating whether Nox can sit cleanly on top of live DeFi infrastructure without forking it, which is the actual scoring criterion for this challenge

**What they currently use:** Public on-chain limit order tools such as 1inch Limit Order Protocol or CoW Swap, MEV-protected RPC endpoints such as Flashbots Protect, or a CEX limit order book. None of these combine full non-custodial self-custody with a trigger price that stays unreadable until the moment of execution.

**Why they switch:** Every existing on-chain limit order exposes the trigger the instant it is submitted, because the order has to be readable for anyone to know when to fill it. Wraith is the only one where the enclave does the reading, not the public mempool.

---

## MVP Feature Set

### Feature 1: Encrypted Order Submission

**User story:** As a trader I want to set a limit order without my trigger price or size ever appearing in plaintext on-chain, so that nobody can position against my fill before it happens.

**How it works:** The frontend encrypts the trigger price and the input amount separately using the Nox JS SDK, producing a `handle` and `handleProof` for each. `submitOrder` on `WraithVault` calls `Nox.fromExternal` on both, stores them as `euint256` fields on an `Order` struct, and grants the vault and the trader decrypt access. The trade pair and direction stay in plaintext, they carry no exploitable information on their own.

**Acceptance criteria:** After submission, `sepolia.etherscan.io` shows a transaction to `WraithVault` with no readable price or amount in calldata or logs, only opaque 32-byte handles. Reading the order back through the JS SDK as the owning wallet returns the correct values.

**Complexity:** Medium

---

### Feature 2: Confidential Trigger Evaluation

**User story:** As a trader I want the network to check whether my price has been hit without revealing what my price actually is, so my threshold is never public information before it fires.

**How it works:** A keeper reads the current Uniswap V3 pool price via `slot0()`, a value that is already public, and passes it as plaintext into `requestEvaluation(orderId, currentPrice)`. The contract wraps that plaintext into an ephemeral `euint256` with `Nox.toEuint256`, then compares it against the order's encrypted `triggerPrice` with `Nox.ge` or `Nox.le` depending on the order's stored direction. The comparison produces an `ebool` result handle that nobody, including Wraith, can read yet.

**Acceptance criteria:** Calling `requestEvaluation` on an order whose condition is not yet met produces a result handle that fails `publicDecrypt` until made public. The trigger price itself is never made publicly decryptable at any point, only the boolean result and, on trigger only, the amount.

**Complexity:** High

---

### Feature 3: Non-Custodial Private Execution

**User story:** As a trader I want my order to fill exactly like a normal Uniswap swap the instant it triggers, without pre-approving custody of my full balance to a third party.

**How it works:** Once the keeper reads a triggered result via `publicDecrypt`, it calls `markTriggered(orderId)`, which calls `Nox.allowPublicDecryption` on that single order's `amountIn` handle only. The keeper reads the now-public amount, then calls `executeOrder(orderId, revealedAmount)`. The vault pulls exactly that amount from the trader's wallet via a pre-existing ERC-20 `approve`, not a deposit, swaps it through Uniswap V3's router, and forwards the output token straight to the trader.

**Acceptance criteria:** A trader who has approved `WraithVault` but never deposited funds sees their wallet balance change only at the moment of execution. Attempting `executeOrder` on an order that has not been marked triggered reverts.

**Complexity:** High

---

### Feature 4: Order Ticket Dashboard

**User story:** As a trader I want to see the live status of my own orders without any off-chain database exposing them to anyone else.

**How it works:** `getMyOrders()` is a view function filtered by `msg.sender` on-chain, no Supabase or off-chain index. The connected wallet decrypts its own price and size fields via the JS SDK `decrypt()` call, which checks the on-chain ACL before returning anything. Other wallets calling the same view function see only status and pair, never the encrypted fields decrypted.

**Acceptance criteria:** Connecting a different wallet never surfaces another trader's price or size, even as ciphertext metadata beyond the opaque handle. `getMyOrders()` returns correctly for wallets with zero, one and multiple open orders.

**Complexity:** Medium

**What makes this the one that matters for judging:** the trigger price is genuinely never public before execution, verifiable by anyone reading Sepolia directly. That is the entire pitch and the entire scoring criterion in one property.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend framework | Next.js 14 App Router, TypeScript | SSR for the marketing page, works cleanly with wagmi providers, per CRYPTO_SKILL.md Category A |
| Styling | Tailwind CSS | Utility-first, matches FRONTEND_SPEC.md exactly |
| Animation | motion/react | Correct import path for v11+, used for the WraithField opacity transitions and section entrances |
| Wallet connection | wagmi + viem | Best-in-class EVM wallet library, and the Nox handle SDK is viem-native |
| Confidential compute | Nox Solidity library + `@iexec-nox/handle` JS SDK | The hackathon requirement and the entire privacy layer |
| Smart contracts | Solidity 0.8.27, Hardhat, Nox Hardhat plugin | Matches the Nox Hardhat starter the hackathon points to |
| DEX settlement | Uniswap V3 periphery, `SwapRouter02` or `UniversalRouter` | Resolve the exact Sepolia address from `docs.uniswap.org/contracts/v3/reference/deployments` at build time rather than hardcoding, Uniswap's own docs warn addresses are not stable across chains and that UniversalRouter is now the preferred entrypoint |
| Chain | Ethereum Sepolia | Hackathon requirement |
| Off-chain keeper | Node.js, viem, node-cron | Lightweight polling service, not part of Nox itself, watches pool price and drives evaluation and execution |
| Database | None for MVP | Order state lives entirely on-chain, read via `getMyOrders()`. No off-chain record can leak what the chain itself does not expose |
| Hosting | Vercel | Standard for Next.js, matches every prior project |

---

## Nox Integration Detail

### Client-side encryption of a new order

```typescript
/**
 * Encrypts a trigger price and an input amount for a new Wraith order
 * and returns the handles and proofs the WraithVault contract expects.
 * @param triggerPrice - the price at which the order should fire, in the pool's tick-adjusted uint256 format
 * @param amountIn - the amount of tokenIn to swap once triggered, in wei
 * @param vaultAddress - the deployed WraithVault contract address on Sepolia
 * @param walletClient - the connected wagmi/viem wallet client
 * @returns handles and proofs ready to pass into submitOrder
 */
import { createViemHandleClient } from '@iexec-nox/handle'

export async function encryptOrderInputs(
  triggerPrice: bigint,
  amountIn: bigint,
  vaultAddress: `0x${string}`,
  walletClient: WalletClient,
) {
  const handleClient = await createViemHandleClient(walletClient)

  const [priceResult, amountResult] = await Promise.all([
    handleClient.encryptInput(triggerPrice, 'uint256', vaultAddress),
    handleClient.encryptInput(amountIn, 'uint256', vaultAddress),
  ])

  return {
    triggerPriceHandle: priceResult.handle,
    triggerPriceProof: priceResult.handleProof,
    amountInHandle: amountResult.handle,
    amountInProof: amountResult.handleProof,
  }
}
```

### Storing the order on-chain

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Nox, euint256, externalEuint256, ebool} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

/// @notice Submits a new encrypted limit order. Trigger price and amount
///         stay encrypted end to end, only the pair and direction are plain.
/// @param tokenIn address of the token being sold
/// @param tokenOut address of the token being bought
/// @param triggerAbove true if the order fires when price rises to the trigger, false if it fires on a fall
/// @param triggerPriceHandle external handle for the encrypted trigger price
/// @param triggerPriceProof proof that the handle was created legitimately
/// @param amountInHandle external handle for the encrypted input amount
/// @param amountInProof proof that the handle was created legitimately
function submitOrder(
    address tokenIn,
    address tokenOut,
    bool triggerAbove,
    externalEuint256 triggerPriceHandle,
    bytes calldata triggerPriceProof,
    externalEuint256 amountInHandle,
    bytes calldata amountInProof
) external returns (uint256 orderId) {
    euint256 triggerPrice = Nox.fromExternal(triggerPriceHandle, triggerPriceProof);
    euint256 amountIn = Nox.fromExternal(amountInHandle, amountInProof);

    Nox.allowThis(triggerPrice);
    Nox.allow(triggerPrice, msg.sender);
    Nox.allowThis(amountIn);
    Nox.allow(amountIn, msg.sender);

    orderId = _nextOrderId++;
    orders[orderId] = Order({
        owner: msg.sender,
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        triggerAbove: triggerAbove,
        triggerPrice: triggerPrice,
        amountIn: amountIn,
        status: OrderStatus.Open,
        createdAt: block.timestamp
    });

    emit OrderSubmitted(orderId, msg.sender, tokenIn, tokenOut);
}
```

### Requesting a confidential evaluation

```solidity
/// @notice Compares the current, plainly-visible pool price against an
///         order's encrypted trigger without ever decrypting the trigger.
/// @param orderId the order to evaluate
/// @param currentPrice the live Uniswap V3 price read from slot0 by the keeper
function requestEvaluation(uint256 orderId, uint256 currentPrice) external {
    Order storage order = orders[orderId];
    require(order.status == OrderStatus.Open, "order not open");

    euint256 livePrice = Nox.toEuint256(currentPrice);
    ebool result = order.triggerAbove
        ? Nox.ge(livePrice, order.triggerPrice)
        : Nox.le(livePrice, order.triggerPrice);

    Nox.allowThis(result);
    Nox.allowPublicDecryption(result);

    order.pendingResult = result;
    emit EvaluationRequested(orderId, ebool.unwrap(result));
}
```

### Marking a trigger and executing

```solidity
/// @notice Called by the keeper once publicDecrypt on the pending result
///         returns true. Makes only this order's amount decryptable, then
///         the keeper reads it and calls executeOrder in a follow-up call.
function markTriggered(uint256 orderId) external {
    Order storage order = orders[orderId];
    require(order.status == OrderStatus.Open, "order not open");
    order.status = OrderStatus.Triggered;
    Nox.allowPublicDecryption(order.amountIn);
    emit OrderTriggered(orderId, euint256.unwrap(order.amountIn));
}

/// @notice Pulls the exact revealed amount from the trader's wallet via a
///         pre-existing approval, swaps through Uniswap V3, forwards the
///         output token straight to the trader. Never holds a standing balance.
/// @param orderId the triggered order to settle
/// @param revealedAmountIn the amount read off publicDecrypt, verified against the stored handle
function executeOrder(uint256 orderId, uint256 revealedAmountIn) external {
    Order storage order = orders[orderId];
    require(order.status == OrderStatus.Triggered, "order not triggered");
    order.status = OrderStatus.Executed;

    IERC20(order.tokenIn).transferFrom(order.owner, address(this), revealedAmountIn);
    IERC20(order.tokenIn).approve(address(swapRouter), revealedAmountIn);

    uint256 amountOut = swapRouter.exactInputSingle(
        ISwapRouter.ExactInputSingleParams({
            tokenIn: order.tokenIn,
            tokenOut: order.tokenOut,
            fee: poolFee,
            recipient: order.owner,
            amountIn: revealedAmountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        })
    );

    emit OrderExecuted(orderId, revealedAmountIn, amountOut);
}
```

---

## Data Structures

```solidity
enum OrderStatus { Open, Triggered, Executed, Cancelled }

struct Order {
    address owner;
    address tokenIn;
    address tokenOut;
    bool triggerAbove;
    euint256 triggerPrice;
    euint256 amountIn;
    ebool pendingResult;
    OrderStatus status;
    uint256 createdAt;
}
```

```typescript
interface OrderTicket {
  orderId: bigint
  tokenIn: `0x${string}`
  tokenOut: `0x${string}`
  triggerAbove: boolean
  status: 'open' | 'triggered' | 'executed' | 'cancelled'
  createdAt: number
  // decrypted client-side only for the connected owner wallet
  triggerPrice?: bigint
  amountIn?: bigint
}

interface KeeperConfig {
  rpcUrl: string
  vaultAddress: `0x${string}`
  poolAddress: `0x${string}`
  pollIntervalMs: number
}
```

---

## Contract Interface

| Function | Caller | Description |
|---|---|---|
| `submitOrder(...)` | any wallet | Creates a new encrypted order |
| `cancelOrder(orderId)` | order owner | Cancels an open order, no funds ever moved |
| `getMyOrders()` | any wallet, view | Returns caller's own orders, filtered on-chain by `msg.sender` |
| `requestEvaluation(orderId, currentPrice)` | keeper | Compares live price against the encrypted trigger, result stays private |
| `markTriggered(orderId)` | keeper, after reading a true result | Reveals only that order's amount |
| `executeOrder(orderId, revealedAmountIn)` | keeper | Pulls approved funds, swaps via Uniswap V3, forwards output to owner |

---

## Environment Variables

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

`KEEPER_PRIVATE_KEY` belongs to a dedicated hot wallet used only to submit evaluation and execution transactions, never the treasury and never a trader's key. It never holds trader funds since execution is allowance-based.

---

## App Routes

- `/` — the FRONTEND_SPEC.md landing page, public, no wallet required
- `/app` — wallet-gated order dashboard, follows the ProtectedRoute pattern from FRONTEND_SKILL.md Step 13, redirects to `/` with a connect prompt if no wallet is connected
- `/app/orders/new` — order submission form, the encrypted split-screen ticket from the hero becomes the live form here

---

## What Is Not Being Built in MVP

- Protocol fee or treasury wallet, this is a fee-less MVP, a small execution fee is a clean post-hackathon addition
- Encrypted trade direction, direction stays plaintext for this MVP, only price and size are encrypted, this is called out explicitly rather than implied
- Multi-hop routing through Uniswap, single pool pair only
- Order modification, only cancel and resubmit
- Mainnet deployment, Sepolia only per hackathon rules
- Mobile app
- Gas abstraction or a paymaster

---

## Hackathon Deliverables Checklist

- Public GitHub repository, complete viewable code, README with install and usage instructions
- Functional frontend end to end with no mock data, every order shown is a real on-chain read
- Deployed on ETH Sepolia
- `feedback.md` in the repository root covering the actual Nox developer experience
- Demo video, 4 minutes maximum
- X post tagging @iEx_ec with a short description, the demo video and the GitHub link

---

## Hackathon Build Priority

Judged on creativity, whether the app works end to end without mock data, Sepolia deployment, the feedback.md, the demo video, technical use of Nox, and UX.

1. `WraithVault` deployed to Sepolia, `submitOrder` and `cancelOrder` working with real encrypted handles
2. Keeper service running `requestEvaluation` against a live Sepolia Uniswap V3 pool
3. `markTriggered` and `executeOrder` firing a real swap end to end on a manually forced trigger
4. Order dashboard reading and decrypting a connected wallet's own orders correctly
5. Landing page live per FRONTEND_SPEC.md
6. `feedback.md` written
7. Demo video recorded and X post published tagging @iEx_ec
