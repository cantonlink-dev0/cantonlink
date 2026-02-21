// src/components/AmountInput.tsx
"use client";

interface AmountInputProps {
    value: string;
    onChange: (value: string) => void;
    label: string;
    disabled?: boolean;
    tokenSymbol?: string;
}

export function AmountInput({
    value,
    onChange,
    label,
    disabled = false,
    tokenSymbol,
}: AmountInputProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow only numbers and decimal point
        if (val === "" || /^\d*\.?\d*$/.test(val)) {
            onChange(val);
        }
    };

    return (
        <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                {label}
            </label>
            <div className="relative">
                <input
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="0.0"
                    className="w-full px-4 py-3 bg-surface rounded-xl border border-surface-border text-xl font-mono text-gray-100 placeholder-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {tokenSymbol && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                        {tokenSymbol}
                    </span>
                )}
            </div>
        </div>
    );
}
