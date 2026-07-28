import type {Metadata} from 'next'
import {Providers} from '@/components/Providers'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Wraith · Invisible limit orders',
  description: 'Private Uniswap V3 limit orders powered by iExec Nox on Ethereum Sepolia',
}

/** Provides the shared shell for every Wraith route. */
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><head><link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" /></head><body><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-toast)] focus:rounded-full focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-[var(--button-text)]">Skip to main content</a><Providers>{children}</Providers></body></html>
}

