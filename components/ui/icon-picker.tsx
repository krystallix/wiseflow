'use client'

import * as React from 'react'
import * as LucideIcons from 'lucide-react'
import { SearchIcon, XIcon } from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/animate-ui/components/radix/popover'
import { cn } from '@/lib/utils'

// lucide icons are React.forwardRef objects (not plain functions),
// so we filter by naming convention only — no typeof check.
const EXCLUDED = new Set(['createLucideIcon', 'default'])
const ALL_ICON_NAMES: string[] = Object.keys(LucideIcons).filter(
    (k) => /^[A-Z]/.test(k) && !k.endsWith('Icon') && !EXCLUDED.has(k),
)

export type IconName = string

function DynamicIcon({ name, className }: { name: string; className?: string }) {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name]
    if (!Icon) return null
    return <Icon className={className} />
}

interface IconPickerProps {
    value?: IconName
    onChange?: (icon: IconName) => void
    className?: string
}

const PAGE_SIZE = 80

export function IconPicker({ value, onChange, className }: IconPickerProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const [page, setPage] = React.useState(1)
    const scrollRef = React.useRef<HTMLDivElement>(null)

    const filtered = React.useMemo(() => {
        if (!search.trim()) return ALL_ICON_NAMES
        const q = search.toLowerCase().replace(/[-_ ]/g, '')
        return ALL_ICON_NAMES.filter((n) =>
            n.toLowerCase().replace(/[-_ ]/g, '').includes(q),
        )
    }, [search])

    const visible = React.useMemo(
        () => filtered.slice(0, page * PAGE_SIZE),
        [filtered, page],
    )

    React.useEffect(() => {
        setPage(1)
        scrollRef.current?.scrollTo({ top: 0 })
    }, [search])

    const handleScroll = React.useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
            setPage((p) => p + 1)
        }
    }, [])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'flex items-center justify-center size-9 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors shrink-0',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        open && 'bg-muted ring-2 ring-ring',
                        className,
                    )}
                    aria-label={value ? `Selected icon: ${value}` : 'Pick an icon'}
                >
                    {value ? (
                        <DynamicIcon name={value} className="size-4 text-foreground" />
                    ) : (
                        <LucideIcons.Smile className="size-4 text-muted-foreground" />
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent className="w-72 p-0 shadow-xl" align="start" sideOffset={6}>
                {/* Search */}
                <div className="flex items-center gap-1.5 border-b px-2.5 py-2">
                    <SearchIcon className="size-3.5 text-muted-foreground shrink-0" />
                    <input
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        placeholder="Search icons..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <XIcon className="size-3" />
                        </button>
                    )}
                </div>

                {/* Count */}
                <div className="px-2.5 pt-2 pb-1">
                    <p className="text-[11px] text-muted-foreground">
                        {filtered.length} icon{filtered.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Grid */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    onWheel={(e) => e.stopPropagation()}
                    className="h-56 overflow-y-auto px-2 pb-2"
                >
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                            <LucideIcons.PackageSearch className="size-8 opacity-40" />
                            <p className="text-xs">No icons found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-0.5">
                            {visible.map((name) => {
                                const isSelected = value === name
                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        title={name}
                                        onClick={() => {
                                            onChange?.(name)
                                            setOpen(false)
                                        }}
                                        className={cn(
                                            'flex items-center justify-center size-8 rounded-md transition-colors',
                                            'hover:bg-accent hover:text-accent-foreground',
                                            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                                            isSelected &&
                                            'bg-primary text-primary-foreground hover:bg-primary/90',
                                        )}
                                    >
                                        <DynamicIcon name={name} className="size-4" />
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
