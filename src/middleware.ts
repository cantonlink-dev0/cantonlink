// src/middleware.ts
// Security middleware: domain redirect + scraper blocking + security headers
// Allows search engines (Google, Bing) but blocks data scrapers and AI bots

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_DOMAIN = "cantonlink.io";

// Legitimate search engine bots — ALLOW these
const ALLOWED_BOTS = [
    "googlebot", "bingbot", "yandexbot", "duckduckbot",
    "slurp", "baiduspider", "facebookexternalhit",
    "twitterbot", "linkedinbot", "whatsapp",
    "telegrambot", "discordbot",
];

// Scraper/AI bots to block
const BLOCKED_BOTS = [
    "scrapy", "puppeteer", "playwright", "headlesschrome",
    "phantomjs", "selenium", "wget", "curl",
    "python-requests", "httpclient", "java/", "go-http-client",
    "node-fetch", "axios",
    "gptbot", "chatgpt", "ccbot", "anthropic", "claudebot",
    "bytespider", "google-extended", "dataforseo", "semrush",
    "ahrefs", "mj12bot", "dotbot", "petalbot",
];

function isAllowedBot(ua: string): boolean {
    const lower = ua.toLowerCase();
    return ALLOWED_BOTS.some((bot) => lower.includes(bot));
}

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

    // --- Block scraper bots (but allow search engines) ---
    if (pathname !== "/robots.txt" && !isAllowedBot(ua) && isBlockedBot(ua)) {
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
