'use client'

import Link from 'next/link'
import {motion} from 'motion/react'
import {useState} from 'react'
import {useAccount} from 'wagmi'
import {ConnectModal} from '@/components/ui/ConnectModal'
import {ScrambleValue} from '@/components/ui/ScrambleValue'

/** Renders the split-screen product proof and wallet entry actions. */
export function Hero() {
  const {isConnected} = useAccount()
  const [showModal, setShowModal] = useState(false)

  /** Opens the wallet flow or routes connected users to the live order form. */
  function handleLaunch(): void {
    if (!isConnected) setShowModal(true)
  }

  return (
    <section data-density="hero" className="relative z-10 grid min-h-[100dvh] grid-cols-1 lg:grid-cols-2" aria-labelledby="hero-title">
      <div className="relative z-10 flex flex-col justify-center px-6 py-24 md:px-12 md:py-20 lg:px-16">
        <motion.p className="eyebrow mb-6" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{duration: 0.6, ease: 'easeOut', delay: 0.2}}>PRIVATE LIMIT ORDERS · BUILT ON NOX</motion.p>
        <motion.h1 id="hero-title" className="max-w-[11ch] font-display text-5xl font-extrabold uppercase leading-[0.92] tracking-[-1px] text-[var(--text-primary)] md:text-6xl lg:text-[5rem]" initial={{opacity: 0, filter: 'blur(10px)', y: 24}} animate={{opacity: 1, filter: 'blur(0px)', y: 0}} transition={{duration: 0.8, ease: 'easeOut', delay: 0.35}}>SET THE PRICE.<br />VANISH UNTIL IT HITS.</motion.h1>
        <motion.p className="mt-6 max-w-[46ch] font-body text-base leading-relaxed text-[var(--text-secondary)] md:text-lg" initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} transition={{duration: 0.7, ease: 'easeOut', delay: 0.55}}>Wraith encrypts your limit order as a Nox handle the moment you sign. The enclave checks it against live Uniswap V3 pricing on every block. When your price is met the swap fires atomically. No mempool exposure, no front-running, full composability preserved.</motion.p>
        <motion.div className="mt-10 flex flex-wrap items-center gap-4" initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} transition={{duration: 0.7, ease: 'easeOut', delay: 0.75}}>
          {isConnected ? <Link href="/app/orders/new" className="button-primary"><span>Place an order</span><span className="button-icon"><span className="material-icons text-sm" aria-hidden="true">arrow_forward</span></span></Link> : <button type="button" onClick={handleLaunch} className="button-primary"><span>Connect wallet</span><span className="button-icon"><span className="material-icons text-sm" aria-hidden="true">arrow_forward</span></span></button>}
          <a href="#mechanism" className="button-secondary">SEE THE MECHANISM</a>
        </motion.div>
      </div>
      <div className="relative z-20 flex items-center justify-center px-6 py-16 md:px-12 lg:py-0">
        <motion.div className="glass-panel w-full max-w-[380px] rounded-2xl p-6 md:p-7" initial={{opacity: 0, y: 30, scale: 0.96}} animate={{opacity: 1, y: 0, scale: 1}} transition={{duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.5}}>
          <div className="mb-5 flex items-center justify-between"><span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">ORDER #4471</span><span className="flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--accent-glow)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--accent)]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" aria-hidden="true" />ENCRYPTED</span></div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {[['Pair', 'ETH / USDC'], ['Trigger price', '2,847.60'], ['Size', '0.84 ETH']].map(([label, value]) => <div key={label} className="flex items-center justify-between py-3"><span className="font-body text-xs text-[var(--text-secondary)]">{label}</span><span className="font-mono text-sm text-[var(--text-primary)]"><ScrambleValue text={value} /></span></div>)}
          </div>
          <p className="mt-5 border-t border-[var(--border-subtle)] pt-4 font-body text-[11px] leading-relaxed text-[var(--text-muted)]">Visible only to the enclave until execution.</p>
        </motion.div>
      </div>
      <ConnectModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </section>
  )
}

