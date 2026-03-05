'use client'

import { DynamicIcon } from '@/lib/dynamic-icon'
import { AlertCircle, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fmt } from './shared'
import type { Budget, Transaction } from '@/lib/supabase/finance'

// ─── Budget Progress ──────────────────────────────────────────────────────────

export function BudgetProgress({ budget, transactions, onEdit }: {
    budget: Budget
    transactions: Transaction[]
    onEdit?: () => void
}) {
    const spent = transactions
        .filter(t =>
            t.category_id === budget.category_id &&
            t.type === 'expense' &&
            t.date >= budget.period_start &&
            t.date <= budget.period_end
        )
        .reduce((s, t) => s + t.amount, 0)

    const pct = Math.min((spent / budget.amount) * 100, 100)
    const over = spent > budget.amount
    const barColor = over ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
    const color = budget.category?.color ?? '#786BEE'

    return (
        <div className="space-y-2 group relative">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg" style={{ background: `${color}20`, color }}>
                        <DynamicIcon name={budget.category?.icon} className="size-3.5" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold">{budget.category?.name ?? 'Category'}</p>
                        <p className="text-2xs text-muted-foreground capitalize">{budget.period}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={onEdit}
                        >
                            <Pencil className="size-3" />
                        </Button>
                    )}
                    {over && <AlertCircle className="size-3.5 text-rose-500 flex-shrink-0" />}
                </div>
            </div>

            <div className="w-full bg-muted rounded-full h-1.5">
                <div
                    className={`${barColor} h-1.5 rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                />
            </div>

            <div className="flex justify-between text-2xs text-muted-foreground font-medium">
                <span>{fmt(spent)}</span>
                <span className={over ? 'text-rose-500 font-bold' : ''}>{fmt(budget.amount)}</span>
            </div>
        </div>
    )
}
