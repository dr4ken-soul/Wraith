'use client'

import {motion} from 'motion/react'

type ComparisonRow = [string, string]
type ComparisonCard = [string, string, ComparisonRow[]]

const cards: ComparisonCard[] = [
  ['WRAITH', 'border-[var(--accent)]/40 bg-[var(--bg-surface)] shadow-[var(--glass-shadow)]', [['Order visibility', 'Never'], ['Front-running risk', 'None'], ['Custody', 'Self, non-custodial'], ['Composability', 'Full, native Uniswap V3']]],
  ['PUBLIC LIMIT ORDER', 'border-[var(--border-default)] bg-[rgba(19,21,25,0.6)]', [['Order visibility', 'Full mempool exposure'], ['Front-running risk', 'High'], ['Custody', 'Self, non-custodial'], ['Composability', 'Full']]],
  ['CEX LIMIT ORDER', 'border-[var(--border-default)] bg-[rgba(19,21,25,0.6)]', [['Order visibility', 'Hidden from public, visible to exchange'], ['Front-running risk', 'Low, but exchange-dependent'], ['Custody', 'Custodial'], ['Composability', 'None, off-chain']]],
]

/** Compares Wraith with public on-chain and custodial alternatives. */
export function Comparison() {
  return <section data-density="dense" className="relative z-10 bg-[rgba(8,9,11,0.9)] px-6 py-24 backdrop-blur-sm md:py-32" aria-labelledby="comparison-title"><div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-12"><div className="mb-12 lg:col-span-12"><p className="eyebrow mb-3">THE DIFFERENCE</p><h2 id="comparison-title" className="font-display text-3xl font-bold uppercase tracking-[-0.5px] text-[var(--text-primary)] md:text-4xl">NOWHERE ELSE IS YOUR ORDER INVISIBLE</h2></div>{cards.map(([title, style, rows], index) => <motion.div key={title} className={`lg:col-span-4 rounded-2xl border p-7 ${style}`} initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: false, amount: 0.1}} transition={{duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.12}} whileHover={index === 0 ? {y: -4, transition: {type: 'spring', stiffness: 260, damping: 22}} : undefined}><h3 className={`font-body text-lg font-semibold ${index === 0 ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>{title}</h3><div className="mt-4">{rows.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-5 border-b border-[var(--border-subtle)] py-3 last:border-0"><span className="text-sm text-[var(--text-secondary)]">{label}</span><span className="text-right font-mono text-xs text-[var(--text-primary)]">{value}</span></div>)}</div></motion.div>)}</div></section>
}
