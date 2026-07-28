# Wraith test and demo guide

## What is complete

The Wraith source implementation is complete against the repository specifications. The following checks already pass locally:

```text
contracts compile
keeper TypeScript build
frontend production build
2 Hardhat contract tests
```

That is not the same as a completed live demo. Before recording, Wraith still needs a Sepolia deployment, real environment values, a funded keeper, a live Uniswap V3 pool, a token approval, and one successful end-to-end order.

Do not go straight to recording. Run the automated checks first, then run the live smoke test, then record only after the complete order lifecycle has succeeded.

## Progress tracker

- [x] Run `npm run build`.
- [x] Run `npm test`.
- [x] Create local environment-file templates with safe blank values.
- [x] Add Vercel configuration for the frontend.
- [x] Add a free GitHub Actions option for one keeper cycle every five minutes.
- [ ] Fill the required environment values.
- [ ] Deploy and verify `WraithVault` on Sepolia.
- [ ] Approve the input token for the vault.
- [ ] Pass one complete live order from encryption to `EXECUTED`.
- [ ] Record the final demo.

When another unchecked item is completed, update this list and keep the transaction hash or deployment address beside your private notes. Do not put private keys in this file.

### Evidence recorded so far

- `npm run build`: passed. Hardhat printed a Solidity 0.8.35 support warning, then reported `Nothing to compile`; keeper TypeScript passed; Next.js compiled, type-checked, generated all 6 pages, and finalised the build.
- `npm test`: passed with `2 passing` Hardhat tests.

The Hardhat telemetry question is not a build failure. Answering `y` or `n` only changes Hardhat's local telemetry preference.

## 1. Accounts and test resources

Prepare these before configuring the environment:

- a trader wallet used in the browser
- a separate keeper wallet used only by the keeper process
- a deployer wallet with Sepolia ETH
- Sepolia ETH for gas in the trader, keeper, and deployer wallets
- two Sepolia ERC-20 tokens with a live Uniswap V3 pool
- test balance of the input token in the trader wallet
- the pool address and its fee tier
- the Sepolia Uniswap V3 router address selected for the deployment

Use a token pair that is actually liquid on Sepolia. The input token must use 18 decimals for the current form and dashboard formatting. Never use a real-money wallet or a production private key for this demo.

Keep the keeper private key out of `web/.env.local`. The browser must never receive it.

## 2. Install and run the automated checks

From the repository root:

```powershell
npm install
npm --prefix contracts install
npm --prefix keeper install
npm --prefix web install
npm run build
npm test
```

Expected results:

- Solidity compilation completes without errors.
- Keeper TypeScript completes without errors.
- Next.js generates `/`, `/app`, and `/app/orders/new`.
- Hardhat reports `2 passing`.

If any of these fail, stop and fix the failure before touching Sepolia or recording.

## 3. Configure the three packages

Create separate environment files from the committed template:

```powershell
Copy-Item .env.example contracts/.env
Copy-Item .env.example keeper/.env
Copy-Item .env.example web/.env.local
```

The repository now contains local versions of these three files with the public Sepolia RPC pre-filled and secret/address values blank. They are ignored by Git and will not be pushed. You only need to fill the blank values; do not create a fourth kind of configuration file.

Fill `contracts/.env` with:

```text
KEEPER_RPC_URL=<Sepolia RPC URL>
NEXT_PUBLIC_RPC_URL=<Sepolia RPC URL>
DEPLOYER_PRIVATE_KEY=<deployer wallet private key>
NEXT_PUBLIC_UNISWAP_SWAP_ROUTER_ADDRESS=<Sepolia Uniswap V3 router>
KEEPER_ADDRESS=<keeper wallet address>
UNISWAP_POOL_FEE=<pool fee, for example 3000>
ETHERSCAN_API_KEY=<optional, needed for verification>
```

Fill `keeper/.env` with:

```text
KEEPER_RPC_URL=<Sepolia RPC URL>
KEEPER_PRIVATE_KEY=<keeper wallet private key>
KEEPER_ADDRESS=<keeper wallet address>
KEEPER_VAULT_ADDRESS=<deployed vault address>
KEEPER_POOL_ADDRESS=<live Uniswap V3 pool address>
KEEPER_POLL_INTERVAL_MS=15000
```

Fill `web/.env.local` with:

```text
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=<Sepolia RPC URL>
NEXT_PUBLIC_WRAITH_VAULT_ADDRESS=<deployed vault address>
NEXT_PUBLIC_DEMO_TOKEN_IN_ADDRESS=<input token address>
NEXT_PUBLIC_DEMO_TOKEN_OUT_ADDRESS=<output token address>
NEXT_PUBLIC_DEMO_POOL_ADDRESS=<live pool address>
NEXT_PUBLIC_DEMO_POOL_FEE=<same fee used by the vault>
```

Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` if you want the wallet modal to offer WalletConnect QR connections. MetaMask or another injected Sepolia wallet also works for the recording.

Never commit any of these environment files. Only `.env.example` belongs in Git.

### Where each value comes from

| Variable | Where to get it |
| --- | --- |
| `DEPLOYER_PRIVATE_KEY` | The private key of the separate Sepolia deployer wallet, entered only in `contracts/.env` |
| `KEEPER_PRIVATE_KEY` | The private key of the separate keeper wallet, entered only in `keeper/.env` |
| `KEEPER_ADDRESS` | The public address of the keeper wallet |
| `KEEPER_RPC_URL` and `NEXT_PUBLIC_RPC_URL` | Your Sepolia RPC provider URL |
| `NEXT_PUBLIC_UNISWAP_SWAP_ROUTER_ADDRESS` | The verified Uniswap deployment address for the network, checked against the [official Uniswap deployment page](https://developers.uniswap.org/docs/protocols/v3/deployments) |
| `UNISWAP_POOL_FEE` and `NEXT_PUBLIC_DEMO_POOL_FEE` | The fee tier of the exact pool being used, such as `3000` |
| `KEEPER_POOL_ADDRESS` and `NEXT_PUBLIC_DEMO_POOL_ADDRESS` | The address of the exact live Uniswap V3 pool |
| `NEXT_PUBLIC_DEMO_TOKEN_IN_ADDRESS` | The token contract being sold |
| `NEXT_PUBLIC_DEMO_TOKEN_OUT_ADDRESS` | The token contract being received |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | A project created at WalletConnect Cloud; it is optional when using an injected MetaMask wallet |
| `ETHERSCAN_API_KEY` | An Etherscan API key, used only for contract verification |
| `NEXT_PUBLIC_WRAITH_VAULT_ADDRESS` and `KEEPER_VAULT_ADDRESS` | The address printed by the Wraith deployment command |

Never send either private key to anyone, including support or an AI assistant. Enter them directly into the local files on your computer.

### Direct links you can use

- Sepolia ETH faucet: <https://www.alchemy.com/faucets/ethereum-sepolia>
- Alchemy dashboard for an RPC endpoint: <https://dashboard.alchemy.com/>
- Sepolia block explorer: <https://sepolia.etherscan.io/>
- Etherscan API-key page: <https://etherscan.io/apis>
- WalletConnect dashboard: <https://dashboard.walletconnect.com/>
- Official Uniswap deployment addresses: <https://developers.uniswap.org/docs/protocols/v3/deployments>

There is no single correct token address or pool address for every demo. Those two values must belong to the same live Sepolia pool. Do not copy a mainnet address into a Sepolia environment. The official Uniswap page warns that deployment addresses differ between networks; verify the selected router and pool on Sepolia before using them.

### Why the files are separate

One root `.env` would not be routed automatically to all three tools. Hardhat and the keeper run as separate Node projects, while Next.js reads its own `web/.env.local` file and embeds every `NEXT_PUBLIC_` value into browser code. Putting the private deployer or keeper key into the web environment would expose it to the browser bundle.

Vercel is different: its Environment Variables screen acts like the `web/.env.local` file. Add only the public `NEXT_PUBLIC_` variables to Vercel. Do not add the contract deployer or keeper secrets to Vercel.

## 4. Deploy and verify the vault

Run the contract checks once more after configuring the environment:

```powershell
npm --prefix contracts run compile
npm --prefix contracts test
```

Deploy the vault:

```powershell
npm --prefix contracts run deploy:sepolia
```

Copy the printed `WraithVault deployed to` address into:

- `KEEPER_VAULT_ADDRESS` in `keeper/.env`
- `NEXT_PUBLIC_WRAITH_VAULT_ADDRESS` in `web/.env.local`

Verify the deployment on Etherscan:

```powershell
npx --prefix contracts hardhat verify --network sepolia <vault-address> <router-address> <keeper-address> <pool-fee>
```

Open the verified contract on Sepolia Etherscan and check that:

- `keeper()` is the keeper wallet address.
- `swapRouter()` is the intended Sepolia router.
- `poolFee()` matches the selected pool.
- the contract address matches both package environment files.

## 5. Approve the vault for the input token

Wraith does not ask the trader to deposit funds. It uses `transferFrom` only when an order triggers.

Before submitting an order:

1. Open the input token contract on Sepolia Etherscan.
2. Open the `Contract` tab, then `Write Contract`.
3. Connect the trader wallet.
4. Call `approve`.
5. Set `spender` to the deployed Wraith vault address.
6. Set `amount` to the exact input amount you will enter in the order form, expressed in the token's smallest units.
7. Submit and wait for confirmation.

Approve the vault, not the Uniswap router. The vault performs the final router approval during execution.

## 6. Find a trigger value that will execute quickly

The keeper reads the pool's public `slot0` value. The current MVP compares that raw integer with the encrypted trigger value supplied by the form.

To prepare a quick demo:

1. Read `slot0()` from the selected pool contract on Sepolia Etherscan.
2. Copy `sqrtPriceX96`.
3. Calculate the raw price with this JavaScript expression:

```javascript
(sqrtPriceX96 * sqrtPriceX96) >> 192n
```

For example, from a terminal:

```powershell
node -e "const s=BigInt(process.argv[1]); console.log((s*s)>>192n)" <sqrtPriceX96>
```

The form stores the trigger with six decimal places. Divide the raw price by `1,000,000` when entering it in the form. Confirm that the raw price is greater than zero. If it is zero, select a better-scaled demo pool because the current MVP does not normalise token decimals.

For an immediate trigger:

- select `Price rises to` and enter a threshold slightly below the current value
- select `Price falls to` and enter a threshold slightly above the current value

This demonstrates the complete confidential evaluation and execution flow without trying to move a public testnet market during the recording.

## 7. Deploy the frontend to Vercel

Wraith has two separate runtime pieces:

- `web` is the browser frontend and can run on Vercel.
- `keeper` is a long-running blockchain polling process and should not run as a Vercel deployment.

Vercel can host the landing page, wallet UI, dashboard, and order form. The keeper must run locally during the demo or on a worker host such as Railway, Render, Fly.io, or a small server. The keeper needs a persistent process because it uses `setInterval` to keep checking open orders.

Could the keeper be changed into a Vercel Cron function? Technically, one polling cycle could be exposed as an HTTP function, but that would not provide the current 15-second keeper loop. Vercel Hobby cron jobs are limited to once per day, so they are not suitable for this live order demo. Keep the current keeper running locally for the recording; the Vercel frontend can still connect to the same deployed Sepolia vault.

### Free keeper option using GitHub Actions

The repository now includes `.github/workflows/keeper.yml`. It runs one keeper cycle every five minutes and can also be started manually. This is suitable for a hackathon demo and avoids Railway. Standard GitHub-hosted runners are free for public repositories, and GitHub's shortest scheduled-workflow interval is five minutes.

After the vault has been deployed, open the repository on GitHub and go to `Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`. Add these four secrets exactly:

```text
KEEPER_PRIVATE_KEY=<keeper wallet private key>
KEEPER_RPC_URL=<Sepolia RPC URL>
KEEPER_VAULT_ADDRESS=<deployed vault address>
KEEPER_POOL_ADDRESS=<live pool address>
```

Do not add the private key as a normal repository variable. Use the encrypted `Secrets` section. GitHub documents that Actions secrets are encrypted and are only injected into a workflow when referenced by it: <https://docs.github.com/en/actions/concepts/security/secrets>.

To test it manually:

1. Open the repository on GitHub.
2. Select `Actions`.
3. Select `Wraith keeper cycle`.
4. Select `Run workflow`.
5. Open the new run and inspect its logs.

The workflow runs only one cycle and exits. That is intentional. The scheduled workflow starts another cycle five minutes later. Keep the repository active because GitHub may disable scheduled workflows in a public repository after 60 days without activity. The GitHub Actions schedule and public-repository billing rules are documented at <https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax> and <https://docs.github.com/en/actions/concepts/billing-and-usage>.

### Deploy the frontend

The repository now includes `vercel.json`, so the root of this repository can be imported into Vercel. Alternatively, set the Vercel project Root Directory to `web` and use the normal Next.js defaults.

Using the Vercel CLI:

```powershell
npx vercel login
npx vercel
```

When prompted, create or select the Wraith project and accept the detected Next.js settings. For a production deployment:

```powershell
npx vercel --prod
```

In Vercel Project Settings, add these Environment Variables for the `Production` environment:

```text
NEXT_PUBLIC_CHAIN_ID
NEXT_PUBLIC_RPC_URL
NEXT_PUBLIC_WRAITH_VAULT_ADDRESS
NEXT_PUBLIC_DEMO_TOKEN_IN_ADDRESS
NEXT_PUBLIC_DEMO_TOKEN_OUT_ADDRESS
NEXT_PUBLIC_DEMO_POOL_ADDRESS
NEXT_PUBLIC_DEMO_POOL_FEE
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
```

Do not add `KEEPER_PRIVATE_KEY`, `DEPLOYER_PRIVATE_KEY`, or any other keeper secret to Vercel. Redeploy after changing environment variables. The Vercel URL is the hosted Wraith landing page.

If `NEXT_PUBLIC_WRAITH_VAULT_ADDRESS` is empty, the landing page can still render, but the dashboard cannot read orders and the order form cannot submit. Deploy the vault first, then add its address and redeploy the frontend.

### How to view the site locally

You do not need the keeper just to see the landing page. Run this from the repository root:

```powershell
npm --prefix web run dev
```

Then open this exact address in your browser:

```text
http://localhost:3000
```

Keep that terminal open while using the site. Open `/app` or `/app/orders/new` by adding that path to the same address. Start the keeper separately only when testing a submitted order all the way to execution.

## 8. Run the live smoke test

Use two terminals from the repository root.

Terminal 1, keeper:

```powershell
npm --prefix keeper run dev
```

Expected first output resembles:

```text
keeper polling every 15000ms
```

Terminal 2, web app:

```powershell
npm --prefix web run dev
```

Open `http://localhost:3000` and switch the browser wallet to Sepolia.

### Smoke-test sequence

1. Open the landing page and confirm the Wraith field renders without blocking the page.
2. Click the wallet pill and connect the trader wallet.
3. Open `/app` and confirm the dashboard reads the vault.
4. Open `Place an order`.
5. Enter the two token addresses, the prepared trigger value, and a small approved input amount.
6. Select the trigger direction that is already satisfied by the current pool price.
7. Click `Encrypt and submit`.
8. Complete the Nox encryption/signing flow in the wallet.
9. Wait for the transaction to confirm.
10. Return to the dashboard and confirm the order ticket appears.
11. Watch the keeper terminal. It should request an evaluation, receive the public boolean result, mark the order triggered, decrypt only the amount, and submit execution.
12. Wait for the execution transaction to confirm.
13. Refresh the dashboard. The ticket should read `EXECUTED`.
14. Check the trader wallet's output-token balance and the `totalOrdersFilled` value on the landing page.

The test is a pass only if the actual output token arrives in the trader wallet. A successful order submission alone is not an end-to-end pass.

## 9. What to verify before recording

Record the transaction hashes and keep them available for the submission notes.

### Required pass conditions

- The browser is on Sepolia.
- The vault address is verified and consistent everywhere.
- The order transaction contains opaque Nox handles rather than a readable trigger price or amount.
- The connected owner can decrypt and display their own order values in the dashboard.
- The keeper can read the public pool price and submit the evaluation transaction.
- A true evaluation produces a triggered order.
- Only the triggered amount is publicly decrypted.
- The vault pulls the approved input token and routes the swap through Uniswap V3.
- The output token is sent to the trader wallet.
- The dashboard changes to `EXECUTED`.
- The live filled-order metric increments.

### Useful negative checks

Run these before the final take if time allows:

- Set a threshold that is not satisfied and confirm the order remains `OPEN`.
- Cancel that open order from the owner dashboard and confirm it becomes `CANCELLED`.
- Disconnect the wallet and confirm `/app` requires a connection.
- Switch the wallet away from Sepolia and confirm the network guard prevents submission.
- Connect a second wallet and confirm it cannot see the first wallet's orders.

Do not use an unapproved order as the final demo. A failed approval produces an execution failure rather than a clean product story.

## 10. Recording plan with no voiceover, subtitles, or captions

Record a clean screen capture only. Do not add narration, subtitles, captions, or explanatory overlays. Let the Wraith interface, wallet confirmation, explorer pages, keeper log, and status changes provide the evidence.

Use a 16:9 recording at 1080p if possible. Close personal tabs, hide seed phrases and private keys, and use a fresh browser profile or a dedicated demo wallet. Turn off browser notifications. Keep the browser zoom at 100%.

### Recommended final video, approximately 75 to 120 seconds

#### Shot 1: product context, 5 to 8 seconds

Start on the Wraith landing page. Show the hero order ticket and the encrypted/private treatment. Scroll through the mechanism and comparison sections slowly enough for the interface to be legible.

#### Shot 2: connect and open the private dashboard, 8 to 12 seconds

Click the wallet pill, connect the demo wallet, then open the dashboard. Show the wallet connected state and the initial order view.

#### Shot 3: create the encrypted order, 15 to 20 seconds

Open `Place an order`. Fill in the token pair, trigger value, amount, and direction. Click `Encrypt and submit`. Capture the wallet confirmation, but do not show any private wallet information.

#### Shot 4: prove the transaction is opaque, 8 to 12 seconds

Open the submitted transaction on Sepolia Etherscan. Show the `submitOrder` call and the long opaque handle/proof data. Do not zoom in on or annotate it with the hidden price or amount. Return to the dashboard and show that the owner can see the order ticket.

#### Shot 5: show the keeper doing the work, 10 to 15 seconds

Use a split view or switch briefly to the keeper terminal. Show the polling process and the factual execution log containing the order number and execution transaction hash. Keep the terminal free of environment variables and private keys.

#### Shot 6: show the result, 15 to 20 seconds

Return to the dashboard and refresh. Show the order state changing to `EXECUTED`. Open the execution transaction on Etherscan and show the swap transaction. If practical, show the trader wallet's output-token balance increasing.

#### Shot 7: close on proof of activity, 5 to 8 seconds

Return to the landing page and show the live filled-order or routed-volume metric. End on Wraith's interface, not on a terminal or an error screen.

### Recording rules

- Do not record seed phrases, private keys, raw `.env` files, or wallet account export screens.
- Do not show personal browser bookmarks, email, notifications, or unrelated tabs.
- Do not fake a status change with browser tools or edited footage.
- Do not rely on a transaction that is still pending.
- Keep the final recording continuous where possible so the lifecycle is credible.
- If a transaction fails, stop recording, reset the test state, fix the cause, and retake the sequence.

## 11. Submission handoff

After the clean take:

1. Save the final video in a common format such as MP4.
2. Watch it once without sound to confirm the story is understandable visually.
3. Confirm every displayed transaction is on Sepolia.
4. Keep the vault, submit, and execution transaction links in your submission notes.
5. Use the repository link and the deployed verified contract address in the submission form.
6. Attach the video and follow the hackathon's submission deadline and format requirements.

The intended order of work is:

```text
automated tests -> Sepolia deployment -> live smoke test -> clean recording -> submission
```
