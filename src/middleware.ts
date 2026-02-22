// src/middleware.ts
// Security middleware: domain redirect + anti-scraping + security headers

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_DOMAIN = "cantonlink.io";

// Known bot user-agents to block
const BLOCKED_BOTS = [
    "bot", "crawler", "spider", "scraper", "wget", "curl",
    "python-requests", "httpclient", "java/", "go-http-client",
    "node-fetch", "axios", "scrapy", "puppeteer", "playwright",
    "headlesschrome", "phantomjs", "selenium",
    "gptbot", "chatgpt", "ccbot", "anthropic", "claudebot",
    "bytespider", "google-extended", "dataforseo", "semrush",
    "ahrefs", "mj12bot", "dotbot", "petalbot",
];

function isBot(ua: string): boolean {
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

    // --- Block bots/scrapers (except for robots.txt itself) ---
    if (pathname !== "/robots.txt" && isBot(ua)) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    // --- Add security headers to all responses ---
    const response = NextResponse.next();

    // Prevent search engine indexing
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");

    // Security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "no-referrer");
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
