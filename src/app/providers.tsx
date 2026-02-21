// src/app/providers.tsx
// Root providers: wagmi, Solana, tanstack-query, Canton
"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { CantonConnectProvider } from "@cantonconnect/react";
import { useMemo, useState, useEffect } from "react";
import { wagmiConfig } from "@/lib/providers/wagmiConfig";
import { SOLANA_ENDPOINT } from "@/lib/providers/solanaConfig";
import { cantonClient } from "@/lib/providers/cantonConfig";
import {
    registerCantonSwapAdapter,
    registerCantonBridgeAdapter,
} from "@/lib/routing/routingEngine";
// NOTE: import cantonBridgeAdapterWrapper (the real BridgeAdapter), not cantonBridgeAdapter (just config/helpers)

// Import CSS
import "@rainbow-me/rainbowkit/styles.css";
import "@solana/wallet-adapter-react-ui/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
    // Create QueryClient once per mount (not per render)
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30_000,
                retry: 1,
            },
        },
    }));

    // Solana wallets — empty array auto-detects installed wallets (Phantom handles Solana + Sui)
    const wallets = useMemo(() => [], []);

    // Register Canton adapters once at startup (client-side only)
    useEffect(() => {
        // Dynamic import to avoid SSR issues with Canton adapters
        Promise.all([
            import("@/lib/adapters/canton/cantonSwapAdapter"),
            import("@/lib/adapters/canton/cantonBridgeAdapterWrapper"),
        ]).then(([{ cantonSwapAdapter }, { cantonBridgeAdapterWrapper }]) => {
            registerCantonSwapAdapter(cantonSwapAdapter);
            registerCantonBridgeAdapter(cantonBridgeAdapterWrapper);
        });
    }, []);

    // Build the provider tree — Canton wraps outermost if client is available
    const content = (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    theme={darkTheme({
                        accentColor: '#a855f7',
                        accentColorForeground: 'white',
                        borderRadius: 'medium',
                    })}
                    modalSize="compact"
                >
                    <ConnectionProvider endpoint={SOLANA_ENDPOINT}>
                        <WalletProvider wallets={wallets} autoConnect>
                            <WalletModalProvider>
                                {children}
                            </WalletModalProvider>
                        </WalletProvider>
                    </ConnectionProvider>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );

    // Always wrap with CantonConnectProvider — useSession() in child components
    // will throw if the provider is absent, even in "use client" components during SSR.
    // cantonClient is null on server-side (typeof window check), so we always pass it
    // and CantonConnectProvider handles null gracefully.
    if (!cantonClient) {
        // Server-side or canton SDK unavailable — render without Canton provider
        return content;
    }

    return (
        <CantonConnectProvider client={cantonClient}>
            {content}
        </CantonConnectProvider>
    );
}
