'use client'

import { useState } from 'react'
import { Loader2Icon, Save, Plus, Wallet, Target, PiggyBank } from 'lucide-react'
import { toast } from 'sonner'
import { DynamicIcon } from '@/lib/dynamic-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/animate-ui/components/radix/dialog'
import {
    type Wallet as WalletType,
    type Category,
    type TransactionType,
    createBudget,
} from '@/lib/supabase/finance'

// ─── Shared ───────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split('T')[0]

export const WALLET_TYPES = ['cash', 'bank', 'e-wallet', 'investment', 'other']
export const WALLET_COLORS = [
    '#786BEE', '#E2A9F3', '#94C3F6', '#34D399',
    '#F59E0B', '#F87171', '#60A5FA', '#A78BFA',
]

const DIALOG_TRANSITION = { type: 'spring', stiffness: 1000, damping: 50 } as const

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
    return (
        <div className="flex gap-2 flex-wrap">
            {WALLET_COLORS.map(c => (
                <button
                    key={c}
                    type="button"
                    onClick={() => onChange(c)}
                    className={`w-7 h-7 rounded-lg transition-all ${value === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                    style={{ background: c }}
                />
            ))}
        </div>
    )
}

// ─── Add Transaction Dialog ────────────────────────────────────────────────────

type AddTransactionProps = {
    open: boolean
    onOpenChange: (o: boolean) => void
    wallets: WalletType[]
    categories: Category[]
    onSave: (payload: any) => Promise<void>
}

export function AddTransactionDialog({ open, onOpenChange, wallets, categories, onSave }: AddTransactionProps) {
    const [type, setType] = useState<TransactionType>('expense')
    const [walletId, setWalletId] = useState(wallets.find(w => w.is_default)?.id ?? wallets[0]?.id ?? '')
    const [categoryId, setCategoryId] = useState('')
    const [amount, setAmount] = useState('')
    const [note, setNote] = useState('')
    const [date, setDate] = useState(today())
    const [transferTo, setTransferTo] = useState('')
    const [loading, setLoading] = useState(false)

    const filteredCats = categories.filter(c => c.type === type || type === 'transfer')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const n = parseFloat(amount)
        if (!walletId) { toast.error('Select a wallet'); return }
        if (isNaN(n) || n <= 0) { toast.error('Enter valid amount'); return }
        if (type === 'transfer' && !transferTo) { toast.error('Select destination wallet'); return }
        setLoading(true)
        try {
            await onSave({
                wallet_id: walletId,
                category_id: categoryId || null,
                type, amount: n,
                note: note || null, date,
                transfer_to_wallet_id: type === 'transfer' ? transferTo : null,
                debt_id: null,
            })
            setAmount(''); setNote(''); setCategoryId(''); setTransferTo('')
        } finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md"
                from="bottom"
                transition={DIALOG_TRANSITION}
            >
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">New Transaction</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Record an income, expense, or transfer between wallets.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    {/* Type toggle */}
                    <div className="flex gap-1 bg-muted p-1 rounded-xl">
                        {(['income', 'expense', 'transfer'] as const).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${type === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="tx-amount" className="text-xs font-medium">Amount (IDR)</Label>
                        <Input
                            id="tx-amount"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0"
                            type="number"
                            className="text-lg font-bold"
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="tx-wallet" className="text-xs font-medium">
                            {type === 'transfer' ? 'From Wallet' : 'Wallet'}
                        </Label>
                        <Select value={walletId} onValueChange={setWalletId} disabled={loading}>
                            <SelectTrigger id="tx-wallet" className="text-xs"><SelectValue placeholder="Select wallet" /></SelectTrigger>
                            <SelectContent>
                                {wallets.map(w => (
                                    <SelectItem key={w.id} value={w.id} className="text-xs">{w.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {type === 'transfer' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="tx-wallet-to" className="text-xs font-medium">To Wallet</Label>
                            <Select value={transferTo} onValueChange={setTransferTo} disabled={loading}>
                                <SelectTrigger id="tx-wallet-to" className="text-xs"><SelectValue placeholder="Select wallet" /></SelectTrigger>
                                <SelectContent>
                                    {wallets.filter(w => w.id !== walletId).map(w => (
                                        <SelectItem key={w.id} value={w.id} className="text-xs">{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {type !== 'transfer' && filteredCats.length > 0 && (
                        <div className="space-y-1.5">
                            <Label htmlFor="tx-category" className="text-xs font-medium">Category</Label>
                            <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
                                <SelectTrigger id="tx-category" className="text-xs"><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    {filteredCats.map(c => (
                                        <SelectItem key={c.id} value={c.id} className="text-xs">
                                            <span className="flex items-center gap-1.5">
                                                <DynamicIcon name={c.icon} className="size-3" />
                                                {c.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="tx-note" className="text-xs font-medium">Note (optional)</Label>
                        <Input
                            id="tx-note"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="e.g. Lunch at warung"
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="tx-date" className="text-xs font-medium">Date</Label>
                        <Input
                            id="tx-date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            type="date"
                            disabled={loading}
                        />
                    </div>

                    <DialogFooter className="pt-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={!amount || loading}>
                            {loading
                                ? <Loader2Icon className="size-3.5 animate-spin" />
                                : <Plus className="size-3.5" />
                            }
                            Save Transaction
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Add Wallet Dialog ────────────────────────────────────────────────────────

type AddWalletProps = {
    open: boolean
    onOpenChange: (o: boolean) => void
    onSave: (payload: any) => Promise<void>
}

export function AddWalletDialog({ open, onOpenChange, onSave }: AddWalletProps) {
    const [name, setName] = useState('')
    const [type, setType] = useState('cash')
    const [balance, setBalance] = useState('0')
    const [color, setColor] = useState(WALLET_COLORS[0])
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) { toast.error('Enter wallet name'); return }
        setLoading(true)
        try {
            await onSave({ name: name.trim(), type, balance: parseFloat(balance) || 0, currency: 'IDR', color, icon: null, is_default: false, note: null })
            setName(''); setBalance('0')
        } finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md"
                from="bottom"
                transition={DIALOG_TRANSITION}
            >
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">Add Wallet</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Add a new wallet to track your money.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <Label htmlFor="wallet-name" className="text-xs font-medium">Wallet name</Label>
                        <Input
                            id="wallet-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. BCA Savings"
                            autoFocus
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="wallet-type" className="text-xs font-medium">Type</Label>
                        <Select value={type} onValueChange={setType} disabled={loading}>
                            <SelectTrigger id="wallet-type" className="text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {WALLET_TYPES.map(t => (
                                    <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="wallet-balance" className="text-xs font-medium">Initial Balance (IDR)</Label>
                        <Input
                            id="wallet-balance"
                            value={balance}
                            onChange={e => setBalance(e.target.value)}
                            type="number"
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Color</Label>
                        <ColorPicker value={color} onChange={setColor} />
                    </div>

                    <DialogFooter className="pt-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={!name.trim() || loading}>
                            {loading
                                ? <Loader2Icon className="size-3.5 animate-spin" />
                                : <Wallet className="size-3.5" />
                            }
                            Create Wallet
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Add Goal Dialog ──────────────────────────────────────────────────────────

type AddGoalProps = {
    open: boolean
    onOpenChange: (o: boolean) => void
    onSave: (payload: any) => Promise<void>
}

export function AddGoalDialog({ open, onOpenChange, onSave }: AddGoalProps) {
    const [name, setName] = useState('')
    const [target, setTarget] = useState('')
    const [deadline, setDeadline] = useState('')
    const [color, setColor] = useState(WALLET_COLORS[2])
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) { toast.error('Enter goal name'); return }
        const n = parseFloat(target)
        if (isNaN(n) || n <= 0) { toast.error('Enter valid target amount'); return }
        setLoading(true)
        try {
            await onSave({
                name: name.trim(), target_amount: n, current_amount: 0,
                deadline: deadline || null, color, icon: 'Target',
                note: null, is_achieved: false, wallet_id: null,
            })
            setName(''); setTarget(''); setDeadline('')
        } finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md"
                from="bottom"
                transition={DIALOG_TRANSITION}
            >
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">New Saving Goal</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Set a savings target and track your progress.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <Label htmlFor="goal-name" className="text-xs font-medium">Goal name</Label>
                        <Input
                            id="goal-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Vacation Fund"
                            autoFocus
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="goal-target" className="text-xs font-medium">Target amount (IDR)</Label>
                        <Input
                            id="goal-target"
                            value={target}
                            onChange={e => setTarget(e.target.value)}
                            type="number"
                            placeholder="5000000"
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="goal-deadline" className="text-xs font-medium">Deadline (optional)</Label>
                        <Input
                            id="goal-deadline"
                            value={deadline}
                            onChange={e => setDeadline(e.target.value)}
                            type="date"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Color</Label>
                        <ColorPicker value={color} onChange={setColor} />
                    </div>

                    <DialogFooter className="pt-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={!name.trim() || !target || loading}>
                            {loading
                                ? <Loader2Icon className="size-3.5 animate-spin" />
                                : <PiggyBank className="size-3.5" />
                            }
                            Create Goal
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Add Budget Dialog ────────────────────────────────────────────────────────

type AddBudgetProps = {
    open: boolean
    onOpenChange: (o: boolean) => void
    categories: Category[]
    onSave: () => void
}

function getPeriodDates(period: 'weekly' | 'monthly' | 'yearly') {
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

export function AddBudgetDialog({ open, onOpenChange, categories, onSave }: AddBudgetProps) {
    const [categoryId, setCategoryId] = useState('')
    const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!categoryId) { toast.error('Select a category'); return }
        const n = parseFloat(amount)
        if (isNaN(n) || n <= 0) { toast.error('Enter valid amount'); return }
        setLoading(true)
        try {
            await createBudget({ category_id: categoryId, period, amount: n, ...getPeriodDates(period) })
            toast.success('Budget created')
            setCategoryId(''); setAmount('')
            onSave()
        } catch (e: any) { toast.error(e.message) }
        finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md"
                from="bottom"
                transition={DIALOG_TRANSITION}
            >
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">New Budget</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Set a spending limit for a category and period.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <Label htmlFor="budget-category" className="text-xs font-medium">Category</Label>
                        <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
                            <SelectTrigger id="budget-category" className="text-xs"><SelectValue placeholder="Select expense category" /></SelectTrigger>
                            <SelectContent>
                                {categories.map(c => (
                                    <SelectItem key={c.id} value={c.id} className="text-xs">
                                        <span className="flex items-center gap-1.5">
                                            <DynamicIcon name={c.icon} className="size-3" />
                                            {c.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="budget-period" className="text-xs font-medium">Period</Label>
                        <Select value={period} onValueChange={(v: any) => setPeriod(v)} disabled={loading}>
                            <SelectTrigger id="budget-period" className="text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {(['weekly', 'monthly', 'yearly'] as const).map(p => (
                                    <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="budget-amount" className="text-xs font-medium">Budget amount (IDR)</Label>
                        <Input
                            id="budget-amount"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            type="number"
                            placeholder="1000000"
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    <DialogFooter className="pt-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={!categoryId || !amount || loading}>
                            {loading
                                ? <Loader2Icon className="size-3.5 animate-spin" />
                                : <Target className="size-3.5" />
                            }
                            Create Budget
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
