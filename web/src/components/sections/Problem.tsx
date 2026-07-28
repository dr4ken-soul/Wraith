'use client'

import {motion} from 'motion/react'

/** Renders the single-line mempool problem statement. */
export function Problem() {
  const words = 'PUBLIC ORDERS GET FRONT-RUN BEFORE THEY FILL.'.split(' ')
  return <section data-density="sparse" className="relative z-10 flex items-center justify-center px-6 py-28 md:py-40" aria-labelledby="problem-title"><div className="w-full text-center"><h2 id="problem-title" className="font-display text-[clamp(2rem,7vw,5.5rem)] font-extrabold uppercase leading-[0.95] tracking-[-1px] text-[var(--text-primary)]">{words.map((word, index) => <motion.span key={`${word}-${index}`} className="mr-[0.18em] inline-block" initial={{opacity: 0, filter: 'blur(8px)', y: 20}} whileInView={{opacity: 1, filter: 'blur(0px)', y: 0}} viewport={{once: false, amount: 0.1}} transition={{duration: 0.6, ease: 'easeOut', delay: index * 0.09}}>{word}</motion.span>)}</h2><motion.p className="mt-8 font-mono text-xs tracking-[0.2em] text-[var(--text-muted)]" initial={{opacity: 0}} whileInView={{opacity: 1}} viewport={{once: false, amount: 0.1}} transition={{duration: 0.6, ease: 'easeOut', delay: 0.9}}>MEV BOTS READ THE MEMPOOL. WRAITH DOESN'T LET THEM READ YOURS.</motion.p></div></section>
}

