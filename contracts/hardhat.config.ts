import '@nomicfoundation/hardhat-toolbox'
import 'dotenv/config'
import type { HardhatUserConfig } from 'hardhat/config'

const rpcUrl = process.env.KEEPER_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL
const deployerKey = process.env.DEPLOYER_PRIVATE_KEY

const accounts = deployerKey ? [deployerKey] : []

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.35',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: rpcUrl || '',
      accounts,
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || '',
  },
}

export default config
