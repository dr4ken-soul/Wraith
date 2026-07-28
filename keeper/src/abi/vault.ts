export const vaultAbi = [
  {
    type: 'function',
    name: 'getOpenOrderIds',
    stateMutability: 'view',
    inputs: [],
    outputs: [{name: 'ids', type: 'uint256[]'}],
  },
  {
    type: 'function',
    name: 'requestEvaluation',
    stateMutability: 'nonpayable',
    inputs: [{name: 'orderId', type: 'uint256'}, {name: 'currentPrice', type: 'uint256'}],
    outputs: [],
  },
  {
    type: 'function',
    name: 'markTriggered',
    stateMutability: 'nonpayable',
    inputs: [{name: 'orderId', type: 'uint256'}],
    outputs: [],
  },
  {
    type: 'function',
    name: 'executeOrder',
    stateMutability: 'nonpayable',
    inputs: [{name: 'orderId', type: 'uint256'}, {name: 'revealedAmountIn', type: 'uint256'}],
    outputs: [],
  },
  {
    type: 'event',
    name: 'EvaluationRequested',
    inputs: [
      {indexed: true, name: 'orderId', type: 'uint256'},
      {indexed: true, name: 'resultHandle', type: 'bytes32'},
    ],
  },
  {
    type: 'event',
    name: 'OrderTriggered',
    inputs: [
      {indexed: true, name: 'orderId', type: 'uint256'},
      {indexed: true, name: 'amountHandle', type: 'bytes32'},
    ],
  },
] as const

