'use client'

import Link from 'next/link'
import {useEffect, useState} from 'react'
import {useAccount, useReadContract, useWalletClient, useWriteContract} from 'wagmi'
import {formatUnits} from 'viem'
import {createViemHandleClient} from '@iexec-nox/handle'
import {getOrderStatus, getVaultAddress, vaultAbi} from '@/lib/contract'
import {OrderTicket} from '@/components/ui/OrderTicket'

type RawOrder = {tokenIn: `0x${string}`; tokenOut: `0x${string}`; triggerAbove: boolean; triggerPrice: `0x${string}`; amountIn: `0x${string}`; status: number; createdAt: bigint}
type Decrypted = {triggerPrice?: string; amountIn?: string}

/** Reads and decrypts only the connected wallet’s order tickets. */
export default function DashboardPage() {
  const {address} = useAccount()
  const {data: walletClient} = useWalletClient()
  const vaultAddress = getVaultAddress()
  const ordersRead = useReadContract({address: vaultAddress, abi: vaultAbi, functionName: 'getMyOrders', query: {enabled: Boolean(vaultAddress && address)}})
  const idsRead = useReadContract({address: vaultAddress, abi: vaultAbi, functionName: 'getMyOrderIds', query: {enabled: Boolean(vaultAddress && address)}})
  const {writeContractAsync, isPending: cancelPending} = useWriteContract()
  const [decrypted, setDecrypted] = useState<Record<string, Decrypted>>({})

  useEffect(() => {
    let active = true
    async function decryptOrders(): Promise<void> {
      if (!walletClient || !ordersRead.data) return
      const client = await createViemHandleClient(walletClient)
      const values = await Promise.all((ordersRead.data as unknown as RawOrder[]).map(async (order, index) => {
        try {
          const [price, amount] = await Promise.all([client.decrypt(order.triggerPrice), client.decrypt(order.amountIn)])
          return [String(index), {triggerPrice: String(price.value), amountIn: formatUnits(BigInt(amount.value as unknown as string), 18)}] as const
        } catch {
          return [String(index), {}] as const
        }
      }))
      if (active) setDecrypted(Object.fromEntries(values))
    }
    void decryptOrders()
    return () => { active = false }
  }, [ordersRead.data, walletClient])

  /** Cancels an open order through the owner wallet. */
  async function cancelOrder(orderId: bigint): Promise<void> {
    if (!vaultAddress) return
    await writeContractAsync({address: vaultAddress, abi: vaultAbi, functionName: 'cancelOrder', args: [orderId]})
  }

  const orders = (ordersRead.data || []) as unknown as RawOrder[]
  const orderIds = (idsRead.data || []) as bigint[]
  return <section className="relative z-10 min-h-[100dvh] px-6 pb-24 pt-32 md:px-8"><div className="mx-auto max-w-6xl"><div className="flex flex-col justify-between gap-6 border-b border-[var(--border-subtle)] pb-8 md:flex-row md:items-end"><div><p className="eyebrow">PRIVATE ORDER BOOK</p><h1 className="mt-3 font-display text-5xl uppercase leading-none text-[var(--text-primary)] md:text-6xl">Your orders</h1><p className="mt-4 max-w-xl font-body text-sm leading-relaxed text-[var(--text-secondary)]">Read directly from WraithVault. Trigger prices and sizes are requested through the Nox handle only for this connected wallet.</p></div><Link href="/app/orders/new" className="button-primary">Place an order<span className="button-icon"><span className="material-icons text-sm" aria-hidden="true">arrow_forward</span></span></Link></div>{ordersRead.isLoading ? <div className="mt-10 grid gap-5 md:grid-cols-2"><div className="skeleton h-72" /><div className="skeleton h-72" /></div> : ordersRead.error ? <div role="alert" className="mt-10 border border-[var(--error)]/40 bg-[var(--error)]/10 p-5 font-mono text-xs text-[var(--error)]">Vault read failed: {ordersRead.error.message}</div> : orders.length === 0 ? <div className="mt-10 border border-[var(--border-default)] p-8 text-center"><span className="material-icons text-[var(--accent)]" aria-hidden="true">visibility_off</span><h2 className="mt-3 font-display text-3xl uppercase text-[var(--text-primary)]">No orders yet</h2><p className="mt-2 font-body text-sm text-[var(--text-secondary)]">Your first encrypted order will appear here after the transaction confirms.</p></div> : <div className="mt-10 grid gap-5 md:grid-cols-2">{orders.map((order, index) => <OrderTicket key={`${orderIds[index]?.toString() || index}-${order.createdAt.toString()}`} orderId={orderIds[index] || BigInt(index + 1)} tokenIn={order.tokenIn} tokenOut={order.tokenOut} triggerAbove={order.triggerAbove} status={getOrderStatus(order.status)} createdAt={order.createdAt} triggerPrice={decrypted[index]?.triggerPrice} amountIn={decrypted[index]?.amountIn} onCancel={() => cancelOrder(orderIds[index] || BigInt(index + 1))} cancelPending={cancelPending} />)}</div>}</div></section>
}
