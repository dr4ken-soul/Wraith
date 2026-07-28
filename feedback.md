# Wraith Nox feedback

## What worked

The encrypted input boundary is a clean fit for a client-side order form. The handle SDK gives the browser a small integration surface: create a viem handle client, call `encryptInput` for each value, and forward the returned handle and proof to the contract. This keeps the privacy decision close to the user action instead of hiding it in a server.

The Solidity model is also composable. `euint256` values can be stored alongside ordinary order metadata, compared with live public values, and permissioned separately. That makes it possible to expose a boolean evaluation result without exposing the trigger threshold.

## Friction points

The Nox flow is asynchronous in two different places. The contract transaction only requests the evaluation. The keeper must extract the result handle, wait for the Runner to process the event, and poll `publicDecrypt`. The same pattern is needed again after `markTriggered` before the amount can be used for execution. A synchronous-looking helper would make this easy to get wrong.

The public SDK surface and starter references need stronger versioned examples. The hackathon guide referenced a starter repository that was no longer available at the documented URL, so the project uses the published package and keeps the configuration explicit. A maintained starter with a minimal viem keeper and one local test double would reduce setup time.

The encrypted value scale must be agreed across three callers: the browser form, the pool reader, and the vault comparison. Uniswap V3 exposes `sqrtPriceX96` in `slot0`, while the order interface expects a plain uint256 comparison value. A canonical helper and an example token pair would make this boundary safer.

## Requests

1. Publish a current Hardhat starter link alongside the package versions
2. Document the exact event payload and recommended polling backoff for `publicDecrypt`
3. Provide a local Runner or deterministic test adapter for CI
4. Include a reference for common Uniswap V3 price scales in encrypted limit-order examples

