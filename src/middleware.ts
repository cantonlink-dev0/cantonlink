// src/middleware.ts
// Security middleware: domain redirect + scraper blocking + security headers
// Allows search engines AND real users — only blocks automated scraping tools

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_DOMAIN = "cantonlink.io";

// Known malicious scraper/AI bot user-agents to block
// IMPORTANT: Do NOT add generic HTTP libraries here (node-fetch, axios, curl, etc.)
// as wallets, dApps, and legitimate services use them internally
const BLOCKED_BOTS = [
    // Automation frameworks (headless browsers only)
    "scrapy", "puppeteer/", "playwright/", "headlesschrome",
    "phantomjs", "selenium",
    // AI training bots
    "gptbot", "chatgpt-user", "ccbot/", "anthropic-ai", "claudebot",
    "bytespider", "google-extended",
    // SEO scraper bots
    "dataforseobot", "semrushbot", "ahrefsbot",
    "mj12bot", "dotbot", "petalbot",
];

function isBlockedBot(ua: string): boolean {
    const lower = ua.toLowerCase();
    return BLOCKED_BOTS.some((bot) => lower.includes(bot));
}

export function middleware(request: NextRequest) {
    const host = request.headers.get("host") || "";
    const ua = request.headers.get("user-agent") || "";
    const pathname = request.nextUrl.pathname;

    // --- Domain redirect: .vercel.app → cantonlink.io ---
    if (
        host !== CANONICAL_DOMAIN &&
        host !== `www.${CANONICAL_DOMAIN}` &&
        !host.startsWith("localhost") &&
        !host.startsWith("127.0.0.1")
    ) {
        const url = request.nextUrl.clone();
        url.host = CANONICAL_DOMAIN;
        url.port = "";
        url.protocol = "https";
        return NextResponse.redirect(url, { status: 301 });
    }

    // --- Block only known scraper/AI bots ---
    if (pathname !== "/robots.txt" && isBlockedBot(ua)) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    // --- Add security headers ---
    const response = NextResponse.next();

    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), browsing-topics=()"
    );
    response.headers.set(
        "Content-Security-Policy",
        "frame-ancestors 'none';"
    );

    return response;
}

// Run on all routes except static files and Next.js internals
export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|chains|cantonlink-logo.png).*)",
    ],
};
