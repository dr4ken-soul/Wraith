import {createViemHandleClient} from '@iexec-nox/handle'
import type {Address, Hex, WalletClient} from 'viem'

/** Encrypts the trigger and input amount before either value reaches calldata. */
export async function encryptOrderInputs(triggerPrice: bigint, amountIn: bigint, vaultAddress: Address, walletClient: WalletClient) {
  const handleClient = await createViemHandleClient(walletClient)
  const [priceResult, amountResult] = await Promise.all([
    handleClient.encryptInput(triggerPrice, 'uint256', vaultAddress),
    handleClient.encryptInput(amountIn, 'uint256', vaultAddress),
  ])
  return {
    triggerPriceHandle: priceResult.handle as Hex,
    triggerPriceProof: priceResult.handleProof as Hex,
    amountInHandle: amountResult.handle as Hex,
    amountInProof: amountResult.handleProof as Hex,
  }
}

