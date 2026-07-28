import 'dotenv/config'
import {getAddress, type Address} from 'viem'

/** Reads and validates keeper configuration from environment variables. */
export function getKeeperConfig() {
  const rpcUrl = process.env.KEEPER_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL
  const privateKey = process.env.KEEPER_PRIVATE_KEY as `0x${string}` | undefined
  const vaultAddress = process.env.KEEPER_VAULT_ADDRESS || process.env.NEXT_PUBLIC_WRAITH_VAULT_ADDRESS
  const poolAddress = process.env.KEEPER_POOL_ADDRESS || process.env.NEXT_PUBLIC_DEMO_POOL_ADDRESS
  const pollIntervalMs = Number(process.env.KEEPER_POLL_INTERVAL_MS || '15000')

  if (!rpcUrl || !privateKey || !vaultAddress || !poolAddress) {
    throw new Error('missing keeper RPC, private key, vault address, or pool address')
  }

  return {
    rpcUrl,
    privateKey,
    vaultAddress: getAddress(vaultAddress) as Address,
    poolAddress: getAddress(poolAddress) as Address,
    pollIntervalMs,
  }
}

