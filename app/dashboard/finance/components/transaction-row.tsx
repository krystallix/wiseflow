'use client'

import {
    ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Trash2,
} from 'lucide-react'
import { DynamicIcon } from '@/lib/dynamic-icon'
import { Button } from '@/components/ui/button'
import { fmt } from './shared'
import type { Transaction, TransactionType } from '@/lib/supabase/finance'

// ─── Type Config Maps ─────────────────────────────────────────────────────────

const TX_ICONS: Record<TransactionType, React.ReactNode> = {
    income: <ArrowDownLeft className="size-3.5" />,
    expense: <ArrowUpRight className="size-3.5" />,
    transfer: <ArrowLeftRight className="size-3.5" />,
}

const TX_BG: Record<TransactionType, string> = {
    income: 'bg-emerald-500/10',
    expense: 'bg-rose-500/10',
    transfer: 'bg-chart-1/10',
}

const TX_AMOUNT_COLOR: Record<TransactionType, string> = {
    income: 'text-emerald-500 font-bold',
    expense: 'text-rose-500 font-bold',
    transfer: 'text-chart-1 font-bold',
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

export function TransactionRow({ tx, onDelete, onClick }: {
    tx: Transaction
    onDelete?: (id: string) => void
    onClick?: () => void
}) {
    const prefix = tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '↔'

    return (
        <div
            className={`flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl transition-colors group ${onClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
            onClick={onClick}
        >
            {/* Type icon */}
            <div className={`p-2 rounded-xl ${TX_BG[tx.type]} flex-shrink-0`}>
                {TX_ICONS[tx.type]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">
                    {tx.note || tx.category?.name || tx.type}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {tx.category && (
                        <span
                            className="inline-flex items-center gap-1 text-2xs font-medium px-1.5 py-0.5 rounded-md"
                            style={{
                                background: (tx.category.color ?? '#786BEE') + '22',
                                color: tx.category.color ?? '#786BEE',
                            }}
                        >
                            <DynamicIcon name={tx.category.icon ?? ''} className="size-2.5" />
                            {tx.category.name}
                        </span>
                    )}
                    <span className="text-2xs text-muted-foreground">
                        {tx.wallet?.name} · {tx.date}
                    </span>
                </div>
            </div>

            {/* Amount + delete */}
            <div className="flex items-center gap-2">
                <p className={`text-sm font-bold tabular-nums ${TX_AMOUNT_COLOR[tx.type]}`}>
                    {prefix}{fmt(tx.amount, tx.wallet?.currency)}
                </p>
                {onDelete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onDelete(tx.id) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
