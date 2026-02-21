// src/app/legal/privacy/page.tsx
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="text-purple-400 hover:text-purple-300 mb-8 inline-block">
                    ← Back to CantonLink
                </Link>

                <div className="prose prose-invert max-w-none">
                    <h1 className="text-4xl font-bold mb-4 text-purple-400">Privacy Policy</h1>
                    <p className="text-gray-400 mb-8">Last Updated: February 16, 2026</p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
                    <p className="mb-4">
                        CantonLink ("we," "our," or "us") respects your privacy. This Privacy Policy explains how we collect,
                        use, and protect your information when you use our decentralized finance aggregator service.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>

                    <h3 className="text-xl font-semibold mt-6 mb-3">Information You Provide</h3>
                    <ul className="list-disc ml-6 mb-4">
                        <li><strong>Wallet Address:</strong> Your public blockchain wallet address when you connect</li>
                        <li><strong>Transaction Data:</strong> On-chain transaction details (publicly visible on blockchains)</li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-6 mb-3">Automatically Collected Information</h3>
                    <ul className="list-disc ml-6 mb-4">
                        <li><strong>Usage Data:</strong> Pages visited, features used, time spent</li>
                        <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
                        <li><strong>Cookies:</strong> Session tokens, preferences, analytics</li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-6 mb-3">Information We Do NOT Collect</h3>
                    <ul className="list-disc ml-6 mb-4">
                        <li><strong>Private Keys:</strong> We never access or store your private keys</li>
                        <li><strong>Personal Identity:</strong> We do not require name, email, or KYC</li>
                        <li><strong>Custodial Access:</strong> We never control your funds</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">3. Third-Party Services</h2>
                    <p className="mb-4">
                        CantonLink integrates with third-party services including <strong>ParaSwap, Jupiter, LI.FI, and 1inch</strong>.
                        We share your transaction parameters with these services to fetch quotes and execute trades. Each has its own
                        privacy policy.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">4. Blockchain Transparency</h2>
                    <p className="mb-4">
                        All on-chain transactions are <strong>publicly visible</strong> on blockchain explorers. Your wallet address
                        and transaction history are permanently recorded on public ledgers.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">5. Security</h2>
                    <p className="mb-2">We implement industry-standard security measures:</p>
                    <ul className="list-disc ml-6 mb-4">
                        <li>HTTPS encryption</li>
                        <li>Secure API endpoints</li>
                        <li>Non-custodial architecture</li>
                        <li>Regular security audits</li>
                    </ul>
                    <p className="mb-4"><strong>However, no system is 100% secure. Use at your own risk.</strong></p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">6. Contact Us</h2>
                    <p className="mb-4">
                        For privacy questions, contact: <strong>privacy@cantonlink.io</strong>
                    </p>

                    <div className="border-t border-gray-700 mt-12 pt-6 text-center text-gray-500">
                        © 2026 CantonLink. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}
