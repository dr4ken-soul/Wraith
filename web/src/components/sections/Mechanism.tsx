'use client'

import {motion} from 'motion/react'

const layers = [
  ['01', 'ENCRYPT', 'Your price, size and direction become a Nox handle the moment you sign. Nothing readable ever leaves your wallet.'],
  ['02', 'EVALUATE', 'The TEE checks your handle against live Uniswap V3 pricing on every block, without ever decrypting it.'],
  ['03', 'EXECUTE', 'When your condition is met inside the enclave, the swap fires atomically through Uniswap V3. Your threshold was never public.'],
  ['04', 'SETTLE', 'Funds land in your wallet exactly as they would from any Uniswap swap. Full composability, zero exposure.'],
]

/** Explains Wraith’s four confidential execution layers. */
export function Mechanism() {
  return <section id="mechanism" data-density="dense" className="relative z-10 bg-[rgba(8,9,11,0.9)] px-6 py-24 backdrop-blur-sm md:py-32" aria-labelledby="mechanism-title"><div className="mx-auto max-w-4xl"><div className="mb-16 text-center"><p className="eyebrow mb-4">HOW IT WORKS</p><h2 id="mechanism-title" className="font-display text-3xl font-bold uppercase tracking-[-0.5px] text-[var(--text-primary)] md:text-4xl">FOUR STEPS, ZERO EXPOSURE</h2></div><div className="mt-4 flex flex-col gap-4">{layers.map(([number, title, description], index) => <motion.div key={number} className="flex items-start gap-5 rounded-xl border border-[var(--border-default)] bg-[rgba(19,21,25,0.6)] p-6 transition-colors duration-200 hover:border-[var(--accent)]/40 md:p-7" initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: false, amount: 0.1}} transition={{duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.15}}><span className="min-w-[2.5rem] pt-1 font-mono text-xs tracking-wider text-[var(--accent)]">{number}</span><div><h3 className="font-body text-base font-semibold text-[var(--text-primary)] md:text-lg">{title}</h3><p className="mt-1.5 font-body text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p></div></motion.div>)}</div></div></section>
}

