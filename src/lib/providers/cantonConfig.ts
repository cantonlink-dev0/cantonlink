// src/lib/providers/cantonConfig.ts
// Canton Network wallet configuration
"use client";

// Canton Network ID — "mainnet" for production, "devnet" for testing
const CANTON_NETWORK = (process.env.NEXT_PUBLIC_CANTON_NETWORK as "mainnet" | "devnet") || "mainnet";

// CantonConnect client — uses @cantonconnect/react (installed in package.json)
// Falls back gracefully if the SDK isn't available yet
let cantonClient: ReturnType<typeof createClient> | null = null;

function createClient(opts: { network: string; app: { name: string }; channel: string }) {
    try {
        // Try the installed @cantonconnect/react package
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const sdk = require("@cantonconnect/react");
        const factory = sdk.createCantonConnect || sdk.default?.createCantonConnect;
        if (factory) return factory(opts);
    } catch {
        // Package not available or doesn't export createCantonConnect
    }
    // Return a stub that implements the full CantonConnect client interface
    // so CantonConnectProvider won't crash on mount (it calls client.on(), etc.)
    return {
        network: opts.network,
        connect: async () => { throw new Error("Canton wallet SDK not available. Use manual JWT or DA Hub Login."); },
        disconnect: async () => { },
        getActiveSession: async () => null,
        listWallets: async () => [],
        getRegistryStatus: () => null,
        signMessage: async () => null,
        signTransaction: async () => null,
        submitTransaction: async () => null,
        // Event emitter — CantonConnectProvider subscribes to session:connected,
        // session:disconnected, session:expired, error, registry:status
        on: (_event: string, _handler: (...args: unknown[]) => void) => {
            // No-op unsubscribe since there's no real SDK to emit events
            return () => { };
        },
    };
}

if (typeof window !== "undefined") {
    cantonClient = createClient({
        network: CANTON_NETWORK,
        app: { name: "CantonLink" },
        channel: "stable",
    });
}

export { cantonClient, CANTON_NETWORK };

