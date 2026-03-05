'use client'

// ─── Finance Skeleton ─────────────────────────────────────────────────────────

export function FinanceSkeleton() {
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
