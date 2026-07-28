'use client'

import {AnimatePresence, motion} from 'motion/react'
import {useConnect} from 'wagmi'

type ConnectModalProps = {isOpen: boolean; onClose: () => void}

/** Handles wallet connection states in a contained, retryable modal. */
export function ConnectModal({isOpen, onClose}: ConnectModalProps) {
  const {connect, connectors, isPending, error, reset} = useConnect()
  const connector = connectors[0]

  /** Starts the selected wallet connection flow. */
  function handleConnect(): void {
    if (!connector) return
    connect({connector}, {onSuccess: onClose})
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="connect-title" className="double-bezel relative z-[var(--z-modal)] w-full max-w-md" initial={{opacity: 0, filter: 'blur(10px)', y: 20, scale: 0.96}} animate={{opacity: 1, filter: 'blur(0px)', y: 0, scale: 1}} exit={{opacity: 0, y: 10, scale: 0.98}} transition={{duration: 0.35, ease: [0.16, 1, 0.3, 1]}}>
            <div className="double-bezel-core p-7">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="eyebrow">WALLET ACCESS</p>
                  <h2 id="connect-title" className="mt-3 font-display text-3xl uppercase text-[var(--text-primary)]">Connect on Sepolia</h2>
                </div>
                <button type="button" aria-label="Close wallet connection dialog" disabled={isPending} onClick={onClose} className="icon-button"><span className="material-icons" aria-hidden="true">close</span></button>
              </div>
              <p className="mt-4 font-body text-sm leading-relaxed text-[var(--text-secondary)]">Wraith reads your own orders from the vault and signs encrypted submissions from your wallet.</p>
              {error && <p role="alert" className="mt-4 border border-[var(--error)]/40 bg-[var(--error)]/10 p-3 font-mono text-xs leading-relaxed text-[var(--error)]">{error.message}</p>}
              <button type="button" disabled={isPending || !connector} onClick={error ? reset : handleConnect} className="button-primary mt-6 w-full justify-center">
                <span>{isPending ? 'Waiting for wallet' : error ? 'Try again' : 'Connect wallet'}</span>
                <span className="button-icon"><span className="material-icons text-sm" aria-hidden="true">arrow_forward</span></span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

