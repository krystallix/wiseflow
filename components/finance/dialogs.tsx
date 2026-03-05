'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { DynamicIcon } from '@/lib/dynamic-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/animate-ui/primitives/radix/dialog'
import { XIcon } from 'lucide-react'
import {
    type Wallet,
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

function FormLabel({ children }: { children: React.ReactNode }) {
    return <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{children}</label>
}

/**
 * Shared dialog shell that correctly layers:
 *   DialogPortal (AnimatePresence) > DialogOverlay (blur fade) > DialogContent (3D spring flip)
 * — matches the animate-ui primitive animation spec exactly.
 */
function FinanceDialogShell({
    open, onOpenChange, title, children,
}: {
    open: boolean
    onOpenChange: (o: boolean) => void
    title: string
    children: React.ReactNode
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogOverlay className="fixed inset-0 z-50 bg-black/50" />
                <DialogContent
                    from="top"
                    className="bg-background fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-2xl border p-6 shadow-xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-bold text-base">{title}</h2>
                        <DialogClose className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <XIcon className="size-4" />
                            <span className="sr-only">Close</span>
                        </DialogClose>
                    </div>
                    {children}
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}


// ─── Add Transaction Dialog ────────────────────────────────────────────────────

type AddTransactionProps = {
    open: boolean
    onOpenChange: (o: boolean) => void
    wallets: Wallet[]
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
            // reset
            setAmount(''); setNote(''); setCategoryId(''); setTransferTo('')
        } finally {
            setSaving(false)
        }
    }

    return (
        <FinanceDialogShell open={open} onOpenChange={onOpenChange} title="New Transaction">
            {/* Type toggle */}
            <div className="flex gap-1 bg-muted p-1 rounded-xl mb-4">
                {(['income', 'expense', 'transfer'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${type === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                <div>
                    <FormLabel>Amount</FormLabel>
                    <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" type="number" className="text-2xl font-bold h-12 rounded-xl" />
                </div>
                <div>
                    <FormLabel>From Wallet</FormLabel>
                    <Select value={walletId} onValueChange={setWalletId}>
                        <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue placeholder="Select wallet" /></SelectTrigger>
                        <SelectContent>
                            {wallets.map(w => (
                                <SelectItem key={w.id} value={w.id} className="text-xs">{w.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {type === 'transfer' && (
                    <div>
                        <FormLabel>To Wallet</FormLabel>
                        <Select value={transferTo} onValueChange={setTransferTo}>
                            <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue placeholder="Select wallet" /></SelectTrigger>
                            <SelectContent>
                                {wallets.filter(w => w.id !== walletId).map(w => (
                                    <SelectItem key={w.id} value={w.id} className="text-xs">{w.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {type !== 'transfer' && filteredCats.length > 0 && (
                    <div>
                        <FormLabel>Category</FormLabel>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
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
                <div>
                    <FormLabel>Note</FormLabel>
                    <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note" className="rounded-xl text-xs h-9" />
                </div>
                <div>
                    <FormLabel>Date</FormLabel>
                    <Input value={date} onChange={e => setDate(e.target.value)} type="date" className="rounded-xl text-xs h-9" />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl font-semibold mt-1">
                    {saving ? 'Saving…' : 'Save Transaction'}
                </Button>
            </div>
        </FinanceDialogShell>
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
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Enter wallet name'); return }
        setSaving(true)
        try {
            await onSave({ name: name.trim(), type, balance: parseFloat(balance) || 0, currency: 'IDR', color, icon: null, is_default: false, note: null })
            setName(''); setBalance('0')
        } finally { setSaving(false) }
    }

    return (
        <FinanceDialogShell open={open} onOpenChange={onOpenChange} title="Add Wallet">
            <div className="space-y-3">
                <div>
                    <FormLabel>Name</FormLabel>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BCA Savings" className="rounded-xl text-xs h-9" />
                </div>
                <div>
                    <FormLabel>Type</FormLabel>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {WALLET_TYPES.map(t => (
                                <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <FormLabel>Initial Balance (IDR)</FormLabel>
                    <Input value={balance} onChange={e => setBalance(e.target.value)} type="number" className="rounded-xl text-xs h-9" />
                </div>
                <div>
                    <FormLabel>Color</FormLabel>
                    <ColorPicker value={color} onChange={setColor} />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl font-semibold mt-1">
                    {saving ? 'Creating…' : 'Create Wallet'}
                </Button>
            </div>
        </FinanceDialogShell>
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
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Enter goal name'); return }
        const n = parseFloat(target)
        if (isNaN(n) || n <= 0) { toast.error('Enter valid target amount'); return }
        setSaving(true)
        try {
            await onSave({
                name: name.trim(), target_amount: n, current_amount: 0,
                deadline: deadline || null, color, icon: 'Target',
                note: null, is_achieved: false, wallet_id: null,
            })
            setName(''); setTarget(''); setDeadline('')
        } finally { setSaving(false) }
    }

    return (
        <FinanceDialogShell open={open} onOpenChange={onOpenChange} title="New Saving Goal">
            <div className="space-y-3">
                <div>
                    <FormLabel>Goal Name</FormLabel>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Vacation Fund" className="rounded-xl text-xs h-9" />
                </div>
                <div>
                    <FormLabel>Target Amount (IDR)</FormLabel>
                    <Input value={target} onChange={e => setTarget(e.target.value)} type="number" placeholder="5000000" className="rounded-xl text-xs h-9" />
                </div>
                <div>
                    <FormLabel>Deadline (optional)</FormLabel>
                    <Input value={deadline} onChange={e => setDeadline(e.target.value)} type="date" className="rounded-xl text-xs h-9" />
                </div>
                <div>
                    <FormLabel>Color</FormLabel>
                    <ColorPicker value={color} onChange={setColor} />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl font-semibold mt-1">
                    {saving ? 'Creating…' : 'Create Goal'}
                </Button>
            </div>
        </FinanceDialogShell>
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
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!categoryId) { toast.error('Select a category'); return }
        const n = parseFloat(amount)
        if (isNaN(n) || n <= 0) { toast.error('Enter valid amount'); return }
        setSaving(true)
        try {
            await createBudget({ category_id: categoryId, period, amount: n, ...getPeriodDates(period) })
            toast.success('Budget created')
            setCategoryId(''); setAmount('')
            onSave()
        } catch (e: any) { toast.error(e.message) }
        finally { setSaving(false) }
    }

    return (
        <FinanceDialogShell open={open} onOpenChange={onOpenChange} title="New Budget">
            <div className="space-y-3">
                <div>
                    <FormLabel>Category</FormLabel>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue placeholder="Expense category" /></SelectTrigger>
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
                <div>
                    <FormLabel>Period</FormLabel>
                    <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                        <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {(['weekly', 'monthly', 'yearly'] as const).map(p => (
                                <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <FormLabel>Budget Amount (IDR)</FormLabel>
                    <Input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="1000000" className="rounded-xl text-xs h-9" />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl font-semibold mt-1">
                    {saving ? 'Creating…' : 'Create Budget'}
                </Button>
            </div>
        </FinanceDialogShell>
    )
}
