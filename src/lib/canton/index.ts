// src/lib/canton/index.ts
// Barrel export for all Canton integration modules

export { cantonLedger, CantonLedgerClient } from "./cantonLedgerClient";
export type {
    CantonPartyInfo,
    CantonContract,
    BridgeUserAgreementPayload,
    USDCxHoldingPayload,
    CantonQueryResult,
} from "./cantonLedgerClient";

export { useCantonWallet } from "./useCantonWallet";
export type { CantonWalletState, CantonWalletActions, DAMLIntent } from "./useCantonWallet";

export { useAttestationPoller } from "./useAttestationPoller";
export type { AttestationStatus, AttestationData, AttestationPollerState } from "./useAttestationPoller";
