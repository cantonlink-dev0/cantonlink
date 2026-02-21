// src/lib/utils/constants.ts
// Status states and reusable constants

export const STATUS_STATES = {
    IDLE: "IDLE",
    QUOTED: "QUOTED",
    APPROVAL_REQUIRED: "APPROVAL_REQUIRED",
    APPROVING: "APPROVING",
    EXECUTING: "EXECUTING",
    BRIDGING: "BRIDGING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
} as const;

export type StatusState = (typeof STATUS_STATES)[keyof typeof STATUS_STATES];

export const NATIVE_TOKEN_ADDRESS =
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const SOLANA_CHAIN_ID = "solana" as const;
export const SUI_CHAIN_ID = "sui" as const;
export const CANTON_CHAIN_ID = "canton" as const;

export const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%
export const MAX_SLIPPAGE_BPS = 5000; // 50%

export const MODE = {
    AUTO: "AUTO",
    SWAP_ONLY: "SWAP_ONLY",
    BRIDGE_ONLY: "BRIDGE_ONLY",
} as const;

export type Mode = (typeof MODE)[keyof typeof MODE];

export const LOCAL_STORAGE_KEYS = {
    MODE: "swap-bridge-mode",
    ACTIVE_ROUTES: "swap-bridge-active-routes",
} as const;
