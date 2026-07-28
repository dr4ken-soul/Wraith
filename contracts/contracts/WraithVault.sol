// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Nox, ebool, euint256, externalEuint256} from '@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {ISwapRouter} from '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';

/// @title WraithVault
/// @notice Stores encrypted Uniswap V3 limit orders and settles them without
///         making the trigger price readable before execution.
contract WraithVault {
    using SafeERC20 for IERC20;

    /// @notice Lifecycle state for an encrypted order.
    enum OrderStatus {
        Open,
        Triggered,
        Executed,
        Cancelled
    }

    /// @notice Complete order record. The two numeric values remain encrypted.
    struct Order {
        address owner;
        address tokenIn;
        address tokenOut;
        bool triggerAbove;
        euint256 triggerPrice;
        euint256 amountIn;
        ebool pendingResult;
        OrderStatus status;
        uint256 createdAt;
    }

    /// @notice The Uniswap V3 router used for settlement.
    ISwapRouter public immutable swapRouter;

    /// @notice The only account allowed to drive evaluation and settlement.
    address public immutable keeper;

    /// @notice The Uniswap V3 pool fee tier used by this single-hop MVP.
    uint24 public immutable poolFee;

    /// @notice Next order identifier.
    uint256 public nextOrderId = 1;

    /// @notice Count of orders that completed a private execution.
    uint256 public totalOrdersFilled;

    /// @notice Sum of revealed input amounts routed through the vault.
    uint256 public totalVolumeRouted;

    mapping(uint256 => Order) private orders;

    /// @notice Emitted when a new encrypted order is stored.
    event OrderSubmitted(uint256 indexed orderId, address indexed owner, address tokenIn, address tokenOut);

    /// @notice Emitted when a confidential evaluation has been requested.
    event EvaluationRequested(uint256 indexed orderId, bytes32 indexed resultHandle);

    /// @notice Emitted when one order's amount is made publicly decryptable.
    event OrderTriggered(uint256 indexed orderId, bytes32 indexed amountHandle);

    /// @notice Emitted when a swap has settled to the trader.
    event OrderExecuted(uint256 indexed orderId, uint256 amountIn, uint256 amountOut);

    /// @notice Emitted when an owner cancels an open order.
    event OrderCancelled(uint256 indexed orderId);

    /// @notice Restricts keeper-only lifecycle methods.
    modifier onlyKeeper() {
        require(msg.sender == keeper, 'caller is not keeper');
        _;
    }

    /// @notice Deploys the vault with injected settlement and keeper addresses.
    /// @param router Uniswap V3 SwapRouter02-compatible address
    /// @param keeperAddress account that drives confidential evaluations
    /// @param fee Uniswap V3 fee tier for the demo pool
    constructor(address router, address keeperAddress, uint24 fee) {
        require(router != address(0), 'router is zero');
        require(keeperAddress != address(0), 'keeper is zero');
        swapRouter = ISwapRouter(router);
        keeper = keeperAddress;
        poolFee = fee;
    }

    /// @notice Submits a new encrypted limit order.
    /// @param tokenIn token being sold
    /// @param tokenOut token being bought
    /// @param triggerAbove true for a rise-to-trigger order, false for a fall-to-trigger order
    /// @param triggerPriceHandle external handle for the encrypted trigger
    /// @param triggerPriceProof proof for the trigger handle
    /// @param amountInHandle external handle for the encrypted input amount
    /// @param amountInProof proof for the amount handle
    /// @return orderId identifier of the new order
    function submitOrder(
        address tokenIn,
        address tokenOut,
        bool triggerAbove,
        externalEuint256 triggerPriceHandle,
        bytes calldata triggerPriceProof,
        externalEuint256 amountInHandle,
        bytes calldata amountInProof
    ) external returns (uint256 orderId) {
        require(tokenIn != address(0) && tokenOut != address(0), 'token is zero');
        euint256 triggerPrice = Nox.fromExternal(triggerPriceHandle, triggerPriceProof);
        euint256 amountIn = Nox.fromExternal(amountInHandle, amountInProof);

        Nox.allowThis(triggerPrice);
        Nox.allow(triggerPrice, msg.sender);
        Nox.allowThis(amountIn);
        Nox.allow(amountIn, msg.sender);

        orderId = nextOrderId++;
        orders[orderId] = Order({
            owner: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            triggerAbove: triggerAbove,
            triggerPrice: triggerPrice,
            amountIn: amountIn,
            pendingResult: ebool.wrap(bytes32(0)),
            status: OrderStatus.Open,
            createdAt: block.timestamp
        });

        emit OrderSubmitted(orderId, msg.sender, tokenIn, tokenOut);
    }

    /// @notice Cancels an order before it has triggered.
    /// @param orderId order to cancel
    function cancelOrder(uint256 orderId) external {
        Order storage order = orders[orderId];
        require(order.owner == msg.sender, 'caller is not owner');
        require(order.status == OrderStatus.Open, 'order not open');
        order.status = OrderStatus.Cancelled;
        emit OrderCancelled(orderId);
    }

    /// @notice Returns the caller's own order records.
    /// @return result all orders owned by msg.sender
    function getMyOrders() external view returns (Order[] memory result) {
        uint256 ownedCount;
        for (uint256 id = 1; id < nextOrderId; id++) {
            if (orders[id].owner == msg.sender) ownedCount++;
        }

        result = new Order[](ownedCount);
        uint256 index;
        for (uint256 id = 1; id < nextOrderId; id++) {
            if (orders[id].owner == msg.sender) result[index++] = orders[id];
        }
    }

    /// @notice Returns identifiers for all orders owned by the caller.
    /// @return ids caller-owned order identifiers in ascending creation order
    function getMyOrderIds() external view returns (uint256[] memory ids) {
        uint256 ownedCount;
        for (uint256 id = 1; id < nextOrderId; id++) {
            if (orders[id].owner == msg.sender) ownedCount++;
        }
        ids = new uint256[](ownedCount);
        uint256 index;
        for (uint256 id = 1; id < nextOrderId; id++) {
            if (orders[id].owner == msg.sender) ids[index++] = id;
        }
    }

    /// @notice Returns one order for owner-scoped dashboard reads.
    /// @param orderId order to read
    /// @return result requested order
    function getOrder(uint256 orderId) external view returns (Order memory result) {
        result = orders[orderId];
    }

    /// @notice Returns all open order identifiers for the keeper loop.
    /// @return ids identifiers of currently open orders
    function getOpenOrderIds() external view onlyKeeper returns (uint256[] memory ids) {
        uint256 openCount;
        for (uint256 id = 1; id < nextOrderId; id++) {
            if (orders[id].status == OrderStatus.Open) openCount++;
        }
        ids = new uint256[](openCount);
        uint256 index;
        for (uint256 id = 1; id < nextOrderId; id++) {
            if (orders[id].status == OrderStatus.Open) ids[index++] = id;
        }
    }

    /// @notice Compares public pool price against an encrypted trigger.
    /// @param orderId order to evaluate
    /// @param currentPrice live price read from Uniswap V3 slot0
    function requestEvaluation(uint256 orderId, uint256 currentPrice) external onlyKeeper {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Open, 'order not open');

        euint256 livePrice = Nox.toEuint256(currentPrice);
        ebool result = order.triggerAbove
            ? Nox.ge(livePrice, order.triggerPrice)
            : Nox.le(livePrice, order.triggerPrice);

        Nox.allowThis(result);
        Nox.allowPublicDecryption(result);
        order.pendingResult = result;
        emit EvaluationRequested(orderId, ebool.unwrap(result));
    }

    /// @notice Reveals only the amount for an order with a true evaluation.
    /// @param orderId order that met its confidential trigger
    function markTriggered(uint256 orderId) external onlyKeeper {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Open, 'order not open');
        order.status = OrderStatus.Triggered;
        Nox.allowPublicDecryption(order.amountIn);
        emit OrderTriggered(orderId, euint256.unwrap(order.amountIn));
    }

    /// @notice Pulls the revealed amount, swaps through Uniswap, and forwards output.
    /// @param orderId triggered order to settle
    /// @param revealedAmountIn amount returned by Nox publicDecrypt
    function executeOrder(uint256 orderId, uint256 revealedAmountIn) external onlyKeeper {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Triggered, 'order not triggered');
        require(revealedAmountIn > 0, 'amount is zero');
        order.status = OrderStatus.Executed;

        IERC20(order.tokenIn).safeTransferFrom(order.owner, address(this), revealedAmountIn);
        IERC20(order.tokenIn).forceApprove(address(swapRouter), revealedAmountIn);

        uint256 amountOut = swapRouter.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: order.tokenIn,
                tokenOut: order.tokenOut,
                fee: poolFee,
                recipient: order.owner,
                deadline: block.timestamp,
                amountIn: revealedAmountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            })
        );

        totalOrdersFilled++;
        totalVolumeRouted += revealedAmountIn;
        emit OrderExecuted(orderId, revealedAmountIn, amountOut);
    }
}
