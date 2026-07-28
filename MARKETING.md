# MARKETING.md — Wraith

## Goal

This is not a bonus marketing push. The X post is the actual submission mechanism for the WTF!! Hackathon Summer Edition, per the hackathon rules: "to officially submit your project, you need to publish a post on X presenting your project." One post, and it has to contain a short description, the demo video, a working link to the public GitHub repository, and @iEx_ec tagged.

The proof to show, not tell: a Sepolia transaction with an opaque handle instead of a readable price, then that same order firing a real Uniswap V3 swap the moment it triggers.

---

## Posting Style

- all lowercase
- builder voice, not company voice
- short lines, blank line between each thought
- show the encrypted handle on Etherscan, do not just describe it
- the demo video does the heavy lifting, copy supports it

---

## Post Plan

### post 1 — submission

```
built wraith for the wtf!! hackathon summer edition

a private limit order engine for uniswap v3

set a price, a size, a direction

wraith encrypts all three into a nox handle before any of it touches the chain

the enclave checks your trigger against live uniswap pricing without ever decrypting it

the moment it hits, the swap fires straight through uniswap v3, invisible right up until execution, non-custodial the whole way through

built on nox confidential compute from @iEx_ec, deployed on eth sepolia

demo below, code is fully open

github: [repo link]
```

Attach the demo video directly to the post rather than linking out to it, X's own player gets more views than an external link. Replace `[repo link]` with the live GitHub URL once the repository is public. If the combined text runs past the standard character limit, use X's long-form post format rather than cutting the GitHub link or the @iEx_ec tag, those two are non-negotiable for a valid submission.

---

## Submission Notes

**Project title:** Wraith

**Tagline:** Set the price. Vanish until it hits.

**Track:** Confidential DeFi, built on iExec Nox

**Built with:**
- Next.js 14, TypeScript, Tailwind CSS
- React Three Fiber (WraithField particle canvas)
- wagmi + viem
- Nox Solidity library (`@iexec-nox/nox-protocol-contracts`) and `@iexec-nox/handle` JS SDK
- Solidity 0.8.27, Hardhat
- Uniswap V3 periphery
- Node.js keeper service

**Project description (under 200 words):**

Wraith is a private limit order engine for Uniswap V3. A trader sets a trigger price, a size and a direction, and the price and size are encrypted client-side into Nox handles before any of it reaches the chain.

An off-chain keeper feeds the current, already-public Uniswap V3 pool price into a Nox enclave, which compares it against the encrypted trigger and returns a result nobody can read until it is deliberately made public. Only when the condition is met does that single order's amount become decryptable, at which point the vault pulls exactly that amount through a pre-existing approval, not a deposit, and settles an ordinary Uniswap V3 swap straight to the trader's wallet.

The trigger price is never readable on-chain at any point before execution, which is the entire pitch and the entire technical claim, verifiable directly on Sepolia Etherscan by reading the transaction calldata for any open order.

**Demo video flow (4 minutes maximum):**
1. Landing page, hero split-screen, WraithField particle canvas (10s)
2. Connect wallet on Sepolia (10s)
3. Set a trigger price, size and direction on a live pair (20s)
4. Submit the order, cut straight to Sepolia Etherscan showing an opaque handle where the price would be (30s), this is the proof moment, hold on it
5. Keeper terminal running `requestEvaluation` against the live pool (20s)
6. Trigger condition met, `markTriggered` then `executeOrder` firing on-chain (30s)
7. Wallet balance updates, swap settled (15s)
8. Back to the dashboard, order now shows Executed, decrypted values visible only to the connected owner wallet (20s)
9. Quick pan across the Mechanism section, encrypt, evaluate, execute, settle (15s)
10. End on the Wraith wordmark and tagline (10s)

Total approximately 180 seconds, comfortably inside the 4-minute limit.

---

## Checklist

- [ ] Joined the iExec Discord and the WTF hackathon channel
- [ ] `WraithVault` deployed and verified on ETH Sepolia
- [ ] GitHub repository public, README with install and usage instructions, comprehensive setup and deployment docs
- [ ] `feedback.md` written and committed to the repository root
- [ ] Full flow tested end to end at least twice before recording, no mock data anywhere
- [ ] Demo video recorded, trimmed to 4 minutes maximum
- [ ] Post published on X, description, demo video attached, GitHub link, @iEx_ec tagged
- [ ] Confirmed the project does not reuse an idea from the earlier Vibe Coding Hackathon
