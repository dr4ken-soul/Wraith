// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.7.5;
pragma abicoder v2;

/// @notice Minimal Uniswap SwapRouter02 V3 interface.
/// @dev SwapRouter02 uses IV3SwapRouter's parameter layout, which differs from
/// the legacy v3-periphery ISwapRouter by omitting `deadline`.
interface ISwapRouter02 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}
