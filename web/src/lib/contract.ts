export const vaultAbi = [
  {
    type: 'function', name: 'getMyOrders', stateMutability: 'view', inputs: [],
    outputs: [{name: 'result', type: 'tuple[]', components: [
      {name: 'owner', type: 'address'}, {name: 'tokenIn', type: 'address'}, {name: 'tokenOut', type: 'address'},
      {name: 'triggerAbove', type: 'bool'}, {name: 'triggerPrice', type: 'bytes32'}, {name: 'amountIn', type: 'bytes32'},
      {name: 'pendingResult', type: 'bytes32'}, {name: 'status', type: 'uint8'}, {name: 'createdAt', type: 'uint256'},
    ]}],
  },
  {type: 'function', name: 'getMyOrderIds', stateMutability: 'view', inputs: [], outputs: [{name: 'ids', type: 'uint256[]'}]},
  {type: 'function', name: 'submitOrder', stateMutability: 'nonpayable', inputs: [
    {name: 'tokenIn', type: 'address'}, {name: 'tokenOut', type: 'address'}, {name: 'triggerAbove', type: 'bool'},
    {name: 'triggerPriceHandle', type: 'bytes32'}, {name: 'triggerPriceProof', type: 'bytes'},
    {name: 'amountInHandle', type: 'bytes32'}, {name: 'amountInProof', type: 'bytes'},
  ], outputs: [{name: 'orderId', type: 'uint256'}]},
  {type: 'function', name: 'cancelOrder', stateMutability: 'nonpayable', inputs: [{name: 'orderId', type: 'uint256'}], outputs: []},
  {type: 'function', name: 'totalOrdersFilled', stateMutability: 'view', inputs: [], outputs: [{type: 'uint256'}]},
  {type: 'function', name: 'totalVolumeRouted', stateMutability: 'view', inputs: [], outputs: [{type: 'uint256'}]},
  {type: 'event', name: 'OrderSubmitted', inputs: [
    {indexed: true, name: 'orderId', type: 'uint256'}, {indexed: true, name: 'owner', type: 'address'},
    {indexed: false, name: 'tokenIn', type: 'address'}, {indexed: false, name: 'tokenOut', type: 'address'},
  ]},
] as const

/** Returns the configured vault address or null when the app is unconfigured. */
export function getVaultAddress(): `0x${string}` | undefined {
  const value = process.env.NEXT_PUBLIC_WRAITH_VAULT_ADDRESS
  return value ? (value as `0x${string}`) : undefined
}

/** Converts a contract numeric status into the dashboard label. */
export function getOrderStatus(status: number): 'open' | 'triggered' | 'executed' | 'cancelled' {
  return ['open', 'triggered', 'executed', 'cancelled'][status] as 'open' | 'triggered' | 'executed' | 'cancelled'
}
