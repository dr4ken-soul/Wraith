import {createPublicClient, createWalletClient, http} from 'viem'
import {sepolia} from 'viem/chains'
import {privateKeyToAccount} from 'viem/accounts'
import {getKeeperConfig} from './config.js'
import {vaultAbi} from './abi/vault.js'
import {getCurrentPrice} from './price.js'
import {evaluateOrder} from './evaluate.js'
import {triggerAndExecute} from './execute.js'

/** Runs one keeper polling cycle and continues after individual order failures. */
async function runCycle(): Promise<void> {
  const config = getKeeperConfig()
  const account = privateKeyToAccount(config.privateKey)
  const publicClient = createPublicClient({chain: sepolia, transport: http(config.rpcUrl)})
  const walletClient = createWalletClient({account, chain: sepolia, transport: http(config.rpcUrl)})
  const currentPrice = await getCurrentPrice(config.poolAddress, publicClient)
  const orderIds = await publicClient.readContract({
    address: config.vaultAddress,
    abi: vaultAbi,
    functionName: 'getOpenOrderIds',
    account,
  })

  for (const orderId of orderIds) {
    try {
      const evaluation = await evaluateOrder(orderId, currentPrice, publicClient, walletClient, config.vaultAddress)
      if (!evaluation.triggered) continue
      await triggerAndExecute(orderId, publicClient, walletClient, config.vaultAddress)
    } catch (error) {
      console.error(`order ${orderId.toString()} failed`, error instanceof Error ? error.message : error)
    }
  }
}

/** Starts the long-running keeper process. */
async function main(): Promise<void> {
  const config = getKeeperConfig()
  console.log(`keeper polling every ${config.pollIntervalMs}ms`)
  await runCycle()
  if (process.env.KEEPER_ONCE === 'true') return
  setInterval(() => {
    void runCycle().catch((error: unknown) => console.error('keeper cycle failed', error))
  }, config.pollIntervalMs)
}

void main().catch((error: unknown) => {
  console.error('keeper startup failed', error)
  process.exitCode = 1
})
