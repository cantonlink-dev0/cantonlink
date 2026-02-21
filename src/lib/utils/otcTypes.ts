// src/lib/utils/otcTypes.ts
// Type definitions for OTC/P2P trading

export type OTCOrderStatus = "OPEN" | "FILLED" | "CANCELLED" | "EXPIRED";

export interface OTCOrder {
    /** Unique local order ID */
    id: string;
    /** Maker's wallet address */
    maker: string;
    /** Chain ID of the token being sold */
    sellChainId: string;
    /** Token address being sold */
    sellTokenAddress: string;
    /** Token symbol being sold */
    sellTokenSymbol: string;
    /** Token decimals */
    sellTokenDecimals: number;
    /** Amount of tokens being sold (human-readable) */
    sellAmount: string;
    /** Chain ID of the token wanted in return */
    buyChainId: string;
    /** Token address wanted in return */
    buyTokenAddress: string;
    /** Token symbol wanted in return */
    buyTokenSymbol: string;
    /** Token decimals */
    buyTokenDecimals: number;
    /** Amount of tokens wanted in return (human-readable) */
    buyAmount: string;
    /** Order status */
    status: OTCOrderStatus;
    /** ISO timestamp when order was created */
    createdAt: string;
    /** ISO timestamp when order expires (optional) */
    expiresAt?: string;
    /** Restrict to a specific taker address (private deal) */
    allowedTaker?: string;
    /** Taker's wallet address (set when filled) */
    taker?: string;
    /** ISO timestamp when order was filled */
    filledAt?: string;
    /** On-chain order index in the OTCEscrow contract */
    onChainOrderId?: number;
    /** Escrow deposit transaction hash (real, from wallet) */
    escrowTxHash?: string;
    /** Fill transaction hash (real, from wallet) */
    fillTxHash?: string;
}

export interface CreateOrderParams {
    sellChainId: string;
    sellTokenAddress: string;
    sellTokenSymbol: string;
    sellTokenDecimals: number;
    sellAmount: string;
    buyChainId: string;
    buyTokenAddress: string;
    buyTokenSymbol: string;
    buyTokenDecimals: number;
    buyAmount: string;
    expiresInHours?: number;
    allowedTaker?: string;
}
