'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    BarChart3, Receipt, Target, PiggyBank, CreditCard,
} from 'lucide-react'
import {
    Tabs, TabsList, TabsTrigger, TabsContents, TabsContent,
} from '@/components/animate-ui/components/animate/tabs'
import { toast } from 'sonner'
import {
    TooltipProvider,
} from '@/components/ui/tooltip'
import {
    getWallets, getTransactions, getBudgets, getSavingGoals, getDebts, getCategories,
    createTransaction, createWallet, createSavingGoal, updateSavingGoal, deleteSavingGoal,
    deleteTransaction, deleteWallet, computeSummary, deleteDebt, updateTransaction,
    type Wallet as WalletType, type Transaction, type Budget, type SavingGoal,
    type Debt, type Category, type Contact,
} from '@/lib/supabase/finance'
import {
    AddTransactionDialog,
    AddWalletDialog,
    AddGoalDialog,
    AddDebtDialog,
    AddCategoryDialog,
    EditWalletDialog,
    EditContactDialog,
    RecordPaymentDialog,
    EditTransactionDialog,
    EditBudgetDialog,
} from '@/components/finance/dialogs'

// ── Extracted Components ─────────────────────────────────────────────────────
import { FinanceHeader } from './components/finance-header'
import { FinanceSkeleton } from './components/finance-skeleton'
import { SummaryCards } from './components/summary-cards'
import { WalletCard, EmptyWalletCard } from './components/wallet-card'
import { OverviewPanel } from './components/overview-panel'
import { TransactionsPanel } from './components/transactions-panel'
import { BudgetsPanel } from './components/budgets-panel'
import { GoalsPanel } from './components/goals-panel'
import { DebtsPanel } from './components/debts-panel'

// ─── Main Component ─────────────────────────────────────────────────────────

export default function FinanceClient() {
    // ── Data State ──
    const [wallets, setWallets] = useState<WalletType[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [goals, setGoals] = useState<SavingGoal[]>([])
    const [debts, setDebts] = useState<Debt[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    // ── Dialog State ──
    const [openTx, setOpenTx] = useState(false)
    const [openWallet, setOpenWallet] = useState(false)
    const [openGoal, setOpenGoal] = useState(false)
    const [openDebt, setOpenDebt] = useState(false)
    const [openCategory, setOpenCategory] = useState(false)
    const [payDebt, setPayDebt] = useState<Debt | null>(null)
    const [editContact, setEditContact] = useState<Contact | null>(null)
    const [editWallet, setEditWallet] = useState<WalletType | null>(null)
    const [editTx, setEditTx] = useState<Transaction | null>(null)
    const [editBudget, setEditBudget] = useState<Budget | null>(null)

    // ── Data Fetching ──
    const fetchAll = useCallback(async () => {
        try {
            const [w, tx, b, g, d, cats] = await Promise.all([
                getWallets(), getTransactions({ limit: 50 }), getBudgets(),
                getSavingGoals(), getDebts(), getCategories(),
            ])
            setWallets(w)
            setTransactions(tx)
            setBudgets(b)
            setGoals(g)
            setDebts(d)
            setCategories(cats)
        } catch {
            toast.error('Failed to load finance data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchAll() }, [fetchAll])

    const summary = computeSummary(wallets, transactions)

    if (loading) return <FinanceSkeleton />

    // ── Handlers ──
    const handleUpdateTx = async (id: string, payload: any) => {
        await updateTransaction(id, payload)
        toast.success('Transaction updated')
        setEditTx(null)
        fetchAll()
    }

    return (
        <TooltipProvider>
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">

                {/* Header */}
                <FinanceHeader
                    onAddWallet={() => setOpenWallet(true)}
                    onAddCategory={() => setOpenCategory(true)}
                    onAddTransaction={() => setOpenTx(true)}
                />

                {/* Summary Cards */}
                <SummaryCards summary={summary} />

                {/* Wallets Row */}
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

                {/* Tabs */}
                <Tabs defaultValue="overview">
                    <div className="overflow-x-auto no-scrollbar">
                        <TabsList className="w-fit min-w-full sm:min-w-0">
                            <TabsTrigger value="overview" className="text-xs gap-1.5 px-3 shrink-0"><BarChart3 className="size-3.5" /> Overview</TabsTrigger>
                            <TabsTrigger value="transactions" className="text-xs gap-1.5 px-3 shrink-0"><Receipt className="size-3.5" /> Transactions</TabsTrigger>
                            <TabsTrigger value="budgets" className="text-xs gap-1.5 px-3 shrink-0"><Target className="size-3.5" /> Budgets</TabsTrigger>
                            <TabsTrigger value="goals" className="text-xs gap-1.5 px-3 shrink-0"><PiggyBank className="size-3.5" /> Goals</TabsTrigger>
                            <TabsTrigger value="debts" className="text-xs gap-1.5 px-3 shrink-0"><CreditCard className="size-3.5" /> Debts</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContents className="mt-5">
                        <TabsContent value="overview">
                            <OverviewPanel
                                transactions={transactions}
                                budgets={budgets}
                                goals={goals}
                                debts={debts}
                                categories={categories}
                                onAddTx={() => setOpenTx(true)}
                                onAddGoal={() => setOpenGoal(true)}
                                onEditTx={setEditTx}
                            />
                        </TabsContent>

                        <TabsContent value="transactions">
                            <TransactionsPanel
                                transactions={transactions}
                                onDelete={async (id) => { await deleteTransaction(id); toast.success('Transaction deleted'); fetchAll() }}
                                onAdd={() => setOpenTx(true)}
                                onEditTx={setEditTx}
                            />
                        </TabsContent>

                        <TabsContent value="budgets">
                            <BudgetsPanel
                                budgets={budgets}
                                transactions={transactions}
                                categories={categories}
                                onRefresh={fetchAll}
                                onEditBudget={setEditBudget}
                            />
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
                            <DebtsPanel
                                debts={debts}
                                onRefresh={fetchAll}
                                onAdd={() => setOpenDebt(true)}
                                onPay={setPayDebt}
                                onEditContact={(d) => setEditContact(d.contact as any)}
                                onDelete={async (id) => { await deleteDebt(id); toast.success('Debt/Loan deleted'); fetchAll() }}
                            />
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
                    categories={categories}
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

                {editTx && (
                    <EditTransactionDialog
                        open={!!editTx}
                        onOpenChange={(o) => { if (!o) setEditTx(null) }}
                        transaction={editTx}
                        wallets={wallets}
                        categories={categories}
                        onSave={handleUpdateTx}
                    />
                )}

                {editBudget && (
                    <EditBudgetDialog
                        open={!!editBudget}
                        onOpenChange={(o) => { if (!o) setEditBudget(null) }}
                        budget={editBudget}
                        onSave={fetchAll}
                    />
                )}
            </div>
        </TooltipProvider>
    )
}
