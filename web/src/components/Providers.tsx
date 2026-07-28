'use client'

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {WagmiProvider} from 'wagmi'
import {useState, type ReactNode} from 'react'
import {wagmiConfig} from '@/lib/wagmi'
import {WraithField} from '@/components/three/WraithField'
import {ErrorBoundary} from '@/components/ui/ErrorBoundary'

/** Provides wallet, query, error containment, and the shared WraithField. */
export function Providers({children}: {children: ReactNode}) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <WraithField />
          {children}
        </ErrorBoundary>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

