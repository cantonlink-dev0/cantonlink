// src/components/ChainSelector.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { CHAINS, CHAIN_IDS } from "@/lib/chains/chainConfig";
import { Badge } from "@/components/ui/Badge";

interface ChainSelectorProps {
    value: string;
    onChange: (chainId: string) => void;
    label: string;
}

export function ChainSelector({ value, onChange, label }: ChainSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedChain = CHAINS[value];

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                {label}
            </label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-surface rounded-xl border border-surface-border hover:border-surface-border-light transition-colors text-left"
            >
                {selectedChain && (
                    <>
                        <img
                            src={selectedChain.logoImage}
                            alt={selectedChain.name}
                            className="w-6 h-6 rounded-full flex-shrink-0"
                            onError={(e) => {
                                const t = e.target as HTMLImageElement;
                                t.style.display = "none";
                            }}
                        />
                        <span className="flex-1">
                            <span className="text-sm font-medium text-gray-100">
                                {selectedChain.name}
                            </span>
                        </span>
                        <Badge color={selectedChain.logoColor}>
                            {selectedChain.shortName}
                        </Badge>
                    </>
                )}
                <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-40 w-full mt-2 bg-surface-raised border border-surface-border rounded-xl shadow-2xl overflow-hidden animate-slide-up">
                    <div className="max-h-64 overflow-y-auto">
                        {CHAIN_IDS.map((chainId) => {
                            const chain = CHAINS[chainId];
                            const isSelected = chainId === value;
                            return (
                                <button
                                    key={chainId}
                                    onClick={() => {
                                        onChange(chainId);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isSelected
                                        ? "bg-brand-500/10 border-l-2 border-brand-500"
                                        : "hover:bg-surface-overlay border-l-2 border-transparent"
                                        }`}
                                >
                                    <img
                                        src={chain.logoImage}
                                        alt={chain.name}
                                        className="w-5 h-5 rounded-full flex-shrink-0"
                                        onError={(e) => {
                                            const t = e.target as HTMLImageElement;
                                            t.style.display = "none";
                                        }}
                                    />
                                    <span className="flex-1 text-sm text-gray-200">
                                        {chain.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {chain.type === "solana" ? "SVM" : chain.type === "canton" ? "DAML" : `#${chain.id}`}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
