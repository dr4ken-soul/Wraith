'use client'

import Link from 'next/link'
import {AnimatePresence, motion, useDragControls} from 'motion/react'
import {useRef, useState} from 'react'
import {useAccount, useDisconnect} from 'wagmi'
import {ConnectModal} from '@/components/ui/ConnectModal'

/** Renders the fixed wordmark, wallet pill, and D2 edge drawer. */
export function Nav() {
  const {address, isConnected} = useAccount()
  const {disconnect} = useDisconnect()
  const [open, setOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const controls = useDragControls()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : ''

  /** Opens the wallet modal or disconnects the connected wallet. */
  function handleWalletClick(): void {
    if (isConnected) disconnect()
    else setShowModal(true)
  }

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-[var(--z-sticky)] flex items-start justify-between p-5 md:p-6 md:px-8" aria-label="Primary navigation">
        <Link href="/" className="font-mono text-sm uppercase tracking-[0.3em] text-[var(--text-primary)]">WRAITH</Link>
        <button type="button" onClick={handleWalletClick} className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2 font-mono text-xs text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--accent)] hover:shadow-[var(--accent-shadow)] md:px-5 md:text-sm">
          {isConnected && <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" aria-hidden="true" />}
          {isConnected ? shortAddress : 'CONNECT WALLET'}
        </button>
      </nav>
      <button ref={triggerRef} type="button" aria-label="Open navigation drawer" onClick={() => setOpen(true)} onPointerDown={(event) => controls.start(event)} className="fixed right-0 top-0 z-[var(--z-sticky)] h-full w-6 cursor-grab active:cursor-grabbing">
        <span className="absolute right-0 top-1/2 h-16 w-[3px] -translate-y-1/2 rounded-full bg-[var(--border-default)]" />
      </button>
      <AnimatePresence>
        {open && <motion.button type="button" aria-label="Close navigation drawer" onClick={() => setOpen(false)} className="fixed inset-0 z-[var(--z-scrim)] bg-black/60 backdrop-blur-sm" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} />}
      </AnimatePresence>
      <AnimatePresence>
        {open && <motion.aside drag="x" dragControls={controls} dragConstraints={{left: 0, right: 0}} dragElastic={0.05} onDragEnd={(_, info) => { if (info.offset.x > 60 || info.velocity.x > 200) setOpen(false) }} initial={{x: '100%'}} animate={{x: 0}} exit={{x: '100%'}} transition={{type: 'spring', stiffness: 300, damping: 32}} className="fixed right-0 top-0 z-[var(--z-drawer)] flex h-full w-[85vw] max-w-[360px] flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)] px-8 py-10">
          <div className="flex items-center justify-between"><p className="eyebrow text-[var(--text-muted)]">SECONDARY LINKS</p><button type="button" aria-label="Close navigation drawer" onClick={() => setOpen(false)} className="icon-button"><span className="material-icons" aria-hidden="true">close</span></button></div>
          <div className="mt-8 flex flex-col">
            {[['Docs', 'https://docs.iex.ec/'], ['GitHub', 'https://github.com/dr4ken-soul/Wraith'], ['feedback.md', 'https://github.com/dr4ken-soul/Wraith/blob/main/feedback.md'], ['X', 'https://x.com/iEx_ec']].map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="group flex items-center justify-between border-b border-[var(--border-subtle)] py-4 font-body text-base text-[var(--text-primary)] transition-colors hover:text-[var(--accent)]"><span>{label}</span><span className="material-icons text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">arrow_outward</span></a>)}
          </div>
          <p className="mt-auto font-mono text-xs leading-relaxed text-[var(--text-muted)]">Deployed on ETH Sepolia · confidential compute by iExec Nox</p>
        </motion.aside>}
      </AnimatePresence>
      <ConnectModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
