'use client'

import { Button } from '@/components/ui/button'

// ─── Currency Formatter ────────────────────────────────────────────────────────

export const fmt = (n: number, currency = 'IDR') =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ icon, label, action }: {
    icon: React.ReactNode
    label: string
    action?: React.ReactNode
}) {
    return (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
            <div className="opacity-40">{icon}</div>
            <p className="text-xs font-medium">{label}</p>
            {action}
        </div>
    )
}
