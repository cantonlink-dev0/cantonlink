// src/__tests__/routing/modeEnforcement.test.ts
// Tests: mode rules block/allow correctly

import { describe, it, expect } from "vitest";
import { validateMode, resolveAutoRouteType } from "@/lib/routing/modeEnforcement";

describe("modeEnforcement", () => {
    describe("validateMode", () => {
        it("SWAP_ONLY allows same-chain", () => {
            const result = validateMode({
                mode: "SWAP_ONLY",
                fromChainId: "1",
                toChainId: "1",
                fromTokenAddress: "0xA",
                toTokenAddress: "0xB",
            });
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it("SWAP_ONLY blocks cross-chain", () => {
            const result = validateMode({
                mode: "SWAP_ONLY",
                fromChainId: "1",
                toChainId: "42161",
                fromTokenAddress: "0xA",
                toTokenAddress: "0xB",
            });
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe("MODE_SWAP_CROSS_CHAIN");
            expect(result.error?.message).toContain("same chain");
        });

        it("BRIDGE_ONLY allows cross-chain", () => {
            const result = validateMode({
                mode: "BRIDGE_ONLY",
                fromChainId: "1",
                toChainId: "42161",
                fromTokenAddress: "0xA",
                toTokenAddress: "0xB",
            });
            expect(result.valid).toBe(true);
        });

        it("BRIDGE_ONLY blocks same-chain", () => {
            const result = validateMode({
                mode: "BRIDGE_ONLY",
                fromChainId: "1",
                toChainId: "1",
                fromTokenAddress: "0xA",
                toTokenAddress: "0xB",
            });
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe("MODE_BRIDGE_SAME_CHAIN");
            expect(result.error?.message).toContain("different chains");
        });

        it("AUTO always passes validation", () => {
            // Same chain
            expect(
                validateMode({
                    mode: "AUTO",
                    fromChainId: "1",
                    toChainId: "1",
                    fromTokenAddress: "0xA",
                    toTokenAddress: "0xB",
                }).valid
            ).toBe(true);

            // Cross chain
            expect(
                validateMode({
                    mode: "AUTO",
                    fromChainId: "1",
                    toChainId: "42161",
                    fromTokenAddress: "0xA",
                    toTokenAddress: "0xB",
                }).valid
            ).toBe(true);
        });
    });

    describe("resolveAutoRouteType", () => {
        it("same chain → swap", () => {
            const result = resolveAutoRouteType("1", "1");
            expect(result.routeType).toBe("swap");
            expect(result.reason).toContain("Same chain");
        });

        it("cross chain → bridge", () => {
            const result = resolveAutoRouteType("1", "42161");
            expect(result.routeType).toBe("bridge");
            expect(result.reason).toContain("Cross-chain");
        });

        it("Solana to EVM → bridge", () => {
            const result = resolveAutoRouteType("solana", "1");
            expect(result.routeType).toBe("bridge");
        });
    });
});
