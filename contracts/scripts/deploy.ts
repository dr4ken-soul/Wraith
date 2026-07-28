import {ethers} from 'hardhat'

/**
 * Deploys WraithVault with environment-provided router, keeper, and pool fee.
 */
async function main(): Promise<void> {
  const swapRouter = process.env.NEXT_PUBLIC_UNISWAP_SWAP_ROUTER_ADDRESS
  const keeper = process.env.KEEPER_ADDRESS
  const poolFee = Number(process.env.UNISWAP_POOL_FEE || '3000')

  if (!swapRouter || !keeper) {
    throw new Error('missing NEXT_PUBLIC_UNISWAP_SWAP_ROUTER_ADDRESS or KEEPER_ADDRESS')
  }

  const WraithVault = await ethers.getContractFactory('WraithVault')
  const vault = await WraithVault.deploy(swapRouter, keeper, poolFee)
  await vault.waitForDeployment()
  console.log('WraithVault deployed to:', await vault.getAddress())
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})

