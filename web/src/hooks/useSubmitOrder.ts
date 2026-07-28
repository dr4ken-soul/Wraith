'use client'

import {useState} from 'react'
import {useWalletClient, useWriteContract} from 'wagmi'
import type {Address} from 'viem'
import {encryptOrderInputs} from '@/lib/nox'
import {getVaultAddress, vaultAbi} from '@/lib/contract'

type SubmitInput = {tokenIn: Address; tokenOut: Address; triggerAbove: boolean; triggerPrice: bigint; amountIn: bigint}

/** Encrypts form values and submits opaque handles to WraithVault. */
export function useSubmitOrder() {
  const {data: walletClient} = useWalletClient()
  const {writeContractAsync, isPending, error: writeError, data: hash} = useWriteContract()
  const [error, setError] = useState<Error | null>(null)
  const [isEncrypting, setIsEncrypting] = useState(false)

  /** Encrypts and submits one order. */
  async function submitOrder(input: SubmitInput): Promise<`0x${string}` | undefined> {
    setError(null)
    const vaultAddress = getVaultAddress()
    if (!walletClient || !vaultAddress) throw new Error('connect a wallet and configure the vault address')
    setIsEncrypting(true)
    try {
      const encrypted = await encryptOrderInputs(input.triggerPrice, input.amountIn, vaultAddress, walletClient)
      return await writeContractAsync({address: vaultAddress, abi: vaultAbi, functionName: 'submitOrder', args: [input.tokenIn, input.tokenOut, input.triggerAbove, encrypted.triggerPriceHandle, encrypted.triggerPriceProof, encrypted.amountInHandle, encrypted.amountInProof]})
    } catch (caught) {
      const nextError = caught instanceof Error ? caught : new Error('order submission failed')
      setError(nextError)
      return undefined
    } finally {
      setIsEncrypting(false)
    }
  }

  return {submitOrder, isPending, isEncrypting, error: error || writeError, hash}
}

