// src/middleware.ts
// Force-redirect all .vercel.app traffic to cantonlink.io
// This ensures internal Vercel URLs are never publicly accessible

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_DOMAIN = "cantonlink.io";

export function middleware(request: NextRequest) {
    const host = request.headers.get("host") || "";

    // Allow cantonlink.io and www.cantonlink.io — these are the real domains
    if (host === CANONICAL_DOMAIN || host === `www.${CANONICAL_DOMAIN}`) {
        return NextResponse.next();
    }

    // Allow localhost for development
    if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
        return NextResponse.next();
    }

    // Any other host (*.vercel.app, deployment URLs, etc.) → redirect to cantonlink.io
    const url = request.nextUrl.clone();
    url.host = CANONICAL_DOMAIN;
    url.port = "";
    url.protocol = "https";

    return NextResponse.redirect(url, { status: 301 });
}

// Run on all routes except API routes, static files, and Next.js internals
export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|chains|cantonlink-logo.png).*)",
    ],
};
