'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Wallet, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownLeft,
    ArrowLeftRight, Target, CreditCard, Users, PiggyBank, ChevronRight,
    MoreHorizontal, Trash2, CheckCircle2, Clock, AlertCircle, X,
    DollarSign, BarChart3, Banknote, Receipt
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
    getWallets, getTransactions, getBudgets, getSavingGoals, getDebts, getCategories,
    createTransaction, createWallet, createSavingGoal, updateSavingGoal, deleteSavingGoal,
    deleteTransaction, computeSummary,
    type Wallet as WalletType, type Transaction, type Budget, type SavingGoal,
    type Debt, type Category, type TransactionType
} from '@/lib/supabase/finance'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number, currency = 'IDR') =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

const fmtShort = (n: number) => {
    if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
}

const today = () => new Date().toISOString().split('T')[0]

const WALLET_TYPES = ['cash', 'bank', 'e-wallet', 'investment', 'other']
const WALLET_COLORS = ['#786BEE', '#E2A9F3', '#94C3F6', '#34D399', '#F59E0B', '#F87171', '#60A5FA', '#A78BFA']

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'transactions' | 'budgets' | 'goals' | 'debts'

// ─── Main component ────────────────────────────────────────────────────────────

export default function FinanceClient() {
    const [tab, setTab] = useState<Tab>('overview')
    const [wallets, setWallets] = useState<WalletType[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [goals, setGoals] = useState<SavingGoal[]>([])
    const [debts, setDebts] = useState<Debt[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    // Modals
    const [showAddTx, setShowAddTx] = useState(false)
    const [showAddWallet, setShowAddWallet] = useState(false)
    const [showAddGoal, setShowAddGoal] = useState(false)

    const fetchAll = useCallback(async () => {
        try {
            const [w, tx, b, g, d, cats] = await Promise.all([
                getWallets(), getTransactions({ limit: 50 }), getBudgets(),
                getSavingGoals(), getDebts(), getCategories()
            ])
            setWallets(w)
            setTransactions(tx)
            setBudgets(b)
            setGoals(g)
            setDebts(d)
            setCategories(cats)
        } catch (e: any) {
            toast.error('Failed to load finance data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchAll() }, [fetchAll])

    const summary = computeSummary(wallets, transactions)

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview', icon: <BarChart3 className="size-3.5" /> },
        { id: 'transactions', label: 'Transactions', icon: <Receipt className="size-3.5" /> },
        { id: 'budgets', label: 'Budgets', icon: <Target className="size-3.5" /> },
        { id: 'goals', label: 'Goals', icon: <PiggyBank className="size-3.5" /> },
        { id: 'debts', label: 'Debts', icon: <CreditCard className="size-3.5" /> },
    ]

    if (loading) return <FinanceSkeleton />

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Finance</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">Manage your money, budgets, and goals</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowAddWallet(true)} variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs font-semibold">
                        <Wallet className="size-3.5" /> Add Wallet
                    </Button>
                    <Button onClick={() => setShowAddTx(true)} size="sm" className="rounded-xl gap-1.5 text-xs font-semibold">
                        <Plus className="size-3.5" /> Transaction
                    </Button>
                </div>
            </div>

            {/* ── Summary Cards ────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

            {/* ── Wallets row ──────────────────────────────────────── */}
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                {wallets.length === 0 ? (
                    <EmptyWalletCard onClick={() => setShowAddWallet(true)} />
                ) : (
                    wallets.map(w => <WalletCard key={w.id} wallet={w} />)
                )}
            </div>

            {/* ── Navigation Tabs ──────────────────────────────────── */}
            <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${tab === t.id
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* ── Tab Panels ───────────────────────────────────────── */}
            {tab === 'overview' && (
                <OverviewPanel
                    transactions={transactions}
                    budgets={budgets}
                    goals={goals}
                    debts={debts}
                    onAddTx={() => setShowAddTx(true)}
                    onAddGoal={() => setShowAddGoal(true)}
                />
            )}
            {tab === 'transactions' && (
                <TransactionsPanel
                    transactions={transactions}
                    onDelete={async (id) => {
                        await deleteTransaction(id)
                        toast.success('Transaction deleted')
                        fetchAll()
                    }}
                    onAdd={() => setShowAddTx(true)}
                />
            )}
            {tab === 'budgets' && <BudgetsPanel budgets={budgets} transactions={transactions} categories={categories} onRefresh={fetchAll} />}
            {tab === 'goals' && (
                <GoalsPanel
                    goals={goals}
                    onAdd={() => setShowAddGoal(true)}
                    onUpdate={async (id, payload) => {
                        await updateSavingGoal(id, payload)
                        toast.success('Goal updated')
                        fetchAll()
                    }}
                    onDelete={async (id) => {
                        await deleteSavingGoal(id)
                        toast.success('Goal deleted')
                        fetchAll()
                    }}
                />
            )}
            {tab === 'debts' && <DebtsPanel debts={debts} onRefresh={fetchAll} />}

            {/* ── Modals ───────────────────────────────────────────── */}
            {showAddTx && (
                <AddTransactionModal
                    wallets={wallets}
                    categories={categories}
                    onClose={() => setShowAddTx(false)}
                    onSave={async (payload) => {
                        await createTransaction(payload)
                        toast.success('Transaction added')
                        setShowAddTx(false)
                        fetchAll()
                    }}
                />
            )}
            {showAddWallet && (
                <AddWalletModal
                    onClose={() => setShowAddWallet(false)}
                    onSave={async (payload) => {
                        await createWallet(payload)
                        toast.success('Wallet created')
                        setShowAddWallet(false)
                        fetchAll()
                    }}
                />
            )}
            {showAddGoal && (
                <AddGoalModal
                    wallets={wallets}
                    onClose={() => setShowAddGoal(false)}
                    onSave={async (payload) => {
                        await createSavingGoal(payload)
                        toast.success('Goal created')
                        setShowAddGoal(false)
                        fetchAll()
                    }}
                />
            )}
        </div>
    )
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon, color, trend }: {
    label: string; value: string; icon: React.ReactNode; color: string; trend: 'positive' | 'negative' | null
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
                    <p className={`text-[10px] font-semibold mt-0.5 ${trend === 'positive' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend === 'positive' ? '↑' : '↓'} This month
                    </p>
                )}
            </div>
        </div>
    )
}

// ─── Wallet Card ──────────────────────────────────────────────────────────────

function WalletCard({ wallet }: { wallet: WalletType }) {
    const bg = wallet.color ?? '#786BEE'
    const typeIcons: Record<string, string> = { bank: '🏦', cash: '💵', 'e-wallet': '📱', investment: '📈', other: '💳' }
    return (
        <div
            className="flex-shrink-0 w-52 rounded-2xl p-4 text-white shadow-sm flex flex-col gap-3 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${bg}cc, ${bg})` }}
        >
            <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white" />
                <div className="absolute -right-2 top-8 w-16 h-16 rounded-full bg-white" />
            </div>
            <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-semibold opacity-80 capitalize">{wallet.type} {wallet.is_default ? '⭐' : ''}</span>
                <span className="text-lg">{typeIcons[wallet.type] ?? '💳'}</span>
            </div>
            <div className="relative z-10">
                <p className="text-xs opacity-70 font-medium">{wallet.name}</p>
                <p className="text-xl font-bold mt-0.5">{fmt(wallet.balance, wallet.currency)}</p>
            </div>
        </div>
    )
}

function EmptyWalletCard({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex-shrink-0 w-52 rounded-2xl p-4 border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
            <Plus className="size-5" />
            <span className="text-xs font-semibold">Add Wallet</span>
        </button>
    )
}

// ─── Overview Panel ───────────────────────────────────────────────────────────

function OverviewPanel({ transactions, budgets, goals, debts, onAddTx, onAddGoal }: {
    transactions: Transaction[]; budgets: Budget[]; goals: SavingGoal[]; debts: Debt[];
    onAddTx: () => void; onAddGoal: () => void
}) {
    const recent = transactions.slice(0, 5)
    const activeDebts = debts.filter(d => d.status === 'active')
    const payable = activeDebts.filter(d => d.direction === 'payable').reduce((s, d) => s + d.principal - d.paid_amount, 0)
    const receivable = activeDebts.filter(d => d.direction === 'receivable').reduce((s, d) => s + d.principal - d.paid_amount, 0)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Transactions */}
            <div className="lg:col-span-2 bg-card rounded-2xl p-5 shadow-sm">
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
                    <EmptyState icon={<Receipt className="size-8" />} label="No transactions yet" action={<Button size="sm" onClick={onAddTx} className="rounded-xl text-xs mt-2">Add Transaction</Button>} />
                ) : (
                    <div className="space-y-2">
                        {recent.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
                    </div>
                )}
            </div>

            {/* Right column */}
            <div className="space-y-4">
                {/* Debt snapshot */}
                <div className="bg-card rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><CreditCard className="size-3.5" /></div>
                        <h3 className="font-bold text-sm">Debt Summary</h3>
                    </div>
                    <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><ArrowUpRight className="size-3 text-rose-500" /> You owe</span>
                            <span className="text-sm font-bold text-rose-500">{fmt(payable)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><ArrowDownLeft className="size-3 text-emerald-500" /> Owed to you</span>
                            <span className="text-sm font-bold text-emerald-500">{fmt(receivable)}</span>
                        </div>
                    </div>
                </div>

                {/* Goals snapshot */}
                <div className="bg-card rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><PiggyBank className="size-3.5" /></div>
                            <h3 className="font-bold text-sm">Saving Goals</h3>
                        </div>
                        <Button size="sm" variant="ghost" className="text-xs rounded-xl size-7 p-0" onClick={onAddGoal}>
                            <Plus className="size-3.5" />
                        </Button>
                    </div>
                    {goals.length === 0 ? (
                        <EmptyState icon={<PiggyBank className="size-6" />} label="No goals yet" />
                    ) : (
                        <div className="space-y-3">
                            {goals.slice(0, 3).map(g => <GoalMiniCard key={g.id} goal={g} />)}
                        </div>
                    )}
                </div>
            </div>

            {/* Budget progress - full width */}
            {budgets.length > 0 && (
                <div className="lg:col-span-3 bg-card rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-sm mb-4">Budget Overview</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {budgets.slice(0, 6).map(b => <BudgetProgress key={b.id} budget={b} transactions={transactions} />)}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TransactionRow({ tx, onDelete }: { tx: Transaction; onDelete?: (id: string) => void }) {
    const icons: Record<TransactionType, React.ReactNode> = {
        income: <ArrowDownLeft className="size-3.5 text-emerald-500" />,
        expense: <ArrowUpRight className="size-3.5 text-rose-500" />,
        transfer: <ArrowLeftRight className="size-3.5 text-chart-1" />,
    }
    const colors: Record<TransactionType, string> = {
        income: 'bg-emerald-500/10',
        expense: 'bg-rose-500/10',
        transfer: 'bg-chart-1/10',
    }
    const amountColors: Record<TransactionType, string> = {
        income: 'text-emerald-500',
        expense: 'text-rose-500',
        transfer: 'text-chart-1',
    }
    const prefix = tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '↔'

    return (
        <div className="flex items-center gap-3 py-2 group">
            <div className={`p-2 rounded-xl ${colors[tx.type]} flex-shrink-0`}>
                {icons[tx.type]}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{tx.note || tx.category?.name || tx.type}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{tx.wallet?.name} · {tx.date}</p>
            </div>
            <div className="flex items-center gap-2">
                <p className={`text-sm font-bold ${amountColors[tx.type]}`}>{prefix}{fmt(tx.amount, tx.wallet?.currency)}</p>
                {onDelete && (
                    <button
                        onClick={() => onDelete(tx.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 className="size-3" />
                    </button>
                )}
            </div>
        </div>
    )
}

// ─── Transactions Panel ────────────────────────────────────────────────────────

function TransactionsPanel({ transactions, onDelete, onAdd }: {
    transactions: Transaction[]
    onDelete: (id: string) => void
    onAdd: () => void
}) {
    const [filter, setFilter] = useState<'all' | TransactionType>('all')
    const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)

    return (
        <div className="bg-card rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm">All Transactions</h3>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                        {(['all', 'income', 'expense', 'transfer'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all capitalize ${filter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <Button size="sm" onClick={onAdd} className="text-xs rounded-xl gap-1 h-7">
                        <Plus className="size-3" /> Add
                    </Button>
                </div>
            </div>
            {filtered.length === 0 ? (
                <EmptyState icon={<Receipt className="size-8" />} label="No transactions" action={<Button size="sm" onClick={onAdd} className="rounded-xl text-xs mt-2">Add Transaction</Button>} />
            ) : (
                <div className="divide-y divide-border/50">
                    {filtered.map(tx => (
                        <TransactionRow key={tx.id} tx={tx} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Budget Progress ──────────────────────────────────────────────────────────

function BudgetProgress({ budget, transactions }: { budget: Budget; transactions: Transaction[] }) {
    const spent = transactions
        .filter(t => t.category_id === budget.category_id && t.type === 'expense' && t.date >= budget.period_start && t.date <= budget.period_end)
        .reduce((s, t) => s + t.amount, 0)
    const pct = Math.min((spent / budget.amount) * 100, 100)
    const over = spent > budget.amount
    const barColor = over ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
    const color = budget.category?.color ?? '#786BEE'
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg" style={{ background: `${color}20`, color }}>{budget.category?.icon ?? '📦'}</div>
                    <div>
                        <p className="text-xs font-semibold">{budget.category?.name ?? 'Category'}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{budget.period}</p>
                    </div>
                </div>
                {over && <AlertCircle className="size-3.5 text-rose-500 flex-shrink-0" />}
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
                <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                <span>{fmt(spent)}</span>
                <span className={over ? 'text-rose-500 font-bold' : ''}>{fmt(budget.amount)}</span>
            </div>
        </div>
    )
}

// ─── Budgets Panel ────────────────────────────────────────────────────────────

function BudgetsPanel({ budgets, transactions, categories, onRefresh }: {
    budgets: Budget[]; transactions: Transaction[]; categories: Category[]; onRefresh: () => void
}) {
    const [showAdd, setShowAdd] = useState(false)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Budgets</h3>
                <Button size="sm" onClick={() => setShowAdd(true)} className="text-xs rounded-xl gap-1">
                    <Plus className="size-3" /> New Budget
                </Button>
            </div>
            {budgets.length === 0 ? (
                <div className="bg-card rounded-2xl p-10 shadow-sm">
                    <EmptyState icon={<Target className="size-8" />} label="No budgets set" action={<Button size="sm" onClick={() => setShowAdd(true)} className="rounded-xl text-xs mt-2">Create Budget</Button>} />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgets.map(b => (
                        <div key={b.id} className="bg-card rounded-2xl p-5 shadow-sm">
                            <BudgetProgress budget={b} transactions={transactions} />
                        </div>
                    ))}
                </div>
            )}
            {showAdd && (
                <AddBudgetModal
                    categories={categories.filter(c => c.type === 'expense')}
                    onClose={() => setShowAdd(false)}
                    onSave={async () => { setShowAdd(false); onRefresh() }}
                />
            )}
        </div>
    )
}

// ─── Goal Mini Card ───────────────────────────────────────────────────────────

function GoalMiniCard({ goal }: { goal: SavingGoal }) {
    const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    const color = goal.color ?? '#786BEE'
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold truncate">{goal.name}</p>
                <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
            </div>
            <p className="text-[10px] text-muted-foreground">{fmt(goal.current_amount)} / {fmt(goal.target_amount)}</p>
        </div>
    )
}

// ─── Goals Panel ──────────────────────────────────────────────────────────────

function GoalsPanel({ goals, onAdd, onUpdate, onDelete }: {
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
                    <EmptyState icon={<PiggyBank className="size-8" />} label="No saving goals" action={<Button size="sm" onClick={onAdd} className="rounded-xl text-xs mt-2">Create Goal</Button>} />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {goals.map(g => <GoalCard key={g.id} goal={g} onUpdate={onUpdate} onDelete={onDelete} />)}
                </div>
            )}
        </div>
    )
}

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
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ background: `${color}20` }}>
                        {goal.icon ?? '🎯'}
                    </div>
                    <div>
                        <p className="text-sm font-bold">{goal.name}</p>
                        {goal.deadline && <p className="text-[10px] text-muted-foreground">Due {goal.deadline}</p>}
                    </div>
                </div>
                <button onClick={() => onDelete(goal.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
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
                            <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                            <span>{fmt(goal.current_amount)}</span>
                            <span>{fmt(goal.target_amount)}</span>
                        </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Still needs <span className="text-foreground font-semibold">{fmt(remaining)}</span></p>
                    {adding ? (
                        <div className="flex gap-2">
                            <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" type="number" className="h-8 text-xs rounded-xl" />
                            <Button size="sm" className="h-8 rounded-xl text-xs" onClick={handleAdd}>Add</Button>
                            <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs" onClick={() => setAdding(false)}>Cancel</Button>
                        </div>
                    ) : (
                        <Button size="sm" variant="outline" className="w-full text-xs rounded-xl" onClick={() => setAdding(true)}>
                            <Plus className="size-3 mr-1" /> Add Funds
                        </Button>
                    )}
                </>
            )}
        </div>
    )
}

// ─── Debts Panel ──────────────────────────────────────────────────────────────

function DebtsPanel({ debts, onRefresh }: { debts: Debt[]; onRefresh: () => void }) {
    const [filter, setFilter] = useState<'all' | 'payable' | 'receivable'>('all')
    const filtered = filter === 'all' ? debts : debts.filter(d => d.direction === filter)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Debts & Loans</h3>
                <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                    {(['all', 'payable', 'receivable'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all capitalize ${filter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>
            {filtered.length === 0 ? (
                <div className="bg-card rounded-2xl p-10 shadow-sm">
                    <EmptyState icon={<CreditCard className="size-8" />} label="No debts" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filtered.map(d => <DebtCard key={d.id} debt={d} />)}
                </div>
            )}
        </div>
    )
}

function DebtCard({ debt }: { debt: Debt }) {
    const remaining = debt.principal - debt.paid_amount
    const pct = Math.min((debt.paid_amount / debt.principal) * 100, 100)
    const isPayable = debt.direction === 'payable'
    const statusIcons = { active: <Clock className="size-3" />, settled: <CheckCircle2 className="size-3" />, cancelled: <X className="size-3" /> }
    const statusColors = { active: 'text-amber-500 bg-amber-500/10', settled: 'text-emerald-500 bg-emerald-500/10', cancelled: 'text-muted-foreground bg-muted' }

    return (
        <div className="bg-card rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {debt.contact?.name?.charAt(0).toUpperCase() ?? 'U'}
                    </div>
                    <div>
                        <p className="text-sm font-bold">{debt.contact?.name ?? 'Unknown'}</p>
                        <p className="text-[10px] text-muted-foreground">{isPayable ? 'You owe them' : 'They owe you'}</p>
                    </div>
                </div>
                <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[debt.status]}`}>
                    {statusIcons[debt.status]} {debt.status}
                </span>
            </div>

            <div>
                <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-semibold">{fmt(debt.paid_amount)} / {fmt(debt.principal)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${isPayable ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                </div>
            </div>

            <div className="flex justify-between items-center">
                <div>
                    <p className="text-[10px] text-muted-foreground">Remaining</p>
                    <p className={`text-sm font-bold ${isPayable ? 'text-rose-500' : 'text-emerald-500'}`}>{fmt(remaining)}</p>
                </div>
                {debt.due_date && (
                    <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Due</p>
                        <p className="text-xs font-semibold">{debt.due_date}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-md p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-base">{title}</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                        <X className="size-4" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}

function AddTransactionModal({ wallets, categories, onClose, onSave }: {
    wallets: WalletType[]; categories: Category[]
    onClose: () => void; onSave: (p: any) => Promise<void>
}) {
    const [type, setType] = useState<TransactionType>('expense')
    const [walletId, setWalletId] = useState(wallets.find(w => w.is_default)?.id ?? wallets[0]?.id ?? '')
    const [categoryId, setCategoryId] = useState('')
    const [amount, setAmount] = useState('')
    const [note, setNote] = useState('')
    const [date, setDate] = useState(today())
    const [transferTo, setTransferTo] = useState('')
    const [saving, setSaving] = useState(false)

    const filteredCats = categories.filter(c => c.type === type || type === 'transfer')

    const handleSave = async () => {
        const n = parseFloat(amount)
        if (!walletId) { toast.error('Select a wallet'); return }
        if (isNaN(n) || n <= 0) { toast.error('Enter valid amount'); return }
        if (type === 'transfer' && !transferTo) { toast.error('Select destination wallet'); return }

        setSaving(true)
        try {
            await onSave({
                wallet_id: walletId,
                category_id: categoryId || null,
                type,
                amount: n,
                note: note || null,
                date,
                transfer_to_wallet_id: type === 'transfer' ? transferTo : null,
                debt_id: null,
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal title="New Transaction" onClose={onClose}>
            {/* Type toggle */}
            <div className="flex gap-1 bg-muted p-1 rounded-xl mb-4">
                {(['income', 'expense', 'transfer'] as const).map(t => (
                    <button key={t} onClick={() => setType(t)} className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${type === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                        {t}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Amount</label>
                    <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" type="number" className="text-2xl font-bold h-12 rounded-xl" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">From Wallet</label>
                    <Select value={walletId} onValueChange={setWalletId}>
                        <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue placeholder="Select wallet" /></SelectTrigger>
                        <SelectContent>
                            {wallets.map(w => <SelectItem key={w.id} value={w.id} className="text-xs">{w.name} ({fmt(w.balance, w.currency)})</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                {type === 'transfer' && (
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">To Wallet</label>
                        <Select value={transferTo} onValueChange={setTransferTo}>
                            <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue placeholder="Select wallet" /></SelectTrigger>
                            <SelectContent>
                                {wallets.filter(w => w.id !== walletId).map(w => <SelectItem key={w.id} value={w.id} className="text-xs">{w.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {type !== 'transfer' && (
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Category</label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
                            <SelectContent>
                                {filteredCats.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.icon} {c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Note</label>
                    <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note" className="rounded-xl text-xs h-9" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Date</label>
                    <Input value={date} onChange={e => setDate(e.target.value)} type="date" className="rounded-xl text-xs h-9" />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl font-semibold mt-2">
                    {saving ? 'Saving...' : 'Save Transaction'}
                </Button>
            </div>
        </Modal>
    )
}

function AddWalletModal({ onClose, onSave }: { onClose: () => void; onSave: (p: any) => Promise<void> }) {
    const [name, setName] = useState('')
    const [type, setType] = useState('cash')
    const [balance, setBalance] = useState('0')
    const [color, setColor] = useState(WALLET_COLORS[0])
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Enter wallet name'); return }
        setSaving(true)
        try {
            await onSave({ name: name.trim(), type, balance: parseFloat(balance) || 0, currency: 'IDR', color, icon: null, is_default: false, note: null })
        } finally { setSaving(false) }
    }

    return (
        <Modal title="Add Wallet" onClose={onClose}>
            <div className="space-y-3">
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Name</label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BCA Savings" className="rounded-xl text-xs h-9" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Type</label>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {WALLET_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Initial Balance (IDR)</label>
                    <Input value={balance} onChange={e => setBalance(e.target.value)} type="number" className="rounded-xl text-xs h-9" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Color</label>
                    <div className="flex gap-2 flex-wrap">
                        {WALLET_COLORS.map(c => (
                            <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`} style={{ background: c }} />
                        ))}
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl font-semibold mt-2">
                    {saving ? 'Creating...' : 'Create Wallet'}
                </Button>
            </div>
        </Modal>
    )
}

function AddGoalModal({ wallets, onClose, onSave }: { wallets: WalletType[]; onClose: () => void; onSave: (p: any) => Promise<void> }) {
    const [name, setName] = useState('')
    const [target, setTarget] = useState('')
    const [deadine, setDeadline] = useState('')
    const [color, setColor] = useState(WALLET_COLORS[2])
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Enter goal name'); return }
        const n = parseFloat(target)
        if (isNaN(n) || n <= 0) { toast.error('Enter valid target amount'); return }
        setSaving(true)
        try {
            await onSave({ name: name.trim(), target_amount: n, current_amount: 0, deadline: deadine || null, color, icon: '🎯', note: null, is_achieved: false, wallet_id: null })
        } finally { setSaving(false) }
    }

    return (
        <Modal title="New Saving Goal" onClose={onClose}>
            <div className="space-y-3">
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Goal Name</label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Vacation Fund" className="rounded-xl text-xs h-9" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Target Amount (IDR)</label>
                    <Input value={target} onChange={e => setTarget(e.target.value)} type="number" placeholder="5000000" className="rounded-xl text-xs h-9" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Deadline (optional)</label>
                    <Input value={deadine} onChange={e => setDeadline(e.target.value)} type="date" className="rounded-xl text-xs h-9" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Color</label>
                    <div className="flex gap-2 flex-wrap">
                        {WALLET_COLORS.map(c => (
                            <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`} style={{ background: c }} />
                        ))}
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl font-semibold mt-2">
                    {saving ? 'Creating...' : 'Create Goal'}
                </Button>
            </div>
        </Modal>
    )
}

function AddBudgetModal({ categories, onClose, onSave }: { categories: Category[]; onClose: () => void; onSave: () => void }) {
    const [categoryId, setCategoryId] = useState('')
    const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')
    const [amount, setAmount] = useState('')
    const [saving, setSaving] = useState(false)

    const getPeriodDates = () => {
        const now = new Date()
        if (period === 'monthly') {
            const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
            return { period_start: start, period_end: end }
        }
        if (period === 'weekly') {
            const day = now.getDay()
            const startDate = new Date(now); startDate.setDate(now.getDate() - day)
            const endDate = new Date(startDate); endDate.setDate(startDate.getDate() + 6)
            return { period_start: startDate.toISOString().split('T')[0], period_end: endDate.toISOString().split('T')[0] }
        }
        return { period_start: `${now.getFullYear()}-01-01`, period_end: `${now.getFullYear()}-12-31` }
    }

    const handleSave = async () => {
        if (!categoryId) { toast.error('Select a category'); return }
        const n = parseFloat(amount)
        if (isNaN(n) || n <= 0) { toast.error('Enter valid amount'); return }
        const { createBudget } = await import('@/lib/supabase/finance')
        setSaving(true)
        try {
            await createBudget({ category_id: categoryId, period, amount: n, ...getPeriodDates() })
            toast.success('Budget created')
            onSave()
        } catch (e: any) { toast.error(e.message) }
        finally { setSaving(false) }
    }

    return (
        <Modal title="New Budget" onClose={onClose}>
            <div className="space-y-3">
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Category</label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue placeholder="Expense category" /></SelectTrigger>
                        <SelectContent>
                            {categories.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.icon} {c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Period</label>
                    <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                        <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {(['weekly', 'monthly', 'yearly'] as const).map(p => <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Budget Amount (IDR)</label>
                    <Input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="1000000" className="rounded-xl text-xs h-9" />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl font-semibold mt-2">
                    {saving ? 'Creating...' : 'Create Budget'}
                </Button>
            </div>
        </Modal>
    )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon, label, action }: { icon: React.ReactNode; label: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
            <div className="opacity-40">{icon}</div>
            <p className="text-xs font-medium">{label}</p>
            {action}
        </div>
    )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FinanceSkeleton() {
    return (
        <div className="space-y-6 animate-pulse pb-10">
            <div className="flex justify-between items-center">
                <div className="h-8 w-32 bg-muted rounded-xl" />
                <div className="h-8 w-40 bg-muted rounded-xl" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-2xl" />)}
            </div>
            <div className="flex gap-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-28 w-52 bg-muted rounded-2xl flex-shrink-0" />)}
            </div>
            <div className="h-80 bg-muted rounded-2xl" />
        </div>
    )
}
