'use client'

import { useState } from 'react'
import {
    Plus, PiggyBank, CreditCard, Target, Receipt,
    ArrowUpRight, ArrowDownLeft, BarChart3, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { DynamicIcon } from '@/lib/dynamic-icon'
import { Button } from '@/components/ui/button'
import { Bar, BarChart, XAxis, YAxis, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { EmptyState, fmt } from './shared'
import { TransactionRow } from './transaction-row'
import { BudgetProgress } from './budget-progress'
import { GoalMiniCard } from './goals-panel'
import type { Transaction, Budget, SavingGoal, Debt, Category } from '@/lib/supabase/finance'

// ─── Chart Config ─────────────────────────────────────────────────────────────

const CHART_CONFIG = {
    amount: { label: 'Total Expense' },
} satisfies ChartConfig

// ─── Overview Panel ───────────────────────────────────────────────────────────

export function OverviewPanel({ transactions, budgets, goals, debts, categories, onAddTx, onAddGoal, onEditTx }: {
    transactions: Transaction[]
    budgets: Budget[]
    goals: SavingGoal[]
    debts: Debt[]
    categories: Category[]
    onAddTx: () => void
    onAddGoal: () => void
    onEditTx: (tx: Transaction) => void
}) {
    // ── Month navigation ──
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })

    const availableMonths = Array.from(new Set(transactions.map(t => t.date.slice(0, 7)))).sort()
    const monthIndex = availableMonths.indexOf(selectedMonth)

    const handlePrev = () => { if (monthIndex > 0) setSelectedMonth(availableMonths[monthIndex - 1]) }
    const handleNext = () => { if (monthIndex < availableMonths.length - 1) setSelectedMonth(availableMonths[monthIndex + 1]) }

    const monthLabel = () => {
        if (!selectedMonth) return 'No Data'
        const [y, m] = selectedMonth.split('-')
        return new Date(parseInt(y), parseInt(m) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
    }

    // ── Derived data ──
    const recent = transactions.slice(0, 5)
    const activeDebts = debts.filter(d => d.status === 'active')
    const payable = activeDebts.filter(d => d.direction === 'payable').reduce((s, d) => s + d.principal - d.paid_amount, 0)
    const receivable = activeDebts.filter(d => d.direction === 'receivable').reduce((s, d) => s + d.principal - d.paid_amount, 0)

    // ── Chart data ──
    const filteredForChart = transactions.filter(t => t.date.startsWith(selectedMonth))
    const expenseByCategory = filteredForChart
        .filter(t => t.type === 'expense' && t.category_id)
        .reduce((acc, t) => {
            acc[t.category_id!] = (acc[t.category_id!] || 0) + Math.abs(t.amount)
            return acc
        }, {} as Record<string, number>)

    const chartData = Object.entries(expenseByCategory)
        .map(([categoryId, amount]) => {
            const cat = categories.find(c => c.id === categoryId)
            return {
                id: categoryId,
                name: cat?.name || 'Unknown',
                icon: cat?.icon || 'Tag',
                amount,
                fill: cat?.color || 'hsl(var(--primary))',
            }
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-4">
                {/* Recent Transactions */}
                <div className="bg-card rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-sm">Recent Transactions</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{transactions.length} total</p>
                        </div>
                        <Button onClick={onAddTx} size="sm" variant="outline" className="text-xs rounded-xl gap-1">
                            <Plus className="size-3" /> Add
                        </Button>
                    </div>
                    {recent.length === 0 ? (
                        <EmptyState
                            icon={<Receipt className="size-8" />}
                            label="No transactions yet"
                            action={
                                <Button size="sm" onClick={onAddTx} className="rounded-xl text-xs mt-2">
                                    Add Transaction
                                </Button>
                            }
                        />
                    ) : (
                        <div className="space-y-2">
                            {recent.map(tx => (
                                <TransactionRow key={tx.id} tx={tx} onClick={() => onEditTx(tx)} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Budget + Goals overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-card rounded-2xl p-5 shadow-sm">
                        <h3 className="font-bold text-sm mb-4">Budget Overview</h3>
                        {budgets.length === 0 ? (
                            <EmptyState icon={<Target className="size-6" />} label="No budgets set" />
                        ) : (
                            <div className="space-y-5">
                                {budgets.slice(0, 4).map(b => (
                                    <BudgetProgress key={b.id} budget={b} transactions={transactions} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-card rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                                    <PiggyBank className="size-3.5" />
                                </div>
                                <h3 className="font-bold text-sm">Saving Goals</h3>
                            </div>
                            <Button size="sm" variant="ghost" className="size-7 p-0 rounded-xl" onClick={onAddGoal}>
                                <Plus className="size-3.5" />
                            </Button>
                        </div>
                        {goals.length === 0 ? (
                            <EmptyState icon={<PiggyBank className="size-6" />} label="No goals yet" />
                        ) : (
                            <div className="space-y-3">
                                {goals.slice(0, 3).map(g => (
                                    <GoalMiniCard key={g.id} goal={g} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
                {/* Expenses by Category Chart */}
                <div className="bg-card rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-sm">Expenses by Category</h3>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="size-6 rounded-lg" onClick={handlePrev} disabled={monthIndex <= 0}>
                                <ChevronLeft className="size-3" />
                            </Button>
                            <span className="text-2xs font-bold min-w-20 text-center">{monthLabel()}</span>
                            <Button variant="ghost" size="icon" className="size-6 rounded-lg" onClick={handleNext} disabled={monthIndex === -1 || monthIndex >= availableMonths.length - 1}>
                                <ChevronRight className="size-3" />
                            </Button>
                        </div>
                    </div>

                    {chartData.length > 0 ? (
                        <ChartContainer config={CHART_CONFIG} className="h-[250px] w-full">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, left: 0, right: 0, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tickLine={false}
                                    axisLine={false}
                                    width={40}
                                    tick={(props: any) => {
                                        const { x, y, payload } = props
                                        const entry = chartData.find(d => d.name === payload.value)
                                        if (!entry) return <g />
                                        return (
                                            <g transform={`translate(${x},${y})`}>
                                                <foreignObject x={-30} y={-10} width={20} height={20}>
                                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                                        <DynamicIcon name={entry.icon} className="size-3.5" />
                                                    </div>
                                                </foreignObject>
                                            </g>
                                        )
                                    }}
                                />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Bar dataKey="amount" radius={4} barSize={20}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center">
                            <EmptyState icon={<BarChart3 className="size-6" />} label="No expenses for this month" />
                        </div>
                    )}
                </div>

                {/* Debt snapshot */}
                <div className="bg-card rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                            <CreditCard className="size-3.5" />
                        </div>
                        <h3 className="font-bold text-sm">Debt Summary</h3>
                    </div>
                    <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <ArrowUpRight className="size-3 text-rose-500" /> You owe
                            </span>
                            <span className="text-sm font-bold text-rose-500">{fmt(payable)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <ArrowDownLeft className="size-3 text-emerald-500" /> Owed to you
                            </span>
                            <span className="text-sm font-bold text-emerald-500">{fmt(receivable)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
