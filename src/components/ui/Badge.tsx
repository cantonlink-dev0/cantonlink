// src/components/ui/Badge.tsx
"use client";

interface BadgeProps {
    children: React.ReactNode;
    color?: string;
    className?: string;
}

export function Badge({ children, color, className = "" }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${className}`}
            style={{
                backgroundColor: color ? `${color}15` : undefined,
                borderColor: color ? `${color}30` : undefined,
                color: color || undefined,
            }}
        >
            {color && (
                <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                />
            )}
            {children}
        </span>
    );
}
