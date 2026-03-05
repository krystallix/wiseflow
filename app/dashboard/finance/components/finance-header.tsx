'use client'

import { Wallet, Plus, Tags } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Finance Header ───────────────────────────────────────────────────────────

export function FinanceHeader({ onAddWallet, onAddCategory, onAddTransaction }: {
    onAddWallet: () => void
    onAddCategory: () => void
    onAddTransaction: () => void
}) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Finance</h2>
                <p className="text-muted-foreground text-sm mt-0.5">Manage your money, budgets, and goals</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <Button onClick={onAddWallet} variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs font-semibold">
                    <Wallet className="size-3.5" /> Add Wallet
                </Button>
                <Button onClick={onAddCategory} variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs font-semibold">
                    <Tags className="size-3.5" /> Category
                </Button>
                <Button onClick={onAddTransaction} size="sm" className="rounded-xl gap-1.5 text-xs font-semibold">
                    <Plus className="size-3.5" /> Transaction
                </Button>
            </div>
        </div>
    )
}
