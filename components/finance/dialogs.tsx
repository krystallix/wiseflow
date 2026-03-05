'use client'

import { useState } from 'react'
import { Loader2Icon, Save, Plus, Wallet, Target, PiggyBank, Pencil, HandCoins, UserPlus, Tags, BadgeDollarSign, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, TrendingDown, TrendingUp, Banknote, Handshake } from 'lucide-react'
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
    type DebtDirection,
    type Contact,
    createBudget,
    updateWallet,
    createDebt,
    createContact,
    getContacts,
    createCategory,
    addDebtPayment,
    updateContact,
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
                transition={DIALOG_TRANSITION}
            >
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">New Transaction</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Record an income, expense, or transfer between wallets.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    {/* Type toggle — Lucide icon tabs */}
                    <div className="flex gap-1 bg-muted p-1 rounded-xl">
                        {([
                            { value: 'income', label: 'Income', icon: <ArrowDownLeft className="size-3.5" /> },
                            { value: 'expense', label: 'Expense', icon: <ArrowUpRight className="size-3.5" /> },
                            { value: 'transfer', label: 'Transfer', icon: <ArrowLeftRight className="size-3.5" /> },
                        ] as const).map(({ value, label, icon }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setType(value)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${type === value ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground/70'
                                    }`}
                            >
                                {icon}{label}
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
                            <SelectContent className="py-1.5 px-1">
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

// ─── Edit Wallet Dialog ───────────────────────────────────────────────────────

type EditWalletProps = {
    open: boolean
    onOpenChange: (o: boolean) => void
    wallet: WalletType
    onSave: (updated: WalletType) => void
}

export function EditWalletDialog({ open, onOpenChange, wallet, onSave }: EditWalletProps) {
    const [name, setName] = useState(wallet.name)
    const [type, setType] = useState(wallet.type)
    const [balance, setBalance] = useState(String(wallet.balance))
    const [color, setColor] = useState(wallet.color ?? WALLET_COLORS[0])
    const [isDefault, setIsDefault] = useState(wallet.is_default)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) { toast.error('Enter wallet name'); return }
        setLoading(true)
        try {
            const updated = await updateWallet(wallet.id, {
                name: name.trim(),
                type,
                balance: parseFloat(balance) || 0,
                color,
                is_default: isDefault,
            })
            toast.success('Wallet updated')
            onSave(updated)
            onOpenChange(false)
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md"
                transition={DIALOG_TRANSITION}
            >
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">Edit Wallet</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Update wallet name, type, balance, or color.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-wallet-name" className="text-xs font-medium">Wallet name</Label>
                        <Input
                            id="edit-wallet-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. BCA Savings"
                            autoFocus
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-wallet-type" className="text-xs font-medium">Type</Label>
                        <Select value={type} onValueChange={setType} disabled={loading}>
                            <SelectTrigger id="edit-wallet-type" className="text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {WALLET_TYPES.map(t => (
                                    <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-wallet-balance" className="text-xs font-medium">Balance (IDR)</Label>
                        <Input
                            id="edit-wallet-balance"
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

                    {/* Default toggle */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <div
                            onClick={() => setIsDefault(v => !v)}
                            className={`w-9 h-5 rounded-full transition-colors ${isDefault ? 'bg-primary' : 'bg-muted'} relative flex-shrink-0`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isDefault ? 'translate-x-4' : ''}`} />
                        </div>
                        <span className="text-xs font-medium">Set as default wallet</span>
                    </label>

                    <DialogFooter className="pt-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={!name.trim() || loading}>
                            {loading
                                ? <Loader2Icon className="size-3.5 animate-spin" />
                                : <Pencil className="size-3.5" />
                            }
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Add Debt / Loan Dialog ───────────────────────────────────────────────────

type AddDebtProps = {
    open: boolean
    onOpenChange: (o: boolean) => void
    wallets: WalletType[]
    onSave: () => void
}

export function AddDebtDialog({ open, onOpenChange, wallets, onSave }: AddDebtProps) {
    const [contactMode, setContactMode] = useState<'existing' | 'new'>('existing')
    const [contacts, setContacts] = useState<Contact[]>([])
    const [contactsLoaded, setContactsLoaded] = useState(false)
    const [contactId, setContactId] = useState('')
    const [newName, setNewName] = useState('')
    const [newPhone, setNewPhone] = useState('')
    const [direction, setDirection] = useState<DebtDirection>('payable')
    const [principal, setPrincipal] = useState('')
    const [walletId, setWalletId] = useState(wallets.find(w => w.is_default)?.id ?? wallets[0]?.id ?? '__none__')
    const [dueDate, setDueDate] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)

    const loadContacts = async () => {
        if (contactsLoaded) return
        try {
            const data = await getContacts()
            setContacts(data)
            setContactsLoaded(true)
        } catch { /* ignore */ }
    }

    const handleOpen = (o: boolean) => {
        onOpenChange(o)
        if (o) loadContacts()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const n = parseFloat(principal)
        if (isNaN(n) || n <= 0) { toast.error('Enter valid amount'); return }
        setLoading(true)
        try {
            let resolvedContactId = contactId
            if (contactMode === 'new') {
                if (!newName.trim()) { toast.error('Enter contact name'); return }
                const created = await createContact({
                    name: newName.trim(),
                    phone: newPhone.trim() || null,
                    email: null, note: null, avatar_url: null,
                })
                resolvedContactId = created.id
                setContacts(prev => [...prev, created])
                setContactsLoaded(true)
            } else {
                if (!resolvedContactId) { toast.error('Select a contact'); return }
            }

            await createDebt({
                contact_id: resolvedContactId,
                wallet_id: walletId === '__none__' ? null : (walletId || null),
                direction,
                principal: n,
                due_date: dueDate || null,
                description: description.trim() || null,
            })

            toast.success(direction === 'payable' ? 'Debt recorded' : 'Loan recorded')
            setContactId(''); setNewName(''); setNewPhone('')
            setPrincipal(''); setDueDate(''); setDescription('')
            setContactMode('existing')
            onSave()
            onOpenChange(false)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogContent className="sm:max-w-md" transition={DIALOG_TRANSITION}>
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">Add Debt / Loan</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Record money you owe or are owed by someone.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    {/* Direction toggle — Lucide icon tabs */}
                    <div className="flex gap-1 bg-muted p-1 rounded-xl">
                        {([
                            { value: 'payable', label: 'I Owe', icon: <Banknote className="size-3.5" /> },
                            { value: 'receivable', label: 'They Owe Me', icon: <Handshake className="size-3.5" /> },
                        ] as const).map(({ value, label, icon }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setDirection(value)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${direction === value ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground/70'
                                    }`}
                            >
                                {icon}{label}
                            </button>
                        ))}
                    </div>

                    {/* Contact */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Contact</Label>
                            <button
                                type="button"
                                onClick={() => setContactMode(m => m === 'existing' ? 'new' : 'existing')}
                                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                            >
                                {contactMode === 'existing'
                                    ? <><UserPlus className="size-3" /> New contact</>
                                    : <><HandCoins className="size-3" /> Pick existing</>
                                }
                            </button>
                        </div>

                        {contactMode === 'existing' ? (
                            <Select value={contactId} onValueChange={setContactId} disabled={loading}>
                                <SelectTrigger className="text-xs w-full">
                                    <SelectValue placeholder="Select contact" />
                                </SelectTrigger>
                                <SelectContent>
                                    {contacts.length === 0
                                        ? <SelectItem value="_none" disabled className="text-xs text-muted-foreground italic">No contacts yet — create one →</SelectItem>
                                        : contacts.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="text-xs">
                                                {c.name}{c.phone ? ` · ${c.phone}` : ''}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="space-y-2">
                                <Input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Contact name *"
                                    autoComplete="off"
                                    disabled={loading}
                                />
                                <Input
                                    value={newPhone}
                                    onChange={e => setNewPhone(e.target.value)}
                                    placeholder="Phone (optional)"
                                    autoComplete="off"
                                    disabled={loading}
                                />
                            </div>
                        )}
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                        <Label htmlFor="debt-amount" className="text-xs font-medium">Amount (IDR)</Label>
                        <Input
                            id="debt-amount"
                            value={principal}
                            onChange={e => setPrincipal(e.target.value)}
                            type="number"
                            placeholder="0"
                            className="text-lg font-bold"
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    {/* Wallet */}
                    {wallets.length > 0 && (
                        <div className="space-y-1.5">
                            <Label htmlFor="debt-wallet" className="text-xs font-medium">
                                {direction === 'payable' ? 'Pay from wallet (optional)' : 'Receive to wallet (optional)'}
                            </Label>
                            <Select value={walletId} onValueChange={setWalletId} disabled={loading}>
                                <SelectTrigger id="debt-wallet" className="text-xs w-full">
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__" className="text-xs text-muted-foreground">None</SelectItem>
                                    {wallets.map(w => (
                                        <SelectItem key={w.id} value={w.id} className="text-xs">{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Due date */}
                    <div className="space-y-1.5">
                        <Label htmlFor="debt-due" className="text-xs font-medium">Due date (optional)</Label>
                        <Input
                            id="debt-due"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            type="date"
                            disabled={loading}
                        />
                    </div>

                    {/* Note */}
                    <div className="space-y-1.5">
                        <Label htmlFor="debt-note" className="text-xs font-medium">Note (optional)</Label>
                        <Input
                            id="debt-note"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="e.g. Borrowed for rent"
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    <DialogFooter className="pt-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={!principal || loading}>
                            {loading
                                ? <Loader2Icon className="size-3.5 animate-spin" />
                                : <HandCoins className="size-3.5" />
                            }
                            {direction === 'payable' ? 'Record Debt' : 'Record Loan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Add Category Dialog ──────────────────────────────────────────────────────

const CATEGORY_COLORS = [
    '#786BEE', '#E2A9F3', '#94C3F6', '#34D399',
    '#F59E0B', '#F87171', '#60A5FA', '#FB923C',
]
const CATEGORY_ICONS = [
    'ShoppingCart', 'Utensils', 'Car', 'Home', 'Zap',
    'Wifi', 'Heart', 'GraduationCap', 'Plane', 'Gift',
    'Coffee', 'Music', 'Dumbbell', 'Dog', 'Briefcase',
    'TrendingUp', 'DollarSign', 'Shirt', 'Baby', 'Monitor',
]

type AddCategoryProps = {
    open: boolean
    onOpenChange: (o: boolean) => void
    onSave: () => void
}

export function AddCategoryDialog({ open, onOpenChange, onSave }: AddCategoryProps) {
    const [name, setName] = useState('')
    const [type, setType] = useState<'income' | 'expense'>('expense')
    const [icon, setIcon] = useState(CATEGORY_ICONS[0])
    const [color, setColor] = useState(CATEGORY_COLORS[0])
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) { toast.error('Enter category name'); return }
        setLoading(true)
        try {
            await createCategory({ name: name.trim(), type, icon, color })
            toast.success('Category created')
            setName(''); setIcon(CATEGORY_ICONS[0]); setColor(CATEGORY_COLORS[0])
            onSave()
            onOpenChange(false)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" transition={DIALOG_TRANSITION}>
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">New Category</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Add a custom category for income or expense transactions.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    {/* Type toggle — Lucide icon tabs */}
                    <div className="flex gap-1 bg-muted p-1 rounded-xl">
                        {([
                            { value: 'expense', label: 'Expense', icon: <TrendingDown className="size-3.5" /> },
                            { value: 'income', label: 'Income', icon: <TrendingUp className="size-3.5" /> },
                        ] as const).map(({ value, label, icon }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setType(value)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${type === value ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground/70'
                                    }`}
                            >
                                {icon}{label}
                            </button>
                        ))}
                    </div>

                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="cat-name" className="text-xs font-medium">Category name</Label>
                        <Input
                            id="cat-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Groceries"
                            autoFocus
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    {/* Icon picker */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Icon</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {CATEGORY_ICONS.map(i => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setIcon(i)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-foreground ${icon === i ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted hover:bg-muted/80'}`}
                                >
                                    <DynamicIcon name={i} className="size-3.5" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color picker */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Color</Label>
                        <div className="flex gap-2 flex-wrap">
                            {CATEGORY_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-7 h-7 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                                    style={{ background: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '33' }}>
                            <span style={{ color }}><DynamicIcon name={icon} className="size-3.5" /></span>
                        </div>
                        <span className="text-xs font-semibold">{name || 'Preview'}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto capitalize">{type}</span>
                    </div>

                    <DialogFooter className="pt-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={!name.trim() || loading}>
                            {loading
                                ? <Loader2Icon className="size-3.5 animate-spin" />
                                : <Tags className="size-3.5" />
                            }
                            Create Category
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Record Debt Payment Dialog ───────────────────────────────────────────────

type RecordPaymentProps = {
    open: boolean
    onOpenChange: (o: boolean) => void
    debt: { id: string; contact_name: string; remaining: number; direction: string }
    wallets: WalletType[]
    onSave: () => void
}

export function RecordPaymentDialog({ open, onOpenChange, debt, wallets, onSave }: RecordPaymentProps) {
    const [amount, setAmount] = useState('')
    const [walletId, setWalletId] = useState(wallets.find(w => w.is_default)?.id ?? wallets[0]?.id ?? '__none__')
    const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0])
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const n = parseFloat(amount)
        if (isNaN(n) || n <= 0) { toast.error('Enter valid amount'); return }
        if (n > debt.remaining) { toast.error(`Max payable is ${debt.remaining.toLocaleString('id-ID')}`); return }
        setLoading(true)
        try {
            await addDebtPayment({
                debt_id: debt.id,
                wallet_id: walletId === '__none__' ? null : walletId,
                amount: n,
                paid_at: paidAt,
                note: note.trim() || null,
            })
            toast.success('Payment recorded')
            setAmount(''); setNote('')
            onSave()
            onOpenChange(false)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm" transition={DIALOG_TRANSITION}>
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">Record Payment</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        {debt.direction === 'payable' ? 'Record payment to' : 'Record receipt from'}{' '}
                        <span className="font-semibold text-foreground">{debt.contact_name}</span>
                        {' '}· Remaining:{' '}
                        <span className="font-semibold text-foreground">
                            {debt.remaining.toLocaleString('id-ID')}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <Label htmlFor="pay-amount" className="text-xs font-medium">Amount (IDR)</Label>
                        <Input
                            id="pay-amount"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            type="number"
                            placeholder="0"
                            className="text-lg font-bold"
                            autoFocus
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    {wallets.length > 0 && (
                        <div className="space-y-1.5">
                            <Label htmlFor="pay-wallet" className="text-xs font-medium">
                                {debt.direction === 'payable' ? 'Pay from wallet' : 'Receive to wallet'} (optional)
                            </Label>
                            <Select value={walletId} onValueChange={setWalletId} disabled={loading}>
                                <SelectTrigger id="pay-wallet" className="text-xs w-full">
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__" className="text-xs text-muted-foreground">None</SelectItem>
                                    {wallets.map(w => (
                                        <SelectItem key={w.id} value={w.id} className="text-xs">{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="pay-date" className="text-xs font-medium">Date</Label>
                        <Input
                            id="pay-date"
                            value={paidAt}
                            onChange={e => setPaidAt(e.target.value)}
                            type="date"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="pay-note" className="text-xs font-medium">Note (optional)</Label>
                        <Input
                            id="pay-note"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="e.g. Partial payment"
                            autoComplete="off"
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
                                : <BadgeDollarSign className="size-3.5" />
                            }
                            Record Payment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Edit Contact Dialog ───────────────────────────────────────────────────────

type EditContactProps = {
    open: boolean
    onOpenChange: (o: boolean) => void
    contact: Contact
    onSave: () => void
}

export function EditContactDialog({ open, onOpenChange, contact, onSave }: EditContactProps) {
    const [name, setName] = useState(contact.name)
    const [phone, setPhone] = useState(contact.phone ?? '')
    const [email, setEmail] = useState(contact.email ?? '')
    const [note, setNote] = useState(contact.note ?? '')
    const [loading, setLoading] = useState(false)

    // Sync fields when contact changes
    const prevId = contact.id
    if (name === contact.name && prevId !== contact.id) {
        setName(contact.name)
        setPhone(contact.phone ?? '')
        setEmail(contact.email ?? '')
        setNote(contact.note ?? '')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) { toast.error('Enter contact name'); return }
        setLoading(true)
        try {
            await updateContact(contact.id, {
                name: name.trim(),
                phone: phone.trim() || null,
                email: email.trim() || null,
                note: note.trim() || null,
            })
            toast.success('Contact updated')
            onSave()
            onOpenChange(false)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm" transition={DIALOG_TRANSITION}>
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">Edit Contact</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Update contact details.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <Label htmlFor="ec-name" className="text-xs font-medium">Name *</Label>
                        <Input
                            id="ec-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Contact name"
                            autoFocus
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="ec-phone" className="text-xs font-medium">Phone</Label>
                        <Input
                            id="ec-phone"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="+62 ..."
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="ec-email" className="text-xs font-medium">Email</Label>
                        <Input
                            id="ec-email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            type="email"
                            placeholder="email@example.com"
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="ec-note" className="text-xs font-medium">Note</Label>
                        <Input
                            id="ec-note"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="e.g. Schoolmate"
                            autoComplete="off"
                            disabled={loading}
                        />
                    </div>

                    <DialogFooter className="pt-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={!name.trim() || loading}>
                            {loading
                                ? <Loader2Icon className="size-3.5 animate-spin" />
                                : <Pencil className="size-3.5" />
                            }
                            Save Contact
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
