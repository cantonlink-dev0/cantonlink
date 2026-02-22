import Link from "next/link";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-gray-800 bg-black/30 backdrop-blur-sm mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Top Row: Links */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 mb-4">
                    <Link
                        href="/legal/terms"
                        className="hover:text-purple-400 transition-colors"
                    >
                        Terms of Service
                    </Link>
                    <Link
                        href="/legal/privacy"
                        className="hover:text-purple-400 transition-colors"
                    >
                        Privacy Policy
                    </Link>
                    <span
                        className="text-gray-600 flex items-center gap-1 cursor-default"
                        title="Social media coming soon"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        Coming Soon
                    </span>
                </div>

                {/* Bottom Row: Copyright */}
                <div className="text-center text-xs text-gray-500">
                    © {currentYear} CantonLink. All rights reserved. | Swapping & Bridging on Canton
                </div>
            </div>
        </footer>
    );
}
