# Wraith

Set the price. Vanish until it hits.

Wraith is a private limit order engine for Uniswap V3 on Ethereum Sepolia. A trader encrypts the trigger price and input size in the browser with iExec Nox, submits only opaque handles to `WraithVault`, and keeps the order out of the readable mempool until the enclave confirms the condition. A keeper then reveals only the triggered amount, pulls that exact amount through an existing ERC-20 approval, and settles a normal Uniswap V3 swap straight to the trader.

## Repository

- `contracts` contains the Solidity vault, Hardhat configuration, deployment script, and tests
- `keeper` contains the Node.js polling service that reads the public pool price and drives Nox evaluation
- `web` contains the Next.js landing page, wallet-gated dashboard, and encrypted order form
- `feedback.md` records the Nox development experience

There is no database or off-chain order index. The dashboard reads the vault directly and decrypts values only for the connected owner wallet.

## Requirements

- Node.js 18 or later
- npm 9 or later
- a Sepolia wallet with test ETH
- a WalletConnect Cloud project ID
- a Sepolia RPC URL
- Nox access configured for the published `@iexec-nox/handle` SDK

## Install

```bash
npm --prefix contracts install
npm --prefix keeper install
npm --prefix web install
Copy-Item .env.example .env
```

Copy the required variables into the package environments. Keep `KEEPER_PRIVATE_KEY` and `DEPLOYER_PRIVATE_KEY` out of the frontend and out of Git.

## Contracts

Set `NEXT_PUBLIC_UNISWAP_SWAP_ROUTER_ADDRESS`, `KEEPER_ADDRESS`, `DEPLOYER_PRIVATE_KEY`, and `KEEPER_RPC_URL` before deploying.

```bash
npm --prefix contracts run compile
npm --prefix contracts test
npm --prefix contracts run deploy:sepolia
npx --prefix contracts hardhat verify --network sepolia <vault> <router> <keeper> <poolFee>
```

The router is constructor-injected. Wraith never embeds a chain address in Solidity source. Use the current Uniswap deployment documentation to choose the Sepolia router and confirm the selected pool has liquidity.

## Keeper

Set `KEEPER_PRIVATE_KEY`, `KEEPER_RPC_URL`, `KEEPER_VAULT_ADDRESS`, and `KEEPER_POOL_ADDRESS`.

```bash
npm --prefix keeper run dev
```

The service submits an evaluation, polls the Nox public decryption endpoint, marks a true result, polls the revealed amount, then executes the swap. Every order failure is logged and the polling loop continues.

## Web

Set the public variables from `.env.example`, especially `NEXT_PUBLIC_WRAITH_VAULT_ADDRESS`, the token addresses, pool address, RPC URL, and WalletConnect project ID.

```bash
npm --prefix web run dev
npm --prefix web run build
```

Open `/` for the landing page, `/app` for the wallet-gated dashboard, and `/app/orders/new` for a live encrypted order. The order form expects the pool price scale used by the vault and the keeper. The Sepolia network guard rejects other chains before a transaction is submitted.

## Privacy boundary

The token pair and trigger direction are intentionally public in this MVP. The trigger price and amount are encrypted client-side before `submitOrder`. The vault stores Nox encrypted values and ACLs, not plaintext. The only public decryption calls are the boolean evaluation result and the amount for the one order that has triggered.

## Submission checklist

- deploy and verify `WraithVault` on Sepolia
- set the deployed address in the keeper and web environments
- approve the vault for the demo token without depositing funds
- run the keeper against a live Sepolia pool
- record a transaction showing opaque Nox handles in calldata
- record the real execution and the dashboard status change
- attach the demo video to the X submission and tag `@iEx_ec`
