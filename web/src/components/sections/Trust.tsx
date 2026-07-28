'use client'

import {motion} from 'motion/react'

const badges = [['NETWORK', 'ETH Sepolia'], ['COMPUTE LAYER', 'iExec Nox'], ['SETTLEMENT', 'Uniswap V3'], ['AUDIT TRAIL', 'feedback.md in repo']]

/** Renders the technical credibility section and badge stack. */
export function Trust() {
  return <section data-density="sparse" className="relative z-10 px-6 py-24 md:px-8 md:py-32" aria-labelledby="trust-title"><div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 md:gap-16 lg:grid-cols-2"><motion.div initial={{opacity: 0, x: -20}} whileInView={{opacity: 1, x: 0}} viewport={{once: false, amount: 0.1}} transition={{duration: 0.7, ease: 'easeOut', delay: 0.3}}><p className="eyebrow mb-4">UNDER THE HOOD</p><h2 id="trust-title" className="font-display text-3xl font-bold uppercase leading-tight tracking-[-0.5px] text-[var(--text-primary)] md:text-4xl lg:text-5xl">NOTHING READABLE EVER LEAVES YOUR WALLET</h2><p className="mt-5 max-w-lg font-body text-base leading-relaxed text-[var(--text-secondary)]">Nox combines on-chain contracts with off-chain Trusted Execution Environments. Your order is processed as encrypted state inside the enclave and only the final swap ever touches the chain. Uniswap V3 is never modified, Wraith sits on top of it.</p></motion.div><motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-2" initial={{opacity: 0, x: 20}} whileInView={{opacity: 1, x: 0}} viewport={{once: false, amount: 0.1}} transition={{duration: 0.7, ease: 'easeOut', delay: 0.5}}>{badges.map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--border-default)] bg-[rgba(19,21,25,0.7)] p-5">{/* Trust badge icon slot: add an approved Material Icon if supplied */}<p className="mt-3 font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">{label}</p><p className="mt-1 font-body text-sm text-[var(--text-primary)]">{value}</p></div>)}</motion.div></div></section>
}
