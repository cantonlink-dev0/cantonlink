// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OTCEscrow
 * @notice Trustless P2P OTC escrow for ERC-20 and native ETH trades.
 *
 * Flow:
 *   1. Maker calls createOrder() — deposits sell tokens into this contract.
 *   2. Taker calls fillOrder()   — deposits buy tokens; contract releases
 *      sell tokens to taker and buy tokens to maker atomically.
 *   3. Maker can cancelOrder()   — reclaims escrowed tokens (only if not filled).
 *
 * Native ETH is represented by address(0) — use msg.value for ETH deposits.
 */
contract OTCEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Types ───────────────────────────────────────────────────────────────

    enum OrderStatus { OPEN, FILLED, CANCELLED, EXPIRED }

    struct Order {
        address maker;
        address sellToken;       // address(0) = native ETH
        uint256 sellAmount;
        address buyToken;        // address(0) = native ETH
        uint256 buyAmount;
        uint256 expiry;          // block.timestamp deadline, 0 = no expiry
        address allowedTaker;    // address(0) = anyone can fill
        OrderStatus status;
        address taker;
    }

    // ─── State ───────────────────────────────────────────────────────────────

    Order[] public orders;

    // ─── Events ──────────────────────────────────────────────────────────────

    event OrderCreated(
        uint256 indexed orderId,
        address indexed maker,
        address sellToken,
        uint256 sellAmount,
        address buyToken,
        uint256 buyAmount,
        uint256 expiry,
        address allowedTaker
    );

    event OrderFilled(
        uint256 indexed orderId,
        address indexed taker,
        uint256 sellAmount,
        uint256 buyAmount
    );

    event OrderCancelled(uint256 indexed orderId);

    // ─── Errors ──────────────────────────────────────────────────────────────

    error OrderNotOpen();
    error OrderExpired();
    error NotMaker();
    error NotAllowedTaker();
    error IncorrectETHAmount();
    error CannotFillOwnOrder();

    // ─── External Functions ──────────────────────────────────────────────────

    /**
     * @notice Create a new OTC order. Maker deposits sell tokens into escrow.
     * @param _sellToken Token to sell (address(0) for native ETH)
     * @param _sellAmount Amount of sell token (in wei/smallest unit)
     * @param _buyToken Token wanted in return (address(0) for native ETH)
     * @param _buyAmount Amount of buy token wanted
     * @param _expiry Unix timestamp deadline (0 = no expiry)
     * @param _allowedTaker Restrict to specific taker (address(0) = open to all)
     * @return orderId The index of the created order
     */
    function createOrder(
        address _sellToken,
        uint256 _sellAmount,
        address _buyToken,
        uint256 _buyAmount,
        uint256 _expiry,
        address _allowedTaker
    ) external payable nonReentrant returns (uint256 orderId) {
        // Deposit sell tokens
        if (_sellToken == address(0)) {
            if (msg.value != _sellAmount) revert IncorrectETHAmount();
        } else {
            IERC20(_sellToken).safeTransferFrom(msg.sender, address(this), _sellAmount);
        }

        orderId = orders.length;
        orders.push(Order({
            maker: msg.sender,
            sellToken: _sellToken,
            sellAmount: _sellAmount,
            buyToken: _buyToken,
            buyAmount: _buyAmount,
            expiry: _expiry,
            allowedTaker: _allowedTaker,
            status: OrderStatus.OPEN,
            taker: address(0)
        }));

        emit OrderCreated(
            orderId,
            msg.sender,
            _sellToken,
            _sellAmount,
            _buyToken,
            _buyAmount,
            _expiry,
            _allowedTaker
        );
    }

    /**
     * @notice Fill an open order. Taker deposits buy tokens; contract releases
     *         sell tokens to taker and buy tokens to maker atomically.
     * @param _orderId The order to fill
     */
    function fillOrder(uint256 _orderId) external payable nonReentrant {
        Order storage order = orders[_orderId];

        if (order.status != OrderStatus.OPEN) revert OrderNotOpen();
        if (order.expiry != 0 && block.timestamp > order.expiry) revert OrderExpired();
        if (msg.sender == order.maker) revert CannotFillOwnOrder();
        if (order.allowedTaker != address(0) && msg.sender != order.allowedTaker)
            revert NotAllowedTaker();

        order.status = OrderStatus.FILLED;
        order.taker = msg.sender;

        // Taker sends buy tokens to maker
        if (order.buyToken == address(0)) {
            if (msg.value != order.buyAmount) revert IncorrectETHAmount();
            (bool sent, ) = payable(order.maker).call{value: order.buyAmount}("");
            require(sent, "ETH transfer to maker failed");
        } else {
            IERC20(order.buyToken).safeTransferFrom(msg.sender, order.maker, order.buyAmount);
        }

        // Contract releases escrowed sell tokens to taker
        if (order.sellToken == address(0)) {
            (bool sent, ) = payable(msg.sender).call{value: order.sellAmount}("");
            require(sent, "ETH transfer to taker failed");
        } else {
            IERC20(order.sellToken).safeTransfer(msg.sender, order.sellAmount);
        }

        emit OrderFilled(_orderId, msg.sender, order.sellAmount, order.buyAmount);
    }

    /**
     * @notice Cancel an open order and reclaim escrowed tokens.
     *         Only the maker can cancel. Also handles expired orders.
     * @param _orderId The order to cancel
     */
    function cancelOrder(uint256 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];

        if (order.status != OrderStatus.OPEN) revert OrderNotOpen();
        if (msg.sender != order.maker) revert NotMaker();

        order.status = OrderStatus.CANCELLED;

        // Refund escrowed sell tokens to maker
        if (order.sellToken == address(0)) {
            (bool sent, ) = payable(order.maker).call{value: order.sellAmount}("");
            require(sent, "ETH refund failed");
        } else {
            IERC20(order.sellToken).safeTransfer(order.maker, order.sellAmount);
        }

        emit OrderCancelled(_orderId);
    }

    // ─── View Functions ──────────────────────────────────────────────────────

    /**
     * @notice Get total number of orders
     */
    function orderCount() external view returns (uint256) {
        return orders.length;
    }

    /**
     * @notice Get full order details
     */
    function getOrder(uint256 _orderId) external view returns (
        address maker,
        address sellToken,
        uint256 sellAmount,
        address buyToken,
        uint256 buyAmount,
        uint256 expiry,
        address allowedTaker,
        OrderStatus status,
        address taker
    ) {
        Order storage o = orders[_orderId];
        return (
            o.maker,
            o.sellToken,
            o.sellAmount,
            o.buyToken,
            o.buyAmount,
            o.expiry,
            o.allowedTaker,
            o.status,
            o.taker
        );
    }
}
