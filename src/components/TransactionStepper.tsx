// src/components/TransactionStepper.tsx
"use client";

import type { Route, RouteStep } from "@/lib/schemas/route";
import type { StatusState } from "@/lib/utils/constants";
import { Spinner } from "@/components/ui/Spinner";

interface TransactionStepperProps {
    route: Route | null;
    status: StatusState;
    currentStepIndex?: number;
    txHash?: string | null;
    error?: string | null;
}

function getStepIcon(
    stepStatus: string,
    isActive: boolean
): React.ReactNode {
    if (stepStatus === "completed") {
        return (
            <svg className="w-4 h-4 text-accent-green" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                />
            </svg>
        );
    }
    if (stepStatus === "failed") {
        return (
            <svg className="w-4 h-4 text-accent-red" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                />
            </svg>
        );
    }
    if (isActive || stepStatus === "executing") {
        return <Spinner size="sm" className="text-brand-400" />;
    }
    return (
        <div className="w-4 h-4 rounded-full border-2 border-gray-600" />
    );
}

function getStatusLabel(status: StatusState): string {
    switch (status) {
        case "IDLE":
            return "Ready";
        case "QUOTED":
            return "Quote received";
        case "APPROVAL_REQUIRED":
            return "Approval needed";
        case "APPROVING":
            return "Approving token...";
        case "EXECUTING":
            return "Executing transaction...";
        case "BRIDGING":
            return "Bridge in progress...";
        case "COMPLETED":
            return "Transaction complete!";
        case "FAILED":
            return "Transaction failed";
        default:
            return status;
    }
}

export function TransactionStepper({
    route,
    status,
    txHash,
    error,
}: TransactionStepperProps) {
    if (status === "IDLE" || status === "QUOTED") return null;

    return (
        <div className="bg-surface-raised rounded-xl border border-surface-border overflow-hidden animate-slide-up">
            {/* Status Header */}
            <div
                className={`px-4 py-3 border-b border-surface-border ${status === "COMPLETED"
                        ? "bg-accent-green/5"
                        : status === "FAILED"
                            ? "bg-accent-red/5"
                            : "bg-brand-500/5"
                    }`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {status === "COMPLETED" ? (
                            <svg className="w-5 h-5 text-accent-green" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        ) : status === "FAILED" ? (
                            <svg className="w-5 h-5 text-accent-red" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        ) : (
                            <Spinner size="sm" className="text-brand-400" />
                        )}
                        <span
                            className={`text-sm font-medium ${status === "COMPLETED"
                                    ? "text-accent-green"
                                    : status === "FAILED"
                                        ? "text-accent-red"
                                        : "text-brand-300"
                                }`}
                        >
                            {getStatusLabel(status)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Steps */}
            {route?.steps && route.steps.length > 0 && (
                <div className="p-4">
                    <div className="space-y-3">
                        {route.steps.map((step, idx) => {
                            const isActive =
                                (status === "EXECUTING" || status === "APPROVING" || status === "BRIDGING") &&
                                step.status === "executing";
                            return (
                                <div key={step.id} className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className="mt-0.5 flex-shrink-0">
                                        {getStepIcon(step.status, isActive)}
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-sm ${step.status === "completed"
                                                    ? "text-gray-300"
                                                    : isActive
                                                        ? "text-gray-100"
                                                        : "text-gray-500"
                                                }`}
                                        >
                                            {step.description}
                                        </p>
                                        {step.txHash && (
                                            <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">
                                                tx: {step.txHash}
                                            </p>
                                        )}
                                    </div>
                                    {/* Connector line */}
                                    {idx < route.steps.length - 1 && (
                                        <div className="absolute left-[19px] mt-6 w-px h-4 bg-surface-border" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="px-4 pb-4">
                    <div className="bg-accent-red/5 rounded-lg px-3 py-2 border border-accent-red/10">
                        <p className="text-xs text-accent-red">{error}</p>
                    </div>
                </div>
            )}

            {/* TX Hash */}
            {txHash && (
                <div className="px-4 pb-4">
                    <div className="bg-surface-overlay rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-500">
                            Transaction:{" "}
                            <span className="font-mono text-gray-400">{txHash}</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
