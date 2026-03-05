'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Wallet, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownLeft,
    ArrowLeftRight, Target, CreditCard, PiggyBank,
    Trash2, CheckCircle2, Clock, AlertCircle, X,
    DollarSign, BarChart3, Banknote, Receipt, Filter, Pencil, BadgeDollarSign, Tags,
    LayoutGrid, LayoutList,
} from 'lucide-react'
import { DynamicIcon } from '@/lib/dynamic-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
    Tabs, TabsList, TabsTrigger, TabsContents, TabsContent,
} from '@/components/animate-ui/components/animate/tabs'
import { toast } from 'sonner'
import {
    getWallets, getTransactions, getBudgets, getSavingGoals, getDebts, getCategories,
    createTransaction, createWallet, createSavingGoal, updateSavingGoal, deleteSavingGoal,
    deleteTransaction, deleteWallet, computeSummary,
    type Wallet as WalletType, type Transaction, type Budget, type SavingGoal,
    type Debt, type Category, type TransactionType, type Contact,
} from '@/lib/supabase/finance'
import {
    AddTransactionDialog,
    AddWalletDialog,
    AddGoalDialog,
    AddBudgetDialog,
    AddDebtDialog,
    AddCategoryDialog,
    EditWalletDialog,
    EditContactDialog,
    RecordPaymentDialog,
} from '@/components/finance/dialogs'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number, currency = 'IDR') =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

// ─── Main component ────────────────────────────────────────────────────────────

export default function FinanceClient() {
    const [wallets, setWallets] = useState<WalletType[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [goals, setGoals] = useState<SavingGoal[]>([])
    const [debts, setDebts] = useState<Debt[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    // Dialogs
    const [openTx, setOpenTx] = useState(false)
    const [openWallet, setOpenWallet] = useState(false)
    const [openGoal, setOpenGoal] = useState(false)
    const [openDebt, setOpenDebt] = useState(false)
    const [openCategory, setOpenCategory] = useState(false)
    const [payDebt, setPayDebt] = useState<Debt | null>(null)
    const [editContact, setEditContact] = useState<Contact | null>(null)
    const [editWallet, setEditWallet] = useState<WalletType | null>(null)

    const fetchAll = useCallback(async () => {
        try {
            const [w, tx, b, g, d, cats] = await Promise.all([
                getWallets(), getTransactions({ limit: 50 }), getBudgets(),
                getSavingGoals(), getDebts(), getCategories(),
            ])
            setWallets(w); setTransactions(tx); setBudgets(b)
            setGoals(g); setDebts(d); setCategories(cats)
        } catch {
            toast.error('Failed to load finance data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchAll() }, [fetchAll])

    const summary = computeSummary(wallets, transactions)

    if (loading) return <FinanceSkeleton />

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Finance</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">Manage your money, budgets, and goals</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setOpenWallet(true)} variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs font-semibold">
                        <Wallet className="size-3.5" /> Add Wallet
                    </Button>
                    <Button onClick={() => setOpenCategory(true)} variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs font-semibold">
                        <Tags className="size-3.5" /> Category
                    </Button>
                    <Button onClick={() => setOpenTx(true)} size="sm" className="rounded-xl gap-1.5 text-xs font-semibold">
                        <Plus className="size-3.5" /> Transaction
                    </Button>
                </div>
            </div>

            {/* ── Summary Cards ───────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryCard label="Total Balance" value={fmt(summary.totalBalance)} icon={<DollarSign className="size-4" />} color="bg-primary/10 text-primary" trend={null} />
                <SummaryCard label="Month Income" value={fmt(summary.monthIncome)} icon={<TrendingUp className="size-4" />} color="bg-emerald-500/10 text-emerald-500" trend="positive" />
                <SummaryCard label="Month Expense" value={fmt(summary.monthExpense)} icon={<TrendingDown className="size-4" />} color="bg-rose-500/10 text-rose-500" trend="negative" />
                <SummaryCard
                    label="Net This Month" value={fmt(Math.abs(summary.monthNet))}
                    icon={<Banknote className="size-4" />}
                    color={summary.monthNet >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}
                    trend={summary.monthNet >= 0 ? 'positive' : 'negative'}
                />
            </div>

            {/* ── Wallets row ─────────────────────────────────────── */}
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                {wallets.length === 0
                    ? <EmptyWalletCard onClick={() => setOpenWallet(true)} />
                    : wallets.map(w => (
                        <WalletCard
                            key={w.id}
                            wallet={w}
                            onEdit={() => setEditWallet(w)}
                            onDelete={async () => {
                                await deleteWallet(w.id)
                                toast.success('Wallet deleted')
                                fetchAll()
                            }}
                        />
                    ))
                }
            </div>

            {/* ── Tabs ────────────────────────────────────────────── */}
            <Tabs defaultValue="overview">
                <TabsList className="w-fit">
                    <TabsTrigger value="overview" className="text-xs gap-1.5 px-3"><BarChart3 className="size-3.5" /> Overview</TabsTrigger>
                    <TabsTrigger value="transactions" className="text-xs gap-1.5 px-3"><Receipt className="size-3.5" /> Transactions</TabsTrigger>
                    <TabsTrigger value="budgets" className="text-xs gap-1.5 px-3"><Target className="size-3.5" /> Budgets</TabsTrigger>
                    <TabsTrigger value="goals" className="text-xs gap-1.5 px-3"><PiggyBank className="size-3.5" /> Goals</TabsTrigger>
                    <TabsTrigger value="debts" className="text-xs gap-1.5 px-3"><CreditCard className="size-3.5" /> Debts</TabsTrigger>
                </TabsList>

                <TabsContents className="mt-5">
                    <TabsContent value="overview">
                        <OverviewPanel
                            transactions={transactions} budgets={budgets} goals={goals} debts={debts}
                            onAddTx={() => setOpenTx(true)} onAddGoal={() => setOpenGoal(true)}
                        />
                    </TabsContent>

                    <TabsContent value="transactions">
                        <TransactionsPanel
                            transactions={transactions}
                            onDelete={async (id) => { await deleteTransaction(id); toast.success('Transaction deleted'); fetchAll() }}
                            onAdd={() => setOpenTx(true)}
                        />
                    </TabsContent>

                    <TabsContent value="budgets">
                        <BudgetsPanel budgets={budgets} transactions={transactions} categories={categories} onRefresh={fetchAll} />
                    </TabsContent>

                    <TabsContent value="goals">
                        <GoalsPanel
                            goals={goals}
                            onAdd={() => setOpenGoal(true)}
                            onUpdate={async (id, p) => { await updateSavingGoal(id, p); toast.success('Goal updated'); fetchAll() }}
                            onDelete={async (id) => { await deleteSavingGoal(id); toast.success('Goal deleted'); fetchAll() }}
                        />
                    </TabsContent>

                    <TabsContent value="debts">
                        <DebtsPanel debts={debts} onRefresh={fetchAll} onAdd={() => setOpenDebt(true)} onPay={setPayDebt} onEditContact={(d) => setEditContact(d.contact as any)} />
                    </TabsContent>
                </TabsContents>
            </Tabs>

            {/* ── Dialogs ─────────────────────────────────────────── */}
            <AddTransactionDialog
                open={openTx}
                onOpenChange={setOpenTx}
                wallets={wallets}
                categories={categories}
                onSave={async (payload) => {
                    await createTransaction(payload)
                    toast.success('Transaction added')
                    setOpenTx(false)
                    fetchAll()
                }}
            />

            <AddWalletDialog
                open={openWallet}
                onOpenChange={setOpenWallet}
                onSave={async (payload) => {
                    await createWallet(payload)
                    toast.success('Wallet created')
                    setOpenWallet(false)
                    fetchAll()
                }}
            />

            <AddGoalDialog
                open={openGoal}
                onOpenChange={setOpenGoal}
                onSave={async (payload) => {
                    await createSavingGoal(payload)
                    toast.success('Goal created')
                    setOpenGoal(false)
                    fetchAll()
                }}
            />

            {editWallet && (
                <EditWalletDialog
                    open={!!editWallet}
                    onOpenChange={(o) => { if (!o) setEditWallet(null) }}
                    wallet={editWallet}
                    onSave={() => fetchAll()}
                />
            )}

            <AddDebtDialog
                open={openDebt}
                onOpenChange={setOpenDebt}
                wallets={wallets}
                onSave={fetchAll}
            />

            <AddCategoryDialog
                open={openCategory}
                onOpenChange={setOpenCategory}
                onSave={fetchAll}
            />

            {payDebt && (
                <RecordPaymentDialog
                    open={!!payDebt}
                    onOpenChange={(o) => { if (!o) setPayDebt(null) }}
                    debt={{
                        id: payDebt.id,
                        contact_name: payDebt.contact?.name ?? 'Unknown',
                        remaining: payDebt.principal - payDebt.paid_amount,
                        direction: payDebt.direction,
                    }}
                    wallets={wallets}
                    onSave={() => { setPayDebt(null); fetchAll() }}
                />
            )}

            {editContact && (
                <EditContactDialog
                    open={!!editContact}
                    onOpenChange={(o) => { if (!o) setEditContact(null) }}
                    contact={editContact}
                    onSave={() => { setEditContact(null); fetchAll() }}
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

function WalletCard({ wallet, onEdit, onDelete }: {
    wallet: WalletType
    onEdit: () => void
    onDelete: () => void
}) {
    const bg = wallet.color ?? '#786BEE'
    const typeIcons: Record<string, string> = { bank: '🏦', cash: '💵', 'e-wallet': '📱', investment: '📈', other: '💳' }
    return (
        <div
            className="flex-shrink-0 w-52 rounded-2xl p-4 text-white shadow-sm flex flex-col gap-3 relative overflow-hidden group"
            style={{ background: `linear-gradient(135deg, ${bg}cc, ${bg})` }}
        >
            <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white" />
                <div className="absolute -right-2 top-8 w-16 h-16 rounded-full bg-white" />
            </div>
            <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-semibold opacity-80 capitalize">{wallet.type}{wallet.is_default ? ' ⭐' : ''}</span>
                {/* Action buttons — visible on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onEdit}
                        className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                        title="Edit wallet"
                    >
                        <Pencil className="size-3" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1 rounded-lg bg-white/20 hover:bg-red-400/60 transition-colors"
                        title="Delete wallet"
                    >
                        <Trash2 className="size-3" />
                    </button>
                </div>
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
                    <EmptyState icon={<Receipt className="size-8" />} label="No transactions yet"
                        action={<Button size="sm" onClick={onAddTx} className="rounded-xl text-xs mt-2">Add Transaction</Button>}
                    />
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

                {/* Goals snapshot */}
                <div className="bg-card rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><PiggyBank className="size-3.5" /></div>
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
                            {goals.slice(0, 3).map(g => <GoalMiniCard key={g.id} goal={g} />)}
                        </div>
                    )}
                </div>
            </div>

            {/* Budget overview — full width */}
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
    const bg: Record<TransactionType, string> = {
        income: 'bg-emerald-500/10', expense: 'bg-rose-500/10', transfer: 'bg-chart-1/10',
    }
    const amtColor: Record<TransactionType, string> = {
        income: 'text-emerald-500', expense: 'text-rose-500', transfer: 'text-chart-1',
    }
    const prefix = tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '↔'

    return (
        <div className="flex items-center gap-3 py-2 group">
            {/* Type icon */}
            <div className={`p-2 rounded-xl ${bg[tx.type]} flex-shrink-0`}>{icons[tx.type]}</div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                {/* Title: note > category name > type */}
                <p className="text-xs font-semibold truncate">{tx.note || tx.type}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {/* Category badge */}
                    {tx.category && (
                        <span
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                            style={{ background: (tx.category.color ?? '#786BEE') + '22', color: tx.category.color ?? '#786BEE' }}
                        >
                            <DynamicIcon name={tx.category.icon ?? ''} className="size-2.5" />
                            {tx.category.name}
                        </span>
                    )}
                    {/* Wallet + date */}
                    <span className="text-[10px] text-muted-foreground">{tx.wallet?.name} · {tx.date}</span>
                </div>
            </div>

            {/* Amount + delete */}
            <div className="flex items-center gap-2">
                <p className={`text-sm font-bold tabular-nums ${amtColor[tx.type]}`}>{prefix}{fmt(tx.amount, tx.wallet?.currency)}</p>
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

// ─── Transactions Panel ───────────────────────────────────────────────────────

function TransactionsPanel({ transactions, onDelete, onAdd }: {
    transactions: Transaction[]
    onDelete: (id: string) => void
    onAdd: () => void
}) {
    const [filter, setFilter] = useState<'all' | TransactionType>('all')
    const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)
    const filterLabel: Record<string, string> = { all: 'All', income: 'Income', expense: 'Expense', transfer: 'Transfer' }

    return (
        <div className="bg-card rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm">All Transactions</h3>
                <div className="flex items-center gap-2">
                    {/* Shadcn DropdownMenu filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7 text-xs rounded-xl gap-1.5">
                                <Filter className="size-3" /> {filterLabel[filter]}
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
                <EmptyState icon={<Receipt className="size-8" />} label="No transactions"
                    action={<Button size="sm" onClick={onAdd} className="rounded-xl text-xs mt-2">Add Transaction</Button>}
                />
            ) : (
                <div className="divide-y divide-border/50">
                    {filtered.map(tx => <TransactionRow key={tx.id} tx={tx} onDelete={onDelete} />)}
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
                    <div className="p-1.5 rounded-lg" style={{ background: `${color}20`, color }}>
                        <DynamicIcon name={budget.category?.icon} className="size-3.5" />
                    </div>
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
    const [openAdd, setOpenAdd] = useState(false)
    const expenseCats = categories.filter(c => c.type === 'expense')

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
                    <EmptyState icon={<Target className="size-8" />} label="No budgets set"
                        action={<Button size="sm" onClick={() => setOpenAdd(true)} className="rounded-xl text-xs mt-2">Create Budget</Button>}
                    />
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
            <AddBudgetDialog
                open={openAdd}
                onOpenChange={setOpenAdd}
                categories={expenseCats}
                onSave={() => { setOpenAdd(false); onRefresh() }}
            />
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
                    <EmptyState icon={<PiggyBank className="size-8" />} label="No saving goals"
                        action={<Button size="sm" onClick={onAdd} className="rounded-xl text-xs mt-2">Create Goal</Button>}
                    />
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
        setAmount(''); setAdding(false)
    }

    return (
        <div className="bg-card rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-primary" style={{ background: `${color}20` }}>
                        <DynamicIcon name={goal.icon ?? 'Target'} className="size-4" />
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
                    <p className="text-[11px] text-muted-foreground">
                        Still needs <span className="text-foreground font-semibold">{fmt(remaining)}</span>
                    </p>
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

function DebtsPanel({ debts, onRefresh, onAdd, onPay, onEditContact }: {
    debts: Debt[]
    onRefresh: () => void
    onAdd: () => void
    onPay: (d: Debt) => void
    onEditContact: (d: Debt) => void
}) {
    const [filter, setFilter] = useState<'all' | 'payable' | 'receivable'>('all')
    const [view, setView] = useState<'card' | 'list'>('card')
    const filtered = filter === 'all' ? debts : debts.filter(d => d.direction === filter)
    const filterLabel: Record<string, string> = { all: 'All', payable: 'I Owe', receivable: 'They Owe Me' }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Debts &amp; Loans</h3>
                <div className="flex items-center gap-1.5">
                    {/* View toggle */}
                    <div className="flex gap-0.5 bg-muted p-0.5 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setView('card')}
                            className={`p-1.5 rounded-md transition-all ${view === 'card' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                        >
                            <LayoutGrid className="size-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setView('list')}
                            className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                        >
                            <LayoutList className="size-3.5" />
                        </button>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs rounded-xl gap-1" onClick={onAdd}>
                        <Plus className="size-3" /> Add
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7 text-xs rounded-xl gap-1.5">
                                <Filter className="size-3" /> {filterLabel[filter]}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel>Filter</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={filter} onValueChange={(v) => setFilter(v as any)}>
                                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="payable">I Owe</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="receivable">They Owe Me</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            {filtered.length === 0 ? (
                <div className="bg-card rounded-2xl p-10 shadow-sm">
                    <EmptyState icon={<CreditCard className="size-8" />} label="No debts or loans" />
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        <button onClick={onAdd} className="text-primary font-medium hover:underline">Add your first debt or loan</button>
                    </p>
                </div>
            ) : view === 'card' ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {filtered.map(d => <DebtCard key={d.id} debt={d} onPay={() => onPay(d)} onEditContact={() => onEditContact(d)} />)}
                </div>
            ) : (
                <div className="bg-card rounded-2xl shadow-sm divide-y divide-border overflow-hidden">
                    {filtered.map(d => <DebtRow key={d.id} debt={d} onPay={() => onPay(d)} onEditContact={() => onEditContact(d)} />)}
                </div>
            )}
        </div>
    )
}

// ─── Debt Card (compact, 4-col) ────────────────────────────────────────────────

function DebtCard({ debt, onPay, onEditContact }: { debt: Debt; onPay: () => void; onEditContact: () => void }) {
    const remaining = debt.principal - debt.paid_amount
    const pct = Math.min((debt.paid_amount / debt.principal) * 100, 100)
    const isPayable = debt.direction === 'payable'
    const statusColors = {
        active: 'text-amber-500 bg-amber-500/10',
        settled: 'text-emerald-500 bg-emerald-500/10',
        cancelled: 'text-muted-foreground bg-muted',
    }
    const statusIcon = { active: <Clock className="size-2.5" />, settled: <CheckCircle2 className="size-2.5" />, cancelled: <X className="size-2.5" /> }

    return (
        <div className="bg-card rounded-2xl p-3.5 shadow-sm space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between gap-1">
                <button
                    onClick={onEditContact}
                    className="flex items-center gap-2 min-w-0 group"
                    title="Edit contact"
                >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        {debt.contact?.name?.charAt(0).toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold truncate leading-none">{debt.contact?.name ?? 'Unknown'}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{isPayable ? 'I owe' : 'Owes me'}</p>
                    </div>
                </button>
                <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusColors[debt.status]}`}>
                    {statusIcon[debt.status]}
                </span>
            </div>

            {/* Amount */}
            <div>
                <p className={`text-sm font-bold tabular-nums leading-none ${isPayable ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {fmt(remaining)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">of {fmt(debt.principal)}</p>
            </div>

            {/* Progress */}
            <div className="w-full bg-muted rounded-full h-1">
                <div className={`h-1 rounded-full ${isPayable ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
                {debt.due_date
                    ? <span className="text-[10px] text-muted-foreground">{debt.due_date}</span>
                    : <span />}
                {debt.status === 'active' && remaining > 0 && (
                    <button onClick={onPay} className="flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:underline">
                        <BadgeDollarSign className="size-2.5" /> Pay
                    </button>
                )}
            </div>
        </div>
    )
}

// ─── Debt Row (list view) ─────────────────────────────────────────────────────

function DebtRow({ debt, onPay, onEditContact }: { debt: Debt; onPay: () => void; onEditContact: () => void }) {
    const remaining = debt.principal - debt.paid_amount
    const pct = Math.min((debt.paid_amount / debt.principal) * 100, 100)
    const isPayable = debt.direction === 'payable'
    const statusColors = {
        active: 'text-amber-500',
        settled: 'text-emerald-500',
        cancelled: 'text-muted-foreground',
    }
    const statusIcon = {
        active: <Clock className="size-3" />,
        settled: <CheckCircle2 className="size-3" />,
        cancelled: <X className="size-3" />,
    }

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 group hover:bg-muted/40 transition-colors">
            {/* Avatar */}
            <button onClick={onEditContact} className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0 hover:bg-primary/20 transition-colors" title="Edit contact">
                {debt.contact?.name?.charAt(0).toUpperCase() ?? 'U'}
            </button>

            {/* Name + direction */}
            <div className="w-28 flex-shrink-0 min-w-0">
                <p className="text-xs font-semibold truncate">{debt.contact?.name ?? 'Unknown'}</p>
                <p className="text-[10px] text-muted-foreground">{isPayable ? 'I owe' : 'Owes me'}</p>
            </div>

            {/* Progress bar */}
            <div className="flex-1 min-w-0">
                <div className="w-full bg-muted rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${isPayable ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                </div>
            </div>

            {/* Remaining */}
            <p className={`text-xs font-bold tabular-nums w-28 text-right flex-shrink-0 ${isPayable ? 'text-rose-500' : 'text-emerald-500'}`}>
                {fmt(remaining)}
            </p>

            {/* Due */}
            <p className="text-[10px] text-muted-foreground w-20 text-right flex-shrink-0">
                {debt.due_date ?? '—'}
            </p>

            {/* Status */}
            <span className={`${statusColors[debt.status]} flex-shrink-0`}>{statusIcon[debt.status]}</span>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {debt.status === 'active' && remaining > 0 && (
                    <button onClick={onPay} className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5">
                        <BadgeDollarSign className="size-3" /> Pay
                    </button>
                )}
            </div>
        </div>
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
            <div className="h-10 w-96 bg-muted rounded-xl" />
            <div className="h-80 bg-muted rounded-2xl" />
        </div>
    )
}
