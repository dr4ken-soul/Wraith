'use client'

import Link from 'next/link'
import Image from 'next/image'
import {AnimatePresence, motion, useDragControls} from 'motion/react'
import {useEffect, useRef, useState} from 'react'
import {usePathname, useRouter} from 'next/navigation'
import {useAccount, useDisconnect} from 'wagmi'
import {ConnectModal} from '@/components/ui/ConnectModal'

/** Renders the fixed wordmark, wallet pill, and D2 edge drawer. */
export function Nav() {
  const {address, isConnected} = useAccount()
  const {disconnect} = useDisconnect()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [walletMenuOpen, setWalletMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const controls = useDragControls()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const walletMenuRef = useRef<HTMLDivElement>(null)
  const previousConnection = useRef<boolean | null>(null)
  const isAppInterior = pathname.startsWith('/app')
  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : ''

  /** Sends a newly connected wallet to the app without redirecting on hydration. */
  useEffect(() => {
    if (previousConnection.current !== null) {
      if (!previousConnection.current && isConnected) router.push('/app')
      if (previousConnection.current && !isConnected) router.replace('/')
    }
    previousConnection.current = isConnected
  }, [isConnected, router])

  /** Closes the wallet menu when the user clicks elsewhere or presses Escape. */
  useEffect(() => {
    if (!walletMenuOpen) return

    function handlePointerDown(event: PointerEvent): void {
      if (!walletMenuRef.current?.contains(event.target as Node)) setWalletMenuOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') setWalletMenuOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [walletMenuOpen])

  /** Opens the wallet modal, or toggles the app-interior wallet menu. */
  function handleWalletClick(): void {
    if (!isConnected) {
      setShowModal(true)
      return
    }
    if (isAppInterior) setWalletMenuOpen((current) => !current)
    else router.push('/app')
  }

  /** Disconnects deliberately and returns to the public landing page. */
  function handleDisconnect(): void {
    setWalletMenuOpen(false)
    router.replace('/')
    disconnect()
  }

  /** Copies the full address without exposing it in the visible pill. */
  async function handleCopyAddress(): Promise<void> {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-[var(--z-sticky)] flex items-start justify-between p-5 md:p-6 md:px-8" aria-label="Primary navigation">
        <Link href="/" className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.3em] text-[var(--text-primary)]" aria-label="Wraith home">
          <Image src="/wraith-mark.png" alt="" width={28} height={28} className="h-7 w-7 rounded-md object-cover" priority />
          <span>WRAITH</span>
        </Link>
        <div ref={walletMenuRef} className="relative">
        <button type="button" onClick={handleWalletClick} aria-expanded={isConnected && isAppInterior ? walletMenuOpen : undefined} aria-haspopup={isConnected && isAppInterior ? 'menu' : undefined} className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2 font-mono text-xs text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--accent)] hover:shadow-[var(--accent-shadow)] md:px-5 md:text-sm">
          {isConnected && <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" aria-hidden="true" />}
          {isConnected ? shortAddress : 'CONNECT WALLET'}
          {isConnected && isAppInterior && <span className={`material-icons text-base text-[var(--text-muted)] transition-transform ${walletMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true">expand_more</span>}
        </button>
        <AnimatePresence>
          {walletMenuOpen && isConnected && address && isAppInterior && <motion.div role="menu" aria-label="Wallet details" className="absolute right-0 top-full mt-3 w-72 origin-top-right rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-2xl" initial={{opacity: 0, scale: 0.95, y: -6}} animate={{opacity: 1, scale: 1, y: 0}} exit={{opacity: 0, scale: 0.95, y: -6}} transition={{duration: 0.18, ease: [0.22, 1, 0.36, 1]}}>
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--success)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" aria-hidden="true" />WALLET CONNECTED</div>
              <p className="mt-3 break-all font-mono text-xs text-[var(--text-primary)]">{address}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 border-b border-[var(--border-subtle)] py-4 font-mono text-[10px] uppercase tracking-[0.12em]">
              <div><p className="text-[var(--text-muted)]">Network</p><p className="mt-1 text-[var(--text-secondary)]">Sepolia</p></div>
              <div><p className="text-[var(--text-muted)]">Status</p><p className="mt-1 text-[var(--success)]">Active</p></div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" role="menuitem" onClick={handleCopyAddress} className="flex items-center justify-center gap-1 rounded-lg border border-[var(--border-default)] px-2 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"><span className="material-icons text-sm" aria-hidden="true">{copied ? 'check' : 'content_copy'}</span>{copied ? 'Copied' : 'Copy'}</button>
              <a role="menuitem" href={`https://sepolia.etherscan.io/address/${address}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded-lg border border-[var(--border-default)] px-2 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"><span className="material-icons text-sm" aria-hidden="true">open_in_new</span>Explorer</a>
            </div>
            <button type="button" role="menuitem" onClick={handleDisconnect} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--error)]/50 bg-[var(--error)]/10 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--error)] transition-colors hover:bg-[var(--error)]/20"><span className="material-icons text-sm" aria-hidden="true">logout</span>Disconnect wallet</button>
          </motion.div>}
        </AnimatePresence>
        </div>
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
