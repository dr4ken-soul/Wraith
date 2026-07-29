'use client'

import {useEffect, useState, type ReactNode} from 'react'
import {useAccount} from 'wagmi'
import {usePathname, useRouter} from 'next/navigation'

/** Gates app interiors while preserving hydration and direct deep links. */
export function ProtectedRoute({children}: {children: ReactNode}) {
  const {isConnected, isReconnecting, isConnecting} = useAccount()
  const router = useRouter()
  const pathname = usePathname()
  const hydrating = isReconnecting || isConnecting
  const [hydrationSettled, setHydrationSettled] = useState(false)

  /** Gives persisted wagmi state time to hydrate before making a route decision. */
  useEffect(() => {
    setHydrationSettled(false)
    const timer = window.setTimeout(() => setHydrationSettled(true), 750)
    return () => window.clearTimeout(timer)
  }, [hydrating])

  useEffect(() => {
    if (hydrationSettled && !hydrating && !isConnected) router.replace(`/?returnTo=${encodeURIComponent(pathname)}`)
  }, [hydrationSettled, hydrating, isConnected, pathname, router])

  if (hydrating || !hydrationSettled || !isConnected) return <div className="relative z-10 flex min-h-[100dvh] items-center justify-center"><div className="skeleton h-24 w-64" /></div>
  return <>{children}</>
}
