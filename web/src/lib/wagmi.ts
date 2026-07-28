import {http} from 'viem'
import {createConfig} from 'wagmi'
import {sepolia} from 'wagmi/chains'
import {injected} from 'wagmi/connectors'

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'

/** Wagmi configuration for Ethereum Sepolia. */
export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [
    injected({shimDisconnect: true}),
  ],
  transports: {
    [sepolia.id]: http(rpcUrl),
  },
})

export {sepolia}
