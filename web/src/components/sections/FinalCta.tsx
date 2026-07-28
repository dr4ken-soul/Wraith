'use client'

import Link from 'next/link'
import {motion} from 'motion/react'
import {useAccount} from 'wagmi'
import {useState} from 'react'
import {ConnectModal} from '@/components/ui/ConnectModal'

/** Renders the final conversion moment for the encrypted order flow. */
export function FinalCta() {
  const {isConnected} = useAccount()
  const [showModal, setShowModal] = useState(false)
  return <section data-density="hero" className="relative z-10 flex items-center justify-center overflow-hidden py-32 md:py-40" aria-labelledby="final-cta-title"><div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-6 text-center"><motion.h2 id="final-cta-title" className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[-1px] text-[var(--text-primary)] md:text-5xl lg:text-6xl" initial={{opacity: 0, filter: 'blur(10px)', y: 24}} whileInView={{opacity: 1, filter: 'blur(0px)', y: 0}} viewport={{once: false, amount: 0.1}} transition={{duration: 0.8, ease: 'easeOut'}}>PLACE YOUR FIRST INVISIBLE ORDER</motion.h2><motion.p className="mt-5 max-w-md font-body text-base text-[var(--text-secondary)]" initial={{opacity: 0, y: 16}} whileInView={{opacity: 1, y: 0}} viewport={{once: false, amount: 0.1}} transition={{duration: 0.7, ease: 'easeOut', delay: 0.2}}>Connect a wallet on Sepolia and set your first encrypted limit order in under a minute.</motion.p><motion.div className="mt-9" initial={{opacity: 0, y: 16}} whileInView={{opacity: 1, y: 0}} viewport={{once: false, amount: 0.1}} transition={{duration: 0.7, ease: 'easeOut', delay: 0.4}}>{isConnected ? <Link href="/app/orders/new" className="button-primary">Place an order<span className="button-icon"><span className="material-icons text-sm" aria-hidden="true">arrow_forward</span></span></Link> : <button type="button" onClick={() => setShowModal(true)} className="button-primary">Connect wallet<span className="button-icon"><span className="material-icons text-sm" aria-hidden="true">arrow_forward</span></span></button>}</motion.div></div><ConnectModal isOpen={showModal} onClose={() => setShowModal(false)} /></section>
}

