// src/components/ModeToggle.tsx
"use client";

import { MODE, type Mode } from "@/lib/utils/constants";
import { setPersistedMode } from "@/lib/store/transactionStore";

interface ModeToggleProps {
    value: Mode;
    onChange: (mode: Mode) => void;
}

const MODE_OPTIONS: { value: Mode; label: string; description: string }[] = [
    { value: "AUTO", label: "Auto", description: "Automatically chooses swap or bridge" },
    { value: "SWAP_ONLY", label: "Swap Only", description: "Same-chain swaps only" },
    { value: "BRIDGE_ONLY", label: "Bridge Only", description: "Cross-chain transfers" },
];

export function ModeToggle({ value, onChange }: ModeToggleProps) {
    const handleChange = (mode: Mode) => {
        onChange(mode);
        setPersistedMode(mode);
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Mode
                </span>
                <span className="text-xs text-gray-500">
                    {MODE_OPTIONS.find((o) => o.value === value)?.description}
                </span>
            </div>
            <div className="flex gap-1 p-1 bg-surface rounded-xl border border-surface-border">
                {MODE_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => handleChange(option.value)}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${value === option.value
                                ? "bg-gradient-to-r from-brand-500/20 to-brand-600/20 text-brand-300 border border-brand-500/30 shadow-sm"
                                : "text-gray-400 hover:text-gray-300 hover:bg-surface-raised"
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
