'use client'

import { useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from './shared'
import { BudgetProgress } from './budget-progress'
import {
    AddBudgetDialog,
} from '@/components/finance/dialogs'
import type { Budget, Transaction, Category } from '@/lib/supabase/finance'

// ─── Budgets Panel ────────────────────────────────────────────────────────────

export function BudgetsPanel({ budgets, transactions, categories, onRefresh, onEditBudget }: {
    budgets: Budget[]
    transactions: Transaction[]
    categories: Category[]
    onRefresh: () => void
    onEditBudget: (b: Budget) => void
}) {
    const [openAdd, setOpenAdd] = useState(false)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Budgets</h3>
                <Button size="sm" onClick={() => setOpenAdd(true)} className="text-xs rounded-xl gap-1">
                    <Plus className="size-3" /> New Budget
                </Button>
            </div>

            {budgets.length === 0 ? (
                <div className="bg-card rounded-2xl p-10 shadow-sm">
                    <EmptyState
                        icon={<Target className="size-8" />}
                        label="No budgets set"
                        action={
                            <Button size="sm" onClick={() => setOpenAdd(true)} className="rounded-xl text-xs mt-2">
                                Create Budget
                            </Button>
                        }
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgets.map(b => (
                        <div key={b.id} className="bg-card rounded-2xl p-5 shadow-sm">
                            <BudgetProgress
                                budget={b}
                                transactions={transactions}
                                onEdit={() => onEditBudget(b)}
                            />
                        </div>
                    ))}
                </div>
            )}

            <AddBudgetDialog
                open={openAdd}
                onOpenChange={setOpenAdd}
                categories={categories}
                onSave={() => { setOpenAdd(false); onRefresh() }}
            />
        </div>
    )
}
