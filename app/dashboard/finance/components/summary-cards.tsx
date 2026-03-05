'use client'

import { DollarSign, TrendingUp, TrendingDown, Banknote } from 'lucide-react'
import { fmt } from './shared'
import type { FinanceSummary } from '@/lib/supabase/finance'

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon, color, trend }: {
    label: string
    value: string
    icon: React.ReactNode
    color: string
    trend: 'positive' | 'negative' | null
}) {
    return (
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
                <div className={`p-1.5 rounded-lg ${color}`}>{icon}</div>
            </div>
            <div>
                <p className="text-lg font-bold text-foreground truncate">{value}</p>
                {trend && (
                    <p className={`text-2xs font-semibold mt-0.5 ${trend === 'positive' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend === 'positive' ? '↑' : '↓'} This month
                    </p>
                )}
            </div>
        </div>
    )
}

// ─── Summary Cards Grid ───────────────────────────────────────────────────────

export function SummaryCards({ summary }: { summary: FinanceSummary }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard
                label="Total Balance"
                value={fmt(summary.totalBalance)}
                icon={<DollarSign className="size-4" />}
                color="bg-primary/10 text-primary"
                trend={null}
            />
            <SummaryCard
                label="Month Income"
                value={fmt(summary.monthIncome)}
                icon={<TrendingUp className="size-4" />}
                color="bg-emerald-500/10 text-emerald-500"
                trend="positive"
            />
            <SummaryCard
                label="Month Expense"
                value={fmt(summary.monthExpense)}
                icon={<TrendingDown className="size-4" />}
                color="bg-rose-500/10 text-rose-500"
                trend="negative"
            />
            <SummaryCard
                label="Net This Month"
                value={fmt(Math.abs(summary.monthNet))}
                icon={<Banknote className="size-4" />}
                color={summary.monthNet >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}
                trend={summary.monthNet >= 0 ? 'positive' : 'negative'}
            />
        </div>
    )
}
