// src/lib/canton/cantonLedgerClient.ts
//
// Canton HTTP JSON API client (DAML SDK v2.x spec).
// Talks to the user's Canton participant node via JWT-authenticated REST.
//
// Endpoints used:
//   POST /v1/query              → search active contracts
//   POST /v1/exercise           → exercise a DAML choice
//   GET  /v1/user               → get authenticated party info
//
// The participant node URL is set in CANTON_JSON_API_URL.
// The JWT is acquired via CANTON_JWT_SECRET (dev) or OAuth2 (prod).

export interface CantonPartyInfo {
    party: string;
    isLocal: boolean;
    displayName?: string;
}

export interface CantonContract<T = Record<string, unknown>> {
    contractId: string;
    templateId: string;
    payload: T;
    signatories: string[];
    observers: string[];
}

export interface BridgeUserAgreementPayload {
    user: string;
    bridgeOperator: string;
    utilityOperator: string;
    crossChainRepresentative: string;
    holdingFactory: string;
}

export interface USDCxHoldingPayload {
    owner: string;
    amount: { value: string };
    instrument: {
        depository: string;
        issuer: string;
        id: string;
        version: string;
    };
}

export interface CantonQueryResult<T> {
    result: CantonContract<T>[];
    warnings?: string[];
}

export class CantonLedgerClient {
    private baseUrl: string;
    private jwt: string | null;

    constructor(
        baseUrl: string = process.env.CANTON_JSON_API_URL || "https://api.canton.network/json-api",
        jwt: string | null = process.env.CANTON_JWT || null
    ) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
        this.jwt = jwt;
    }

    private headers(): HeadersInit {
        const h: HeadersInit = { "Content-Type": "application/json" };
        if (this.jwt) h["Authorization"] = `Bearer ${this.jwt}`;
        return h;
    }

    /** GET /v1/user — returns the authenticated party ID */
    async getParty(): Promise<CantonPartyInfo> {
        const res = await fetch(`${this.baseUrl}/v1/user`, { method: "GET", headers: this.headers() });
        if (!res.ok) throw new Error(`Canton /v1/user failed: ${res.status} ${await res.text()}`);
        const json = await res.json();
        return json.result as CantonPartyInfo;
    }

    /** POST /v1/query — search active contracts by templateId */
    async queryContracts<T>(templateId: string, query: Record<string, unknown> = {}): Promise<CantonContract<T>[]> {
        const body = { templateIds: [templateId], query };
        const res = await fetch(`${this.baseUrl}/v1/query`, {
            method: "POST",
            headers: this.headers(),
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Canton /v1/query failed: ${res.status} ${await res.text()}`);
        const json: CantonQueryResult<T> = await res.json();
        return json.result;
    }

    /**
     * Find the user's BridgeUserAgreement contract.
     * Returns the contractId needed for Mint/Burn operations.
     */
    async getBridgeUserAgreement(partyId: string): Promise<CantonContract<BridgeUserAgreementPayload> | null> {
        const templateId = process.env.CANTON_BRIDGE_USER_AGREEMENT_TEMPLATE_ID
            || "Digital-Asset-2:DA.Finance.Bridge.V2.BridgeUserAgreement:BridgeUserAgreement";

        const contracts = await this.queryContracts<BridgeUserAgreementPayload>(
            templateId,
            { user: partyId }
        );
        return contracts[0] ?? null;
    }

    /**
     * Find all USDCx holdings for a given party.
     * These are the holdingCids needed for BridgeUserAgreement_Burn.
     */
    async getUSDCxHoldings(partyId: string): Promise<CantonContract<USDCxHoldingPayload>[]> {
        const templateId = process.env.CANTON_USDC_HOLDING_TEMPLATE_ID
            || "Digital-Asset-2:DA.Finance.Instrument.Holding:Holding";

        const usdcInstrumentId = process.env.NEXT_PUBLIC_CANTON_USDC_HASH
            || "0x661237037dc811823d8b2de17aaabb8ef2ac9b713ca7db3b01fc7f7baf7db562";

        return this.queryContracts<USDCxHoldingPayload>(templateId, {
            owner: partyId,
            "instrument.id.unpack": usdcInstrumentId,
        });
    }

    /**
     * POST /v1/exercise — exercise a DAML choice on a contract.
     * Returns the exercise result event.
     */
    async exerciseChoice(
        templateId: string,
        contractId: string,
        choice: string,
        argument: Record<string, unknown>
    ): Promise<unknown> {
        const body = { templateId, contractId, choice, argument };
        const res = await fetch(`${this.baseUrl}/v1/exercise`, {
            method: "POST",
            headers: this.headers(),
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Canton /v1/exercise failed: ${res.status} ${await res.text()}`);
        const json = await res.json();
        return json.result;
    }

    /**
     * Exercise BridgeUserAgreement_Mint — called after Circle attestation received.
     * The attestation CID comes from monitoring the xReserve contract events.
     */
    async mintUSDCx(params: {
        bridgeAgreementCid: string;
        depositAttestationCid: string;
    }): Promise<unknown> {
        const templateId = process.env.CANTON_BRIDGE_USER_AGREEMENT_TEMPLATE_ID
            || "Digital-Asset-2:DA.Finance.Bridge.V2.BridgeUserAgreement:BridgeUserAgreement";

        return this.exerciseChoice(templateId, params.bridgeAgreementCid, "BridgeUserAgreement_Mint", {
            depositAttestationCid: params.depositAttestationCid,
        });
    }

    /**
     * Exercise BridgeUserAgreement_Burn — initiates withdrawal of USDCx back to Ethereum.
     */
    async burnUSDCx(params: {
        bridgeAgreementCid: string;
        holdingCids: string[];
        amount: string;
        destinationEthAddress: string;
    }): Promise<unknown> {
        const templateId = process.env.CANTON_BRIDGE_USER_AGREEMENT_TEMPLATE_ID
            || "Digital-Asset-2:DA.Finance.Bridge.V2.BridgeUserAgreement:BridgeUserAgreement";

        return this.exerciseChoice(templateId, params.bridgeAgreementCid, "BridgeUserAgreement_Burn", {
            holdingCids: params.holdingCids,
            amount: { value: params.amount },
            destinationAddress: params.destinationEthAddress,
        });
    }
}

// Singleton — reused across requests
export const cantonLedger = new CantonLedgerClient();
