'use client'

import Link from 'next/link'
import {useRef, useState} from 'react'
import {useRouter} from 'next/navigation'
import {useAccount} from 'wagmi'
import {getAddress, parseUnits, type Address} from 'viem'
import {useSubmitOrder} from '@/hooks/useSubmitOrder'

const defaultTokenIn = process.env.NEXT_PUBLIC_DEMO_TOKEN_IN_ADDRESS || ''
const defaultTokenOut = process.env.NEXT_PUBLIC_DEMO_TOKEN_OUT_ADDRESS || ''

/** Renders the live encrypted limit-order form. */
export default function NewOrderPage() {
  const router = useRouter()
  const {isConnected} = useAccount()
  const {submitOrder, isPending, isEncrypting, error, hash} = useSubmitOrder()
  const [tokenIn, setTokenIn] = useState(defaultTokenIn)
  const [tokenOut, setTokenOut] = useState(defaultTokenOut)
  const [triggerPrice, setTriggerPrice] = useState('')
  const [amountIn, setAmountIn] = useState('')
  const [triggerAbove, setTriggerAbove] = useState(true)
  const [formError, setFormError] = useState('')
  const firstInvalid = useRef<HTMLInputElement>(null)

  /** Validates the visible fields and starts Nox encryption. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setFormError('')
    try {
      const inputToken = getAddress(tokenIn) as Address
      const outputToken = getAddress(tokenOut) as Address
      const encryptedPrice = parseUnits(triggerPrice, 6)
      const encryptedAmount = parseUnits(amountIn, 18)
      if (encryptedPrice <= 0n || encryptedAmount <= 0n) throw new Error('Trigger price and size must be greater than zero')
      const transactionHash = await submitOrder({tokenIn: inputToken, tokenOut: outputToken, triggerAbove, triggerPrice: encryptedPrice, amountIn: encryptedAmount})
      if (transactionHash) router.push('/app')
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Check the form values and try again')
      firstInvalid.current?.focus()
    }
  }

  return <section className="relative z-10 min-h-[100dvh] px-6 pb-24 pt-32 md:px-8"><div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-2"><div><Link href="/app" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"><span className="material-icons text-sm" aria-hidden="true">arrow_back</span>Back to orders</Link><p className="eyebrow mt-12">NEW ENCRYPTED ORDER</p><h1 className="mt-3 max-w-xl font-display text-5xl uppercase leading-none text-[var(--text-primary)] md:text-6xl">Set a price<br />without a signal</h1><p className="mt-5 max-w-lg font-body text-base leading-relaxed text-[var(--text-secondary)]">The trigger price and input size are encrypted in your wallet before the vault sees the transaction. Pair and direction remain public in this MVP.</p><div className="mt-10 border-l border-[var(--accent)]/40 pl-5"><p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--accent)]">BEFORE YOU SIGN</p><p className="mt-2 font-body text-sm leading-relaxed text-[var(--text-secondary)]">Approve the vault for the exact token amount you want to trade. Wraith never asks you to deposit funds.</p></div></div><form onSubmit={handleSubmit} className="double-bezel"><div className="double-bezel-core p-6 md:p-8"><div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-5"><div><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">ORDER TICKET</p><p className="mt-1 font-body text-sm text-[var(--text-secondary)]">ETH Sepolia · Nox encrypted</p></div><span className="flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--accent-glow)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--accent)]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" aria-hidden="true" />PRIVATE</span></div><div className="mt-6 space-y-5"><div><label htmlFor="token-in" className="field-label">Token in address</label><input id="token-in" value={tokenIn} onChange={(event) => setTokenIn(event.target.value)} required className="field-input" placeholder="0x…" /></div><div><label htmlFor="token-out" className="field-label">Token out address</label><input id="token-out" value={tokenOut} onChange={(event) => setTokenOut(event.target.value)} required className="field-input" placeholder="0x…" /></div><div><label htmlFor="trigger-price" className="field-label">Trigger price · 6 decimals</label><input ref={firstInvalid} id="trigger-price" inputMode="decimal" value={triggerPrice} onChange={(event) => setTriggerPrice(event.target.value)} required className="field-input" placeholder="2847.600000" /></div><div><label htmlFor="amount-in" className="field-label">Size · token decimals</label><input id="amount-in" inputMode="decimal" value={amountIn} onChange={(event) => setAmountIn(event.target.value)} required className="field-input" placeholder="0.840000000000000000" /></div><fieldset><legend className="field-label">Trigger direction</legend><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setTriggerAbove(true)} className={`rounded-lg border px-4 py-3 font-mono text-xs transition-colors ${triggerAbove ? 'border-[var(--accent)] bg-[var(--accent-glow)] text-[var(--accent)]' : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--accent)]'}`}>Price rises to</button><button type="button" onClick={() => setTriggerAbove(false)} className={`rounded-lg border px-4 py-3 font-mono text-xs transition-colors ${!triggerAbove ? 'border-[var(--accent)] bg-[var(--accent-glow)] text-[var(--accent)]' : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--accent)]'}`}>Price falls to</button></div></fieldset></div>{(formError || error) && <p role="alert" className="mt-5 border border-[var(--error)]/40 bg-[var(--error)]/10 p-3 font-mono text-xs leading-relaxed text-[var(--error)]">{formError || error?.message}</p>}{hash && <p className="mt-5 border border-[var(--success)]/40 bg-[var(--success)]/10 p-3 font-mono text-xs leading-relaxed text-[var(--success)]">Transaction submitted: {hash.slice(0, 12)}…</p>}<button type="submit" disabled={!isConnected || isPending || isEncrypting} className="button-primary mt-6 w-full justify-center">{isEncrypting ? 'Encrypting in wallet' : isPending ? 'Waiting for signature' : 'Encrypt and submit'}<span className="button-icon"><span className="material-icons text-sm" aria-hidden="true">lock</span></span></button><p className="mt-4 text-center font-mono text-[10px] leading-relaxed text-[var(--text-muted)]">No plaintext price or size is written to calldata or events.</p></div></form></div></section>
}

