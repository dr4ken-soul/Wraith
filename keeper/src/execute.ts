import type {PublicClient, WalletClient, Address, Hash} from 'viem'
import {parseEventLogs} from 'viem'
import {sepolia} from 'viem/chains'
import {createViemHandleClient} from '@iexec-nox/handle'
import {vaultAbi} from './abi/vault.js'

type HandleClient = Awaited<ReturnType<typeof createViemHandleClient>>

/** Polls a public Nox handle until a value is available. */
async function waitForAmount(handleClient: HandleClient, amountHandle: `0x${string}`): Promise<bigint> {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const result = await handleClient.publicDecrypt(amountHandle)
      return BigInt(result.value as string | number | bigint)
    } catch {
      await new Promise((resolve) => setTimeout(resolve, Math.min(2000 + attempt * 1000, 7000)))
    }
  }
  throw new Error('amount decryption did not complete')
}

/** Waits for the public amount and settles a triggered swap. */
export async function executeTriggered(
  orderId: bigint,
  amountHandle: `0x${string}`,
  publicClient: PublicClient,
  walletClient: WalletClient,
  vaultAddress: Address,
): Promise<{markHash: Hash; executeHash: Hash; amount: bigint}> {
  const account = walletClient.account
  if (!account) throw new Error('keeper wallet client has no account')
  const handleClient = await createViemHandleClient(walletClient)
  const amount = await waitForAmount(handleClient, amountHandle)
  const executeHash = await walletClient.writeContract({
    account,
    chain: sepolia,
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'executeOrder',
    args: [orderId, amount],
  })
  await publicClient.waitForTransactionReceipt({hash: executeHash})
  console.log(`order ${orderId.toString()} executed amount ${amount.toString()} tx ${executeHash}`)
  return {markHash: executeHash, executeHash, amount}
}

/** Marks a true evaluation, waits for the amount, and settles the swap. */
export async function triggerAndExecute(
  orderId: bigint,
  publicClient: PublicClient,
  walletClient: WalletClient,
  vaultAddress: Address,
): Promise<{markHash: Hash; executeHash: Hash; amount: bigint}> {
  const account = walletClient.account
  if (!account) throw new Error('keeper wallet client has no account')
  const markHash = await walletClient.writeContract({
    account,
    chain: sepolia,
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'markTriggered',
    args: [orderId],
  })
  const markReceipt = await publicClient.waitForTransactionReceipt({hash: markHash})
  const logs = parseEventLogs({abi: vaultAbi, logs: markReceipt.logs, eventName: 'OrderTriggered'})
  const amountHandle = logs.find((log) => log.args.orderId === orderId)?.args.amountHandle
  if (!amountHandle) throw new Error(`amount handle missing for order ${orderId}`)
  const settled = await executeTriggered(orderId, amountHandle, publicClient, walletClient, vaultAddress)
  return {...settled, markHash}
}
