'use client'

import { useState } from 'react'
import {
    Plus, CreditCard, Clock, CheckCircle2, X, Filter,
    BadgeDollarSign, Trash2, LayoutGrid, LayoutList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem,
    DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { EmptyState, fmt } from './shared'
import { useDebtMonthToggle, DEBT_STATUS_COLORS } from './use-debt-toggle'
import type { Debt } from '@/lib/supabase/finance'

// ─── Shared Status Icons ──────────────────────────────────────────────────────

const STATUS_ICONS: Record<string, React.ReactNode> = {
    active: <Clock className="size-4" />,
    settled: <CheckCircle2 className="size-4" />,
    cancelled: <X className="size-4" />,
}

// ─── Filter Labels ────────────────────────────────────────────────────────────

const FILTER_LABELS: Record<string, string> = {
    all: 'All',
    payable: 'I Owe',
    receivable: 'They Owe Me',
}

// ─── Installment Checkboxes ───────────────────────────────────────────────────

function InstallmentChecks({ debt, updating, onToggle }: {
    debt: Debt
    updating: boolean
    onToggle: (i: number) => void
}) {
    if (!debt.installment_months || debt.installment_months <= 0) return null
    const isPayable = debt.direction === 'payable'

    return (
        <div className="flex flex-wrap gap-1">
            {Array.from({ length: debt.installment_months }).map((_, i) => {
                const isChecked = (debt.checked_months || []).includes(i)
                return (
                    <button
                        key={i}
                        disabled={updating}
                        onClick={() => onToggle(i)}
                        className={`w-5 h-5 rounded flex items-center justify-center text-3xs border transition-colors cursor-pointer disabled:opacity-50 ${isChecked
                                ? (isPayable ? 'bg-rose-500 border-rose-500 text-white' : 'bg-emerald-500 border-emerald-500 text-white')
                                : 'border-border text-muted-foreground hover:bg-muted'
                            }`}
                        title={`Toggle Month ${i + 1}`}
                    >
                        {isChecked ? <CheckCircle2 className="size-3" /> : (i + 1)}
                    </button>
                )
            })}
        </div>
    )
}

// ─── Debt Card ────────────────────────────────────────────────────────────────

function DebtCard({ debt, onPay, onEditContact, onRefresh, onDelete }: {
    debt: Debt
    onPay: () => void
    onEditContact: () => void
    onRefresh: () => void
    onDelete: () => void
}) {
    const { updating, handleToggleMonth } = useDebtMonthToggle(debt, onRefresh)
    const remaining = debt.principal - debt.paid_amount
    const pct = Math.min((debt.paid_amount / debt.principal) * 100, 100)
    const isPayable = debt.direction === 'payable'

    return (
        <div className="bg-card rounded-2xl p-3.5 shadow-sm space-y-2.5 pb-6">
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
                        <p className="text-2xs text-muted-foreground">{isPayable ? 'I owe' : debt.description}</p>
                    </div>
                </button>

                <div className="flex items-center gap-1 group/actions">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className={`flex items-center gap-0.5 text-sm font-semibold py-0.5 flex-shrink-0 ${DEBT_STATUS_COLORS[debt.status]}`}>
                                {STATUS_ICONS[debt.status]}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="capitalize text-2xs">
                            {debt.status}
                        </TooltipContent>
                    </Tooltip>

                    {debt.due_date
                        ? <span className="text-2xs text-muted-foreground">{debt.due_date}</span>
                        : <span />
                    }

                    {debt.status === 'active' && remaining > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={onPay} className="text-muted-foreground flex items-center gap-0.5 font-semibold text-primary">
                                    <BadgeDollarSign className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-2xs">Record Payment</TooltipContent>
                        </Tooltip>
                    )}

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={onDelete} className="p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-2xs">Delete</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* Amount */}
            <div>
                <p className={`text-sm font-bold tabular-nums leading-none ${isPayable ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {fmt(remaining)}
                </p>
                <p className="text-2xs text-muted-foreground mt-0.5">of {fmt(debt.principal)}</p>
            </div>

            {/* Progress */}
            <div className="w-full bg-muted rounded-full h-1">
                <div className={`h-1 rounded-full ${isPayable ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
            </div>

            {/* Installments */}
            <InstallmentChecks debt={debt} updating={updating} onToggle={handleToggleMonth} />
        </div>
    )
}

// ─── Debt Row (list view) ─────────────────────────────────────────────────────

function DebtRow({ debt, onPay, onEditContact, onRefresh, onDelete }: {
    debt: Debt
    onPay: () => void
    onEditContact: () => void
    onRefresh: () => void
    onDelete: () => void
}) {
    const { updating, handleToggleMonth } = useDebtMonthToggle(debt, onRefresh)
    const remaining = debt.principal - debt.paid_amount
    const pct = Math.min((debt.paid_amount / debt.principal) * 100, 100)
    const isPayable = debt.direction === 'payable'

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 group hover:bg-muted/40 transition-colors">
            {/* Avatar */}
            <button
                onClick={onEditContact}
                className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0 hover:bg-primary/20 transition-colors"
                title="Edit contact"
            >
                {debt.contact?.name?.charAt(0).toUpperCase() ?? 'U'}
            </button>

            {/* Name + direction */}
            <div className="w-28 flex-shrink-0 min-w-0">
                <p className="text-xs font-semibold truncate">{debt.contact?.name ?? 'Unknown'}</p>
                <p className="text-2xs text-muted-foreground">{isPayable ? 'I owe' : debt.description}</p>
            </div>

            {/* Progress bar or Installments */}
            <div className="flex-1 min-w-0 hidden sm:block">
                {debt.installment_months && debt.installment_months > 0 ? (
                    <InstallmentChecks debt={debt} updating={updating} onToggle={handleToggleMonth} />
                ) : (
                    <div className="w-full bg-muted rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${isPayable ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                )}
            </div>

            {/* Remaining */}
            <p className={`text-xs font-bold tabular-nums w-28 text-right flex-shrink-0 ${isPayable ? 'text-rose-500' : 'text-emerald-500'}`}>
                {fmt(remaining)}
            </p>

            {/* Description + Due */}
            <p className="text-2xs text-muted-foreground w-20 text-center flex-shrink-0 hidden md:block">
                {debt.description}
            </p>
            <p className="text-2xs text-muted-foreground w-20 text-right flex-shrink-0 hidden md:block">
                {debt.due_date ?? '—'}
            </p>

            {/* Actions */}
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className={`${DEBT_STATUS_COLORS[debt.status]} flex-shrink-0 p-1 cursor-default`}>
                            {STATUS_ICONS[debt.status]}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="capitalize text-2xs">{debt.status}</TooltipContent>
                </Tooltip>

                {debt.status === 'active' && remaining > 0 && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={onPay} variant="ghost" size="icon" className="text-2xs font-semibold text-primary hover:underline flex items-center">
                                <BadgeDollarSign className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-2xs">Record Payment</TooltipContent>
                    </Tooltip>
                )}

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button onClick={onDelete} size="icon" variant="ghost" className="hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-2xs">Delete</TooltipContent>
                </Tooltip>
            </div>
        </div>
    )
}

// ─── Debts Panel ──────────────────────────────────────────────────────────────

export function DebtsPanel({ debts, onRefresh, onAdd, onPay, onEditContact, onDelete }: {
    debts: Debt[]
    onRefresh: () => void
    onAdd: () => void
    onPay: (d: Debt) => void
    onEditContact: (d: Debt) => void
    onDelete: (id: string) => void
}) {
    const [filter, setFilter] = useState<'all' | 'payable' | 'receivable'>('all')
    const [view, setView] = useState<'card' | 'list'>('card')
    const filtered = filter === 'all' ? debts : debts.filter(d => d.direction === filter)

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
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
                                <Filter className="size-3" /> {FILTER_LABELS[filter]}
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
                        <button onClick={onAdd} className="text-primary font-medium hover:underline">
                            Add your first debt or loan
                        </button>
                    </p>
                </div>
            ) : view === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {filtered.map(d => (
                        <DebtCard
                            key={d.id}
                            debt={d}
                            onPay={() => onPay(d)}
                            onEditContact={() => onEditContact(d)}
                            onRefresh={onRefresh}
                            onDelete={() => onDelete(d.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-card rounded-2xl shadow-sm divide-y divide-border overflow-hidden overflow-x-auto">
                    {filtered.map(d => (
                        <DebtRow
                            key={d.id}
                            debt={d}
                            onPay={() => onPay(d)}
                            onEditContact={() => onEditContact(d)}
                            onRefresh={onRefresh}
                            onDelete={() => onDelete(d.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
