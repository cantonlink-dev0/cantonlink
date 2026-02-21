// src/app/legal/terms/page.tsx
import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="text-purple-400 hover:text-purple-300 mb-8 inline-block">
                    ← Back to CantonLink
                </Link>

                <div className="prose prose-invert max-w-none">
                    <h1 className="text-4xl font-bold mb-4 text-purple-400">Terms of Service</h1>
                    <p className="text-gray-400 mb-8">Last Updated: February 16, 2026</p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
                    <p className="mb-4">
                        By accessing or using CantonLink ("the Service"), you agree to be bound by these Terms of Service.
                        If you do not agree, do not use the Service.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
                    <p className="mb-4">
                        CantonLink is a decentralized finance (DeFi) aggregator that routes token swaps, cross-chain bridges,
                        and peer-to-peer (P2P) over-the-counter (OTC) trades across multiple blockchain networks. We do not
                        custody funds or execute trades directly—all transactions occur on-chain via third-party protocols.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">3. Fees</h2>
                    <p className="mb-2">CantonLink charges the following fees:</p>
                    <ul className="list-disc ml-6 mb-4">
                        <li><strong>Swaps:</strong> 0.10%</li>
                        <li><strong>Bridges:</strong> 0.15%</li>
                        <li><strong>OTC Trades:</strong> 0.25% per side</li>
                    </ul>
                    <p className="mb-4">
                        Additional fees may apply from underlying protocols, bridges, and blockchain networks (gas fees).
                        All fees are disclosed before transaction confirmation.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">4. Non-Custodial Service</h2>
                    <p className="mb-4">
                        CantonLink is a <strong>non-custodial</strong> interface. You retain full control of your cryptocurrency
                        assets at all times. We never have access to your private keys or funds.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">5. Risks</h2>
                    <p className="mb-2"><strong>Cryptocurrency trading involves significant risk, including:</strong></p>
                    <ul className="list-disc ml-6 mb-4">
                        <li>Total loss of funds</li>
                        <li>Smart contract vulnerabilities</li>
                        <li>Market volatility</li>
                        <li>Bridge failures</li>
                        <li>Regulatory changes</li>
                    </ul>
                    <p className="mb-4"><strong>You acknowledge and accept these risks.</strong></p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">6. Disclaimer of Warranties</h2>
                    <p className="mb-4">
                        THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT
                        THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">7. Limitation of Liability</h2>
                    <p className="mb-4">
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, CANTONLINK SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                        SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS OR DATA.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact</h2>
                    <p className="mb-4">
                        For questions about these Terms, contact us at: <strong>legal@cantonlink.io</strong>
                    </p>

                    <div className="border-t border-gray-700 mt-12 pt-6 text-center text-gray-500">
                        © 2026 CantonLink. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}
