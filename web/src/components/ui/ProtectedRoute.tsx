'use client'

import {useEffect, type ReactNode} from 'react'
import {useAccount} from 'wagmi'
import {usePathname, useRouter} from 'next/navigation'

/** Gates app interiors while preserving hydration and direct deep links. */
export function ProtectedRoute({children}: {children: ReactNode}) {
  const {isConnected, isReconnecting, isConnecting} = useAccount()
  const router = useRouter()
  const pathname = usePathname()
  const hydrating = isReconnecting || isConnecting

  useEffect(() => {
    if (!hydrating && !isConnected) router.replace(`/?returnTo=${encodeURIComponent(pathname)}`)
  }, [hydrating, isConnected, pathname, router])

  if (hydrating) return <div className="relative z-10 flex min-h-[100dvh] items-center justify-center"><div className="skeleton h-24 w-64" /></div>
  if (!isConnected) return <div className="relative z-10 flex min-h-[100dvh] items-center justify-center"><div className="skeleton h-24 w-64" /></div>
  return <>{children}</>
}
