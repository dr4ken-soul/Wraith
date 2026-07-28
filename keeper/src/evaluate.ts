import type {PublicClient, WalletClient, Address, Hash} from 'viem'
import {parseEventLogs} from 'viem'
import {sepolia} from 'viem/chains'
import {createViemHandleClient} from '@iexec-nox/handle'
import {vaultAbi} from './abi/vault.js'

type HandleClient = Awaited<ReturnType<typeof createViemHandleClient>>

/** Waits for an asynchronous Nox public decryption result. */
async function pollPublicDecrypt(handleClient: HandleClient, resultHandle: `0x${string}`): Promise<unknown> {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      return await handleClient.publicDecrypt(resultHandle)
    } catch {
      await new Promise((resolve) => setTimeout(resolve, Math.min(2000 + attempt * 1000, 7000)))
    }
  }
  return false
}

/** Requests a confidential evaluation and polls until the Runner answers. */
export async function evaluateOrder(
  orderId: bigint,
  currentPrice: bigint,
  publicClient: PublicClient,
  walletClient: WalletClient,
  vaultAddress: Address,
): Promise<{triggered: boolean; receiptHash: Hash}> {
  const account = walletClient.account
  if (!account) throw new Error('keeper wallet client has no account')

  const handleClient = await createViemHandleClient(walletClient)
  const requestHash = await walletClient.writeContract({
    account,
    chain: sepolia,
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'requestEvaluation',
    args: [orderId, currentPrice],
  })
  const receipt = await publicClient.waitForTransactionReceipt({hash: requestHash})
  const logs = parseEventLogs({abi: vaultAbi, logs: receipt.logs, eventName: 'EvaluationRequested'})
  const resultHandle = logs.find((log) => log.args.orderId === orderId)?.args.resultHandle
  if (!resultHandle) throw new Error(`evaluation handle missing for order ${orderId}`)

  const decrypted = await pollPublicDecrypt(handleClient, resultHandle)
  return {triggered: Boolean(decrypted), receiptHash: requestHash}
}
