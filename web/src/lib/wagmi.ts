import {http} from 'viem'
import {createConfig} from 'wagmi'
import {sepolia} from 'wagmi/chains'
import {injected, walletConnect} from 'wagmi/connectors'

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

const connectors = [
  injected({shimDisconnect: true}),
  ...(walletConnectProjectId ? [walletConnect({projectId: walletConnectProjectId, showQrModal: true})] : []),
]

/** Wagmi configuration for Ethereum Sepolia. */
export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors,
  transports: {
    [sepolia.id]: http(rpcUrl),
  },
})

export {sepolia}
