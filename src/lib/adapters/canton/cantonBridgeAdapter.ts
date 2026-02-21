// src/lib/adapters/canton/cantonBridgeAdapter.ts
//
// Canton Network xReserve Bridge Adapter
// ─────────────────────────────────────────────────────────────────────────────
//  REAL MAINNET ADDRESSES (extracted from digital-asset/xreserve-deposits):
//
//  ETHEREUM MAINNET:
//    xReserve contract:  0x8888888199b2Df864bf678259607d6D5EBb4e3Ce
//    USDC contract:      0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
//    Canton domain ID:   10001
//
//  ETHEREUM SEPOLIA (testnet):
//    xReserve contract:  0x008888878f94C0d87defdf0B07f46B93C1934442
//    USDC contract:      0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
//
//  CANTON DAML MAINNET PARTY IDs:
//    crossChainRep:  decentralized-usdc-interchain-rep::12208115f1e168dd7e792320be9c4ca720c751a02a3053c7606e1c1cd3dad9bf60ef
//    bridgeOperator: Bridge-Operator::1220c8448890a70e65f6906bd48d797ee6551f094e9e6a53e329fd5b2b549334f13f
//    utilityOp:      auth0_007c6643538f2eadd3e573dd05b9::12205bcc106efa0eaa7f18dc491e5c6f5fb9b0cc68dc110ae66f4ed6467475d7c78e
//
//  CIRCLE xRESERVE ATTESTATION API (free, no key):
//    GET https://xreserve-api.circle.com/v1/attestations/{messageHash}
//
//  FLOW:
//    1. User approves USDC spending allowance on xReserve contract
//    2. User calls depositToRemote(amount, 10001, cantonRecipient, usdcContract, 0, hookData)
//    3. Poll xreserve-api.circle.com/v1/attestations/{messageHash} until attested
//    4. Submit BridgeUserAgreement_Mint on Canton with DepositAttestation
//    5. USDCx appears in user's Canton wallet
//
//  Source: github.com/digital-asset/xreserve-deposits/config_canton.ts
//  Docs:   docs.digitalasset.com/usdc/xreserve/mainnet-technical-setup.html

export const CANTON_BRIDGE_ADDRESSES = {
    mainnet: {
        xReserve: "0x8888888199b2Df864bf678259607d6D5EBb4e3Ce" as const,
        usdc: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" as const,
        cantonDomain: 10001 as const,
        cantonUsdcHash: "0x661237037dc811823d8b2de17aaabb8ef2ac9b713ca7db3b01fc7f7baf7db562" as const,
    },
    sepolia: {
        xReserve: "0x008888878f94C0d87defdf0B07f46B93C1934442" as const,
        usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as const,
        cantonDomain: 10001 as const,
        cantonUsdcHash: "0x74ed63088c070c8fd5d8ad71f2a1cef868c63d00e0ac6dc2a6722d171691a422" as const,
    },
};

// ── Official Circle xReserve Attestation API ──────────────────────────────────
export const CIRCLE_XRESERVE_API = "https://xreserve-api.circle.com";

export async function getAttestation(messageHash: string): Promise<{ status: string; attestation?: string }> {
    const res = await fetch(`${CIRCLE_XRESERVE_API}/v1/attestations/${messageHash}`, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`xReserve attestation API ${res.status}`);
    return res.json();
}

// ── Canton DAML Party IDs (mainnet) ──────────────────────────────────────────
export const CANTON_PARTIES = {
    utilityOperator: "auth0_007c6643538f2eadd3e573dd05b9::12205bcc106efa0eaa7f18dc491e5c6f5fb9b0cc68dc110ae66f4ed6467475d7c78e",
    bridgeOperator: "Bridge-Operator::1220c8448890a70e65f6906bd48d797ee6551f094e9e6a53e329fd5b2b549334f13f",
    crossChainRepresentative: "decentralized-usdc-interchain-rep::12208115f1e168dd7e792320be9c4ca720c751a02a3053c7606e1c1cd3dad9bf60ef",
} as const;

// ── Canton DAML Contract IDs (mainnet) ───────────────────────────────────────
export const CANTON_CONTRACTS = {
    allocationFactory: {
        templateId: "8c335bb7d522489d71faf3eef046ad1a56f091b55b4f2d3086c7266afca1d647:Utility.Registry.App.V0.Service.AllocationFactory:AllocationFactory",
        contractId: "006289e882123613ea96d71fad9cc38a529e613a8d4b550ef6a0422383e1925934ca11122003bc3af7d468f09465fa72db6182b63e349804e430a81eeeffa9076f5099f796",
    },
    instrumentConfig: {
        templateId: "b4ae77b8c0c7faa8bc8bb048f035dfe3d85d3e36d4bafaa4cf59631ec635ddb2:Utility.Registry.V0.Configuration.Instrument:InstrumentConfiguration",
        contractId: "002a23aed42edb51940f74f6fc5f7b8267c9192ab8e72296673420ffc4c4f22debca1112201d94617a63f11a4ce245498930752e56313d200b6a0976ee621f6add2788ba1b",
    },
    appRewardConfig: {
        templateId: "ed73d5b9ab717333f3dbd122de7be3156f8bf2614a67360c3dd61fc0135133fa:Utility.Registry.V0.Configuration.AppReward:AppRewardConfiguration",
        contractId: "00ad54961b99aa48d545fe0d74a6b56737e8cb0d7935e831ee1afce0619a4a82bfca1112202c765d54dfcc7a1db8d0bbb5f06951ceb4562a1acaaf74de13c6d05ebe4a64c4",
    },
    bridgeUserAgreement: {
        templateId: "#utility-bridge-v0:Utility.Bridge.V0.Agreement.User:BridgeUserAgreement",
    },
    bridgeUserAgreementRequest: {
        templateId: "#utility-bridge-v0:Utility.Bridge.V0.Agreement.User:BridgeUserAgreementRequest",
    },
} as const;

// ── EVM Contract ABIs ─────────────────────────────────────────────────────────

// Circle xReserve contract — depositToRemote function
// Source: github.com/digital-asset/xreserve-deposits
export const XRESERVE_ABI = [
    // Deposit USDC to Canton (or any other remote domain)
    "function depositToRemote(uint256 value, uint32 remoteDomain, bytes32 remoteRecipient, address localToken, uint256 maxFee, bytes calldata hookData) external",
    // Check deposit parameters before submitting
    "function getDepositAddress(uint32 remoteDomain) external view returns (address)",
    // Events
    "event Deposit(address indexed sender, uint32 indexed remoteDomain, bytes32 indexed remoteRecipient, uint256 amount)",
] as const;

// ERC-20 USDC approval ABI
export const ERC20_APPROVAL_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
] as const;

// ── Bridge Adapter Types ──────────────────────────────────────────────────────

export interface XReserveDepositParams {
    /** User's Ethereum wallet address */
    fromAddress: string;
    /** Amount of USDC in USD (e.g. "100.50") */
    amountUsd: string;
    /** Canton recipient party ID */
    cantonRecipient: string;
    /** Network: "mainnet" or "sepolia" */
    network?: "mainnet" | "sepolia";
}

export interface XReserveDepositResult {
    /** Step 1: approve USDC spending */
    approveData: {
        to: string;
        data: string;
        description: string;
    };
    /** Step 2: deposit USDC to xReserve */
    depositData: {
        to: string;
        data: string;
        description: string;
    };
    /** Contract addresses used */
    contracts: {
        xReserve: string;
        usdc: string;
        cantonDomain: number;
    };
    /** Estimated time for attestation (minutes) */
    estimatedTimeMinutes: number;
    /** URL to poll for attestation status */
    attestationApiUrl: string;
}

// ── Main Deposit Builder ──────────────────────────────────────────────────────

/**
 * Build the two Ethereum transactions needed to deposit USDC into xReserve.
 * Returns calldata that can be used with any EVM wallet (MetaMask, WalletConnect, etc.)
 *
 * FLOW:
 *  tx1: USDC.approve(xReserve, amount)
 *  tx2: xReserve.depositToRemote(amount, 10001, cantonRecipient, usdc, 0, "0x")
 *
 * After broadcast, poll: GET https://xreserve-api.circle.com/v1/attestations/{messageHash}
 * Once attested, call BridgeUserAgreement_Mint on Canton with the DepositAttestation.
 */
export function buildXReserveDeposit(params: XReserveDepositParams): XReserveDepositResult {
    const network = params.network || "mainnet";
    const addrs = CANTON_BRIDGE_ADDRESSES[network];

    // Convert USD amount to USDC wei (6 decimals)
    const amountParsed = parseFloat(params.amountUsd);
    if (isNaN(amountParsed) || amountParsed <= 0) throw new Error("Invalid amount");
    const amountWei = BigInt(Math.floor(amountParsed * 1_000_000)).toString(16).padStart(64, "0");

    // Encode cantonRecipient as bytes32
    // Canton party IDs are encoded as UTF-8 bytes, right-padded to 32 bytes
    const recipientBytes = encodeCantonRecipient(params.cantonRecipient);

    // tx1: approve(xReserve, amount)
    // ERC-20 approve selector: 0x095ea7b3
    const approveSel = "095ea7b3";
    const approveRecipient = addrs.xReserve.slice(2).padStart(64, "0").toLowerCase();
    const approveCalldata = `0x${approveSel}${approveRecipient}${amountWei}`;

    // tx2: depositToRemote(value, remoteDomain, remoteRecipient, localToken, maxFee, hookData)
    // depositToRemote selector: computed from ABI signature
    const depositSel = "2a0d0f97"; // keccak256("depositToRemote(uint256,uint32,bytes32,address,uint256,bytes)")[:4]
    const valuePart = amountWei;
    const domainPart = addrs.cantonDomain.toString(16).padStart(64, "0");
    const recipientPart = recipientBytes;
    const tokenPart = addrs.usdc.slice(2).padStart(64, "0").toLowerCase();
    const maxFeePart = "0".padStart(64, "0"); // 0 fee for Canton
    const hookDataOffsetPart = "c0".padStart(64, "0"); // offset to hookData (bytes dynamic)
    const hookDataLengthPart = "0".padStart(64, "0"); // empty bytes
    const depositCalldata = `0x${depositSel}${valuePart}${domainPart}${recipientPart}${tokenPart}${maxFeePart}${hookDataOffsetPart}${hookDataLengthPart}`;

    return {
        approveData: {
            to: addrs.usdc,
            data: approveCalldata,
            description: `Approve ${params.amountUsd} USDC for xReserve deposit`,
        },
        depositData: {
            to: addrs.xReserve,
            data: depositCalldata,
            description: `Deposit ${params.amountUsd} USDC to Canton via xReserve`,
        },
        contracts: {
            xReserve: addrs.xReserve,
            usdc: addrs.usdc,
            cantonDomain: addrs.cantonDomain,
        },
        estimatedTimeMinutes: 5,
        attestationApiUrl: `${CIRCLE_XRESERVE_API}/v1/attestations/{messageHash}`,
    };
}

// ── Canton DAML Commands ──────────────────────────────────────────────────────

/**
 * Build the Canton ledger command to onboard a party to the xReserve bridge.
 * Must be submitted via the Canton ledger API before first mint.
 */
export function buildCantonOnboardCommand(userPartyId: string): object {
    return {
        CreateCommand: {
            templateId: CANTON_CONTRACTS.bridgeUserAgreementRequest.templateId,
            createArguments: {
                crossChainRepresentative: CANTON_PARTIES.crossChainRepresentative,
                operator: CANTON_PARTIES.utilityOperator,
                bridgeOperator: CANTON_PARTIES.bridgeOperator,
                user: userPartyId,
                instrumentId: {
                    admin: CANTON_PARTIES.crossChainRepresentative,
                    id: "USDCx",
                },
                preApproval: false,
            },
        },
    };
}

/**
 * Build the Canton ledger command to mint USDCx from a DepositAttestation.
 * Called after the Circle xReserve API confirm the deposit is attested.
 */
export function buildCantonMintCommand(params: {
    bridgeUserAgreementContractId: string;
    depositAttestationCid: string;
}): object {
    return {
        commands: [{
            ExerciseCommand: {
                templateId: CANTON_CONTRACTS.bridgeUserAgreement.templateId,
                contractId: params.bridgeUserAgreementContractId,
                choice: "BridgeUserAgreement_Mint",
                choiceArgument: {
                    depositAttestationCid: params.depositAttestationCid,
                    factoryCid: CANTON_CONTRACTS.allocationFactory.contractId,
                    contextContractIds: {
                        instrumentConfigurationCid: CANTON_CONTRACTS.instrumentConfig.contractId,
                        appRewardConfigurationCid: CANTON_CONTRACTS.appRewardConfig.contractId,
                        featuredAppRightCid: "", // User-specific, obtained from ledger
                    },
                },
            },
        }],
    };
}

/**
 * Build the Canton ledger command to burn USDCx and release USDC on Ethereum.
 */
export function buildCantonBurnCommand(params: {
    bridgeUserAgreementContractId: string;
    amount: string; // e.g. "100.000000"
    destinationEthAddress: string;
    holdingCids: string[];
    requestId?: string;
}): object {
    return {
        commands: [{
            ExerciseCommand: {
                templateId: CANTON_CONTRACTS.bridgeUserAgreement.templateId,
                contractId: params.bridgeUserAgreementContractId,
                choice: "BridgeUserAgreement_Burn",
                choiceArgument: {
                    amount: params.amount,
                    destinationDomain: "0", // Ethereum = domain 0
                    destinationRecipient: params.destinationEthAddress,
                    holdingCids: params.holdingCids,
                    requestId: params.requestId || crypto.randomUUID(),
                    reference: "",
                    factoryCid: CANTON_CONTRACTS.allocationFactory.contractId,
                    contextContractIds: {
                        instrumentConfigurationCid: CANTON_CONTRACTS.instrumentConfig.contractId,
                        appRewardConfigurationCid: CANTON_CONTRACTS.appRewardConfig.contractId,
                        featuredAppRightCid: "",
                    },
                },
            },
        }],
    };
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/**
 * Encode a Canton party ID as a bytes32 value for the xReserve depositToRemote call.
 * Canton party IDs are UTF-8 encoded and left-right-padded to 32 bytes.
 */
function encodeCantonRecipient(partyId: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(partyId);
    const hex = Array.from(bytes.slice(0, 32))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    return hex.padEnd(64, "0");
}

/**
 * Get info about the Canton xReserve bridge for display purposes.
 */
export function getCantonBridgeInfo(network: "mainnet" | "sepolia" = "mainnet") {
    const addrs = CANTON_BRIDGE_ADDRESSES[network];
    return {
        name: "Circle xReserve",
        description: "The only bridge to Canton Network. Locks USDC on Ethereum to mint USDCx on Canton 1:1.",
        network,
        contracts: addrs,
        parties: CANTON_PARTIES,
        estimatedTimeMinutes: 5,
        feeUsd: 0,
        feePct: 0,
        token: { from: "USDC (Ethereum)", to: "USDCx (Canton Network)" },
        attestationApi: CIRCLE_XRESERVE_API,
        referenceUi: "https://digital-asset.github.io/xreserve-deposits/",
        referenceCode: "https://github.com/digital-asset/xreserve-deposits",
    };
}
