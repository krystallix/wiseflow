'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { updateDebt, type Debt } from '@/lib/supabase/finance'

// ─── Shared Debt Month Toggle Hook ────────────────────────────────────────────

export function useDebtMonthToggle(debt: Debt, onRefresh: () => void) {
    const [updating, setUpdating] = useState(false)

    const handleToggleMonth = useCallback(async (monthIndex: number) => {
        if (updating) return
        setUpdating(true)
        try {
            const currentChecked = debt.checked_months || []
            const isChecked = currentChecked.includes(monthIndex)
            const newChecked = isChecked
                ? currentChecked.filter(m => m !== monthIndex)
                : [...currentChecked, monthIndex]

            let newPaidAmount = debt.principal
            let newStatus = debt.status

            if (debt.installment_months && debt.installment_months > 0) {
                const amountPerMonth = debt.principal / debt.installment_months
                newPaidAmount = newChecked.length * amountPerMonth
                newStatus = newPaidAmount >= debt.principal ? 'settled' : 'active'
            }

            await updateDebt(debt.id, {
                checked_months: newChecked,
                paid_amount: newPaidAmount,
                status: newStatus,
            })
            onRefresh()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setUpdating(false)
        }
    }, [debt, updating, onRefresh])

    return { updating, handleToggleMonth }
}

// ─── Shared Debt Status Config ────────────────────────────────────────────────

export const DEBT_STATUS_COLORS: Record<string, string> = {
    active: 'text-amber-500',
    settled: 'text-emerald-500',
    cancelled: 'text-muted-foreground',
}
