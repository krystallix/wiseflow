'use client'

import { Wallet, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fmt } from './shared'
import type { Wallet as WalletType } from '@/lib/supabase/finance'

// ─── Wallet Card ──────────────────────────────────────────────────────────────

export function WalletCard({ wallet, onEdit, onDelete }: {
    wallet: WalletType
    onEdit: () => void
    onDelete: () => void
}) {
    const bg = wallet.color ?? '#786BEE'

    return (
        <div
            className="flex-shrink-0 w-44 sm:w-52 rounded-2xl p-4 text-white shadow-sm flex flex-col gap-3 relative overflow-hidden group"
            style={{ background: `linear-gradient(135deg, ${bg}cc, ${bg})` }}
        >
            <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white" />
                <div className="absolute -right-2 top-8 w-16 h-16 rounded-full bg-white" />
            </div>

            <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-semibold opacity-80 capitalize">
                    {wallet.type}{wallet.is_default ? ' ⭐' : ''}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onEdit}
                        className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                        title="Edit wallet"
                    >
                        <Pencil className="size-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDelete}
                        className="p-1 rounded-lg bg-white/20 hover:bg-red-400/60 transition-colors"
                        title="Delete wallet"
                    >
                        <Trash2 className="size-3" />
                    </Button>
                </div>
            </div>

            <div className="relative z-10">
                <p className="text-xs opacity-70 font-medium">{wallet.name}</p>
                <p className="text-xl font-bold mt-0.5">{fmt(wallet.balance, wallet.currency)}</p>
            </div>
        </div>
    )
}

// ─── Empty Wallet Card ────────────────────────────────────────────────────────

export function EmptyWalletCard({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex-shrink-0 w-44 sm:w-52 rounded-2xl p-4 border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
            <Plus className="size-5" />
            <span className="text-xs font-semibold">Add Wallet</span>
        </button>
    )
}
