'use client'

import { useState } from 'react'
import { Plus, PiggyBank, Trash2, CheckCircle2, Target } from 'lucide-react'
import { DynamicIcon } from '@/lib/dynamic-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { EmptyState, fmt } from './shared'
import type { SavingGoal } from '@/lib/supabase/finance'

// ─── Goal Mini Card (for overview sidebar) ────────────────────────────────────

export function GoalMiniCard({ goal }: { goal: SavingGoal }) {
    const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    const color = goal.color ?? '#786BEE'

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold truncate">{goal.name}</p>
                <span className="text-2xs text-muted-foreground">{pct.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
                <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${pct}%`, background: color }}
                />
            </div>
            <p className="text-2xs text-muted-foreground">
                {fmt(goal.current_amount)} / {fmt(goal.target_amount)}
            </p>
        </div>
    )
}

// ─── Goal Card (full card for goals panel) ────────────────────────────────────

function GoalCard({ goal, onUpdate, onDelete }: {
    goal: SavingGoal
    onUpdate: (id: string, p: Partial<SavingGoal>) => void
    onDelete: (id: string) => void
}) {
    const [adding, setAdding] = useState(false)
    const [amount, setAmount] = useState('')
    const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    const color = goal.color ?? '#786BEE'
    const remaining = goal.target_amount - goal.current_amount
    const isAchieved = goal.is_achieved || goal.current_amount >= goal.target_amount

    const handleAdd = async () => {
        const n = parseFloat(amount)
        if (isNaN(n) || n <= 0) { toast.error('Enter valid amount'); return }
        await onUpdate(goal.id, { current_amount: goal.current_amount + n })
        setAmount('')
        setAdding(false)
    }

    return (
        <div className="bg-card rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-primary"
                        style={{ background: `${color}20` }}
                    >
                        <DynamicIcon name={goal.icon ?? 'Target'} className="size-4" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">{goal.name}</p>
                        {goal.deadline && (
                            <p className="text-2xs text-muted-foreground">Due {goal.deadline}</p>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => onDelete(goal.id)}
                    className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                >
                    <Trash2 className="size-3.5" />
                </button>
            </div>

            {isAchieved ? (
                <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-semibold">
                    <CheckCircle2 className="size-4" /> Goal Achieved! 🎉
                </div>
            ) : (
                <>
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">Progress</span>
                            <span>{pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="h-2 rounded-full transition-all"
                                style={{ width: `${pct}%`, background: color }}
                            />
                        </div>
                        <div className="flex justify-between text-2xs text-muted-foreground font-medium">
                            <span>{fmt(goal.current_amount)}</span>
                            <span>{fmt(goal.target_amount)}</span>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Still needs <span className="text-foreground font-semibold">{fmt(remaining)}</span>
                    </p>

                    {adding ? (
                        <div className="flex gap-2">
                            <Input
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="Amount"
                                type="number"
                                className="h-8 text-xs rounded-xl"
                            />
                            <Button size="sm" className="h-8 rounded-xl text-xs" onClick={handleAdd}>
                                Add
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs" onClick={() => setAdding(false)}>
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs rounded-xl"
                            onClick={() => setAdding(true)}
                        >
                            <Plus className="size-3 mr-1" /> Add Funds
                        </Button>
                    )}
                </>
            )}
        </div>
    )
}

// ─── Goals Panel ──────────────────────────────────────────────────────────────

export function GoalsPanel({ goals, onAdd, onUpdate, onDelete }: {
    goals: SavingGoal[]
    onAdd: () => void
    onUpdate: (id: string, p: Partial<SavingGoal>) => void
    onDelete: (id: string) => void
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Saving Goals</h3>
                <Button size="sm" onClick={onAdd} className="text-xs rounded-xl gap-1">
                    <Plus className="size-3" /> New Goal
                </Button>
            </div>

            {goals.length === 0 ? (
                <div className="bg-card rounded-2xl p-10 shadow-sm">
                    <EmptyState
                        icon={<PiggyBank className="size-8" />}
                        label="No saving goals"
                        action={
                            <Button size="sm" onClick={onAdd} className="rounded-xl text-xs mt-2">
                                Create Goal
                            </Button>
                        }
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {goals.map(g => (
                        <GoalCard key={g.id} goal={g} onUpdate={onUpdate} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    )
}
