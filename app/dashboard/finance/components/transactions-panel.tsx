'use client'

import { useState } from 'react'
import {
    Plus, Receipt, Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem,
    DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from './shared'
import { TransactionRow } from './transaction-row'
import type { Transaction, TransactionType } from '@/lib/supabase/finance'

// ─── Filter Labels ────────────────────────────────────────────────────────────

const FILTER_LABELS: Record<string, string> = {
    all: 'All',
    income: 'Income',
    expense: 'Expense',
    transfer: 'Transfer',
}

// ─── Transactions Panel ───────────────────────────────────────────────────────

export function TransactionsPanel({ transactions, onDelete, onAdd, onEditTx }: {
    transactions: Transaction[]
    onDelete: (id: string) => void
    onAdd: () => void
    onEditTx: (tx: Transaction) => void
}) {
    const [filter, setFilter] = useState<'all' | TransactionType>('all')
    const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)

    return (
        <div className="bg-card rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm">All Transactions</h3>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7 text-xs rounded-xl gap-1.5">
                                <Filter className="size-3" /> {FILTER_LABELS[filter]}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={filter} onValueChange={(v) => setFilter(v as any)}>
                                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="income">Income</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="expense">Expense</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="transfer">Transfer</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" onClick={onAdd} className="text-xs rounded-xl gap-1 h-7">
                        <Plus className="size-3" /> Add
                    </Button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon={<Receipt className="size-8" />}
                    label="No transactions"
                    action={
                        <Button size="sm" onClick={onAdd} className="rounded-xl text-xs mt-2">
                            Add Transaction
                        </Button>
                    }
                />
            ) : (
                <div className="divide-y divide-border/50">
                    {filtered.map(tx => (
                        <TransactionRow
                            key={tx.id}
                            tx={tx}
                            onDelete={onDelete}
                            onClick={() => onEditTx(tx)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
