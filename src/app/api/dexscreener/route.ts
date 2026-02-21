// src/app/api/dexscreener/route.ts
// Proxy for DexScreener API to avoid CORS issues in client-side fetch
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get("q");

    if (!q) {
        return NextResponse.json(
            { error: "Missing search query ?q=" },
            { status: 400 }
        );
    }

    try {
        const res = await fetch(
            `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`,
            {
                headers: {
                    "Accept": "application/json",
                    "User-Agent": "Omnidex/1.0",
                },
                next: { revalidate: 30 }, // cache for 30 seconds
            }
        );

        if (!res.ok) {
            return NextResponse.json(
                { error: `DexScreener API returned ${res.status}` },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Failed to fetch from DexScreener" },
            { status: 500 }
        );
    }
}
