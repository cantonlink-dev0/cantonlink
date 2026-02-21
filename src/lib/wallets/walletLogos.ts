// src/lib/wallets/walletLogos.ts
// Wallet logo mapping for wallet connectors

export const WALLET_LOGOS: Record<string, string> = {
    // Main connectors
    "MetaMask": "/wallets/metamask.svg",
    "Coinbase Wallet": "/wallets/coinbase.svg",
    "WalletConnect": "/wallets/walletconnect.svg",
    "Injected": "/wallets/browser.svg",
    "Browser Wallet": "/wallets/browser.svg",

    // Additional wallets
    "Rainbow": "/wallets/rainbow.svg",
    "Trust Wallet": "/wallets/trust.svg",
    "Rabby Wallet": "/wallets/rabby.svg",
    "Safe": "/wallets/safe.svg",
    "Ledger": "/wallets/ledger.svg",
    "Phantom": "/wallets/phantom.svg",
};

// Fallback to connector's built-in icon or first letter
export function getWalletLogo(connector: { name: string; icon?: string }): string | null {
    // Try our custom logos first
    if (WALLET_LOGOS[connector.name]) {
        return WALLET_LOGOS[connector.name];
    }

    // Fall back to connector's built-in icon
    return connector.icon || null;
}
