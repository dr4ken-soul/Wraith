import type {PublicClient, Address} from 'viem'
import {poolAbi} from './abi/pool.js'

/**
 * Reads the public Uniswap V3 price and converts sqrtPriceX96 to the vault scale.
 */
export async function getCurrentPrice(poolAddress: Address, publicClient: PublicClient): Promise<bigint> {
  const [sqrtPriceX96] = await publicClient.readContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: 'slot0',
  })
  return (sqrtPriceX96 * sqrtPriceX96) >> 192n
}

