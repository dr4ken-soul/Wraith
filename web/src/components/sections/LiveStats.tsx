'use client'

import {motion} from 'motion/react'
import {useReadContract} from 'wagmi'
import {formatUnits} from 'viem'
import {getVaultAddress, vaultAbi} from '@/lib/contract'

/** Displays a live metric with a repeatable viewport entrance. */
function Metric({value, label, suffix = ''}: {value?: string; label: string; suffix?: string}) {
  return <motion.div className="text-center md:border-r md:border-[var(--border-subtle)] md:last:border-0" initial={{opacity: 0, filter: 'blur(10px)', y: 20}} whileInView={{opacity: 1, filter: 'blur(0px)', y: 0}} viewport={{once: false, amount: 0.1}} transition={{duration: 0.8, ease: 'easeOut'}}><div className="font-display text-5xl font-extrabold leading-none text-[var(--text-primary)] md:text-6xl lg:text-7xl">{value === undefined ? <span className="skeleton mx-auto block h-14 w-28" /> : `${value}${suffix}`}</div><p className="mt-3 font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">{label}</p></motion.div>
}

/** Reads filled count and routed volume directly from WraithVault. */
export function LiveStats() {
  const vaultAddress = getVaultAddress()
  const liveQuery = {enabled: Boolean(vaultAddress), refetchInterval: 15_000, refetchOnWindowFocus: true}
  const filled = useReadContract({address: vaultAddress, abi: vaultAbi, functionName: 'totalOrdersFilled', query: liveQuery})
  const volume = useReadContract({address: vaultAddress, abi: vaultAbi, functionName: 'totalVolumeRouted', query: liveQuery})
  const volumeValue = typeof volume.data === 'bigint' ? formatUnits(volume.data, 6) : undefined
  return <section data-density="dense" className="relative z-10 overflow-hidden bg-[rgba(8,9,11,0.9)] py-24 backdrop-blur-sm md:py-32" aria-labelledby="stats-title"><div className="relative z-10 px-6 md:px-16"><h2 id="stats-title" className="mb-16 text-center font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">LIVE ON ETH SEPOLIA</h2><div className="grid grid-cols-1 gap-10 text-center md:grid-cols-3 md:gap-12"><Metric value={typeof filled.data === 'bigint' ? filled.data.toString() : undefined} label="ORDERS FILLED PRIVATELY" /><Metric value={volumeValue} label="VOLUME ROUTED THROUGH NOX" suffix={volumeValue ? ' USDC' : ''} /><Metric value="0" label="MEMPOOL EXPOSURE" suffix="%" /></div></div></section>
}
