'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
    CalendarDays, Plus, Trash2, RotateCcw, CheckCircle2, Circle,
    Loader2, Zap, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import {
    getWeeklyTasks, createWeeklyTask, updateWeeklyTask, deleteWeeklyTask,
    resetAllWeeklyTasks, resetWeeklyRoutineTasks, resetDailyPriorityTasks,
    DAY_DAILY, type WeeklyTask,
} from '@/lib/supabase/weekly-tasks'

// ─── Constants ──────────────────────────────────────────────────────────────

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const DAY_COLORS: Record<number, string> = {
    0: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    1: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    2: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    3: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    4: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    5: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
    6: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
}

const DAY_ACCENT: Record<number, string> = {
    0: 'border-rose-500/30',
    1: 'border-blue-500/30',
    2: 'border-violet-500/30',
    3: 'border-emerald-500/30',
    4: 'border-amber-500/30',
    5: 'border-cyan-500/30',
    6: 'border-pink-500/30',
}

const DAY_DOT: Record<number, string> = {
    0: 'bg-rose-500',
    1: 'bg-blue-500',
    2: 'bg-violet-500',
    3: 'bg-emerald-500',
    4: 'bg-amber-500',
    5: 'bg-cyan-500',
    6: 'bg-pink-500',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCurrentWeekMonday(): Date {
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    return monday
}

function getTodayMidnight(): Date {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
}

function needsWeeklyReset(tasks: WeeklyTask[]): boolean {
    const monday = getCurrentWeekMonday()
    const routineTasks = tasks.filter(t => t.day_of_week < 7)
    if (routineTasks.length === 0) return false
    return routineTasks.some(t => new Date(t.last_reset_at) < monday)
}

function needsDailyReset(tasks: WeeklyTask[]): boolean {
    const today = getTodayMidnight()
    const dailyTasks = tasks.filter(t => t.day_of_week === DAY_DAILY)
    if (dailyTasks.length === 0) return false
    return dailyTasks.some(t => new Date(t.last_reset_at) < today)
}

// ─── Day Column Component ───────────────────────────────────────────────────

function DayColumn({
    day,
    tasks,
    isToday,
    onToggle,
    onAdd,
    onDelete,
}: {
    day: number
    tasks: WeeklyTask[]
    isToday: boolean
    onToggle: (id: string, done: boolean) => void
    onAdd: (day: number, title: string) => void
    onDelete: (id: string) => void
}) {
    const [input, setInput] = useState('')
    const [adding, setAdding] = useState(false)

    const done = tasks.filter(t => t.is_done).length
    const total = tasks.length

    const handleAdd = async () => {
        const title = input.trim()
        if (!title) return
        setAdding(true)
        try {
            await onAdd(day, title)
            setInput('')
        } finally {
            setAdding(false)
        }
    }

    return (
        <div
            className={cn(
                'flex flex-col rounded-xl border bg-card shadow-sm transition-all min-w-[200px]',
                isToday ? DAY_ACCENT[day] + ' ring-1 ring-offset-2 ring-offset-background' : 'border-border/50',
            )}
        >
            {/* Day Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
                <div className="flex items-center gap-2">
                    <div className={cn('size-2 rounded-full', DAY_DOT[day])} />
                    <span className="font-semibold text-sm">{DAYS[day]}</span>
                    {isToday && (
                        <span className={cn('text-3xs font-bold px-1.5 py-0.5 rounded-full', DAY_COLORS[day])}>
                            TODAY
                        </span>
                    )}
                </div>
                {total > 0 && (
                    <span className="text-2xs font-semibold text-muted-foreground">
                        {done}/{total}
                    </span>
                )}
            </div>

            {/* Progress bar */}
            {total > 0 && (
                <div className="px-3 pt-2">
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn('h-full rounded-full transition-all duration-500', DAY_DOT[day])}
                            style={{ width: `${(done / total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Tasks */}
            <div className="flex-1 p-2 space-y-1 min-h-[80px]">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className={cn(
                            'group flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all hover:bg-muted/50',
                            task.is_done && 'opacity-50',
                        )}
                    >
                        <button
                            onClick={() => onToggle(task.id, !task.is_done)}
                            className="shrink-0 transition-transform hover:scale-110"
                        >
                            {task.is_done
                                ? <CheckCircle2 className={cn('size-4', DAY_DOT[day]?.replace('bg-', 'text-'))} />
                                : <Circle className="size-4 text-muted-foreground/50" />
                            }
                        </button>
                        <span className={cn(
                            'flex-1 text-xs font-medium leading-tight',
                            task.is_done && 'line-through text-muted-foreground',
                        )}>
                            {task.title}
                        </span>
                        <button
                            onClick={() => onDelete(task.id)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="size-3 text-muted-foreground hover:text-destructive transition-colors" />
                        </button>
                    </div>
                ))}
                {tasks.length === 0 && (
                    <div className="flex items-center justify-center h-full text-muted-foreground/40 text-2xs font-medium py-4">
                        No tasks yet
                    </div>
                )}
            </div>

            {/* Add task input */}
            <div className="px-2 pb-2">
                <div className="flex gap-1">
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        placeholder="Add task…"
                        className="h-7 text-xs bg-muted/30 border-border/30 rounded-lg"
                        disabled={adding}
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0"
                        onClick={handleAdd}
                        disabled={adding || !input.trim()}
                    >
                        {adding
                            ? <Loader2 className="size-3 animate-spin" />
                            : <Plus className="size-3.5" />
                        }
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Today's Priorities Card (pinned, same size as day columns) ─────────────

function TodayPrioritiesCard({
    tasks,
    onToggle,
    onAdd,
    onDelete,
}: {
    tasks: WeeklyTask[]
    onToggle: (id: string, done: boolean) => void
    onAdd: (day: number, title: string) => void
    onDelete: (id: string) => void
}) {
    const [input, setInput] = useState('')
    const [adding, setAdding] = useState(false)

    const done = tasks.filter(t => t.is_done).length
    const total = tasks.length

    const handleAdd = async () => {
        const title = input.trim()
        if (!title) return
        setAdding(true)
        try {
            await onAdd(DAY_DAILY, title)
            setInput('')
        } finally {
            setAdding(false)
        }
    }

    return (
        <div className="flex flex-col rounded-xl border-2 border-primary/25 bg-gradient-to-b from-primary/5 to-card shadow-sm transition-all min-w-[200px] ring-1 ring-primary/10 ring-offset-1 ring-offset-background">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-primary/10">
                <div className="flex items-center gap-2">
                    <Zap className="size-3.5 text-primary fill-primary/20" />
                    <span className="font-semibold text-sm">Priorities</span>
                    <span className="text-3xs font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                        DAILY
                    </span>
                </div>
                {total > 0 && (
                    <span className="text-2xs font-semibold text-primary">
                        {done}/{total}
                    </span>
                )}
            </div>

            {/* Progress bar */}
            {total > 0 && (
                <div className="px-3 pt-2">
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500 bg-primary"
                            style={{ width: `${(done / total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Tasks */}
            <div className="flex-1 p-2 space-y-1 min-h-[80px]">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className={cn(
                            'group flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all hover:bg-primary/5',
                            task.is_done && 'opacity-40',
                        )}
                    >
                        <button
                            onClick={() => onToggle(task.id, !task.is_done)}
                            className="shrink-0 transition-transform hover:scale-110"
                        >
                            {task.is_done
                                ? <CheckCircle2 className="size-4 text-primary" />
                                : <Circle className="size-4 text-muted-foreground/50" />
                            }
                        </button>
                        <span className={cn(
                            'flex-1 text-xs font-medium leading-tight',
                            task.is_done && 'line-through text-muted-foreground',
                        )}>
                            {task.title}
                        </span>
                        <button
                            onClick={() => onDelete(task.id)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="size-3 text-muted-foreground hover:text-destructive transition-colors" />
                        </button>
                    </div>
                ))}
                {tasks.length === 0 && (
                    <div className="flex items-center justify-center h-full text-muted-foreground/40 text-2xs font-medium py-4">
                        No priorities yet
                    </div>
                )}
            </div>

            {/* Add input */}
            <div className="px-2 pb-2">
                <div className="flex gap-1">
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        placeholder="Add priority…"
                        className="h-7 text-xs bg-primary/5 border-primary/15 rounded-lg"
                        disabled={adding}
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 text-primary hover:bg-primary/10"
                        onClick={handleAdd}
                        disabled={adding || !input.trim()}
                    >
                        {adding
                            ? <Loader2 className="size-3 animate-spin" />
                            : <Plus className="size-3.5" />
                        }
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Task List Content (shared between mobile sheet & desktop card) ─────────

function TaskListContent({
    tasks,
    onToggle,
    onDelete,
    onAdd,
    dayOrPriority,
    addPlaceholder,
    hoverBg,
    checkColor,
}: {
    tasks: WeeklyTask[]
    onToggle: (id: string, done: boolean) => void
    onDelete: (id: string) => void
    onAdd: (day: number, title: string) => void
    dayOrPriority: number
    addPlaceholder: string
    hoverBg: string
    checkColor: string
}) {
    const [input, setInput] = useState('')
    const [adding, setAdding] = useState(false)

    const handleAdd = async () => {
        const title = input.trim()
        if (!title) return
        setAdding(true)
        try {
            await onAdd(dayOrPriority, title)
            setInput('')
        } finally {
            setAdding(false)
        }
    }

    return (
        <>
            <div className="flex-1 space-y-1 min-h-[60px]">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className={cn(
                            'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                            hoverBg,
                            task.is_done && 'opacity-40',
                        )}
                    >
                        <button
                            onClick={() => onToggle(task.id, !task.is_done)}
                            className="shrink-0 transition-transform hover:scale-110"
                        >
                            {task.is_done
                                ? <CheckCircle2 className={cn('size-5', checkColor)} />
                                : <Circle className="size-5 text-muted-foreground/50" />
                            }
                        </button>
                        <span className={cn(
                            'flex-1 text-sm font-medium leading-tight',
                            task.is_done && 'line-through text-muted-foreground',
                        )}>
                            {task.title}
                        </span>
                        <button
                            onClick={() => onDelete(task.id)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="size-4 text-muted-foreground hover:text-destructive transition-colors" />
                        </button>
                    </div>
                ))}
                {tasks.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-muted-foreground/40 text-sm font-medium">
                        No tasks yet
                    </div>
                )}
            </div>

            {/* Add task input */}
            <div className="pt-2 mt-auto">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        placeholder={addPlaceholder}
                        className="h-10 text-sm bg-muted/30 border-border/30 rounded-xl"
                        disabled={adding}
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 shrink-0"
                        onClick={handleAdd}
                        disabled={adding || !input.trim()}
                    >
                        {adding
                            ? <Loader2 className="size-4 animate-spin" />
                            : <Plus className="size-4" />
                        }
                    </Button>
                </div>
            </div>
        </>
    )
}

// ─── Mobile Bottom Sheet for Day ────────────────────────────────────────────

function MobileDaySheet({
    day,
    tasks,
    isToday,
    onToggle,
    onAdd,
    onDelete,
}: {
    day: number
    tasks: WeeklyTask[]
    isToday: boolean
    onToggle: (id: string, done: boolean) => void
    onAdd: (day: number, title: string) => void
    onDelete: (id: string) => void
}) {
    const [open, setOpen] = useState(false)
    const done = tasks.filter(t => t.is_done).length
    const total = tasks.length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0

    return (
        <>
            {/* Compact tappable row */}
            <button
                onClick={() => setOpen(true)}
                className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 rounded-xl border bg-card shadow-sm transition-all active:scale-[0.98]',
                    isToday ? DAY_ACCENT[day] + ' ring-1 ring-offset-1 ring-offset-background' : 'border-border/50',
                )}
            >
                <div className={cn('size-2.5 rounded-full shrink-0', DAY_DOT[day])} />
                <span className="font-semibold text-sm flex-1 text-left">{DAYS[day]}</span>
                {isToday && (
                    <span className={cn('text-3xs font-bold px-1.5 py-0.5 rounded-full', DAY_COLORS[day])}>
                        TODAY
                    </span>
                )}
                {total > 0 && (
                    <span className="text-2xs font-semibold text-muted-foreground">
                        {done}/{total}
                    </span>
                )}
                {total > 0 && (
                    <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn('h-full rounded-full transition-all', DAY_DOT[day])}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                )}
                <ChevronRight className="size-4 text-muted-foreground/50 shrink-0" />
            </button>

            {/* Bottom Sheet */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="bottom"
                    className="rounded-t-2xl h-[95dvh] flex flex-col px-4 pb-6"
                    showCloseButton={false}
                >
                    {/* Drag handle */}
                    <div className="flex justify-center pt-2 pb-1">
                        <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
                    </div>
                    <SheetHeader className="p-0 pb-3">
                        <SheetTitle className="flex items-center gap-2">
                            <div className={cn('size-2.5 rounded-full', DAY_DOT[day])} />
                            {DAYS[day]}
                            {isToday && (
                                <span className={cn('text-3xs font-bold px-1.5 py-0.5 rounded-full', DAY_COLORS[day])}>
                                    TODAY
                                </span>
                            )}
                            {total > 0 && (
                                <span className="text-xs font-semibold text-muted-foreground ml-auto">
                                    {done}/{total}
                                </span>
                            )}
                        </SheetTitle>
                        <SheetDescription className="sr-only">Tasks for {DAYS[day]}</SheetDescription>
                    </SheetHeader>

                    {/* Progress bar */}
                    {total > 0 && (
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                            <div
                                className={cn('h-full rounded-full transition-all duration-500', DAY_DOT[day])}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    )}

                    <div className="overflow-y-auto flex-1 -mx-1 px-1">
                        <TaskListContent
                            tasks={tasks}
                            onToggle={onToggle}
                            onDelete={onDelete}
                            onAdd={onAdd}
                            dayOrPriority={day}
                            addPlaceholder="Add task…"
                            hoverBg="hover:bg-muted/50"
                            checkColor={DAY_DOT[day]?.replace('bg-', 'text-')}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}

// ─── Mobile Bottom Sheet for Priorities ─────────────────────────────────────

function MobilePrioritiesSheet({
    tasks,
    onToggle,
    onAdd,
    onDelete,
}: {
    tasks: WeeklyTask[]
    onToggle: (id: string, done: boolean) => void
    onAdd: (day: number, title: string) => void
    onDelete: (id: string) => void
}) {
    const [open, setOpen] = useState(false)
    const done = tasks.filter(t => t.is_done).length
    const total = tasks.length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0

    return (
        <>
            {/* Compact tappable row */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-primary/25 bg-gradient-to-r from-primary/5 to-card shadow-sm transition-all active:scale-[0.98] ring-1 ring-primary/10"
            >
                <Zap className="size-3.5 text-primary fill-primary/20 shrink-0" />
                <span className="font-semibold text-sm flex-1 text-left">Priorities</span>
                <span className="text-3xs font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                    DAILY
                </span>
                {total > 0 && (
                    <span className="text-2xs font-semibold text-primary">
                        {done}/{total}
                    </span>
                )}
                {total > 0 && (
                    <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all bg-primary"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                )}
                <ChevronRight className="size-4 text-muted-foreground/50 shrink-0" />
            </button>

            {/* Bottom Sheet */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="bottom"
                    className="rounded-t-2xl h-[95dvh] flex flex-col px-4 pb-6"
                    showCloseButton={false}
                >
                    {/* Drag handle */}
                    <div className="flex justify-center pt-2 pb-1">
                        <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
                    </div>
                    <SheetHeader className="p-0 pb-3">
                        <SheetTitle className="flex items-center gap-2">
                            <Zap className="size-4 text-primary fill-primary/20" />
                            Today&apos;s Priorities
                            {total > 0 && (
                                <span className="text-xs font-semibold text-primary ml-auto">
                                    {done}/{total}
                                </span>
                            )}
                        </SheetTitle>
                        <SheetDescription className="sr-only">Your daily priority tasks</SheetDescription>
                    </SheetHeader>

                    {/* Progress bar */}
                    {total > 0 && (
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                            <div
                                className="h-full rounded-full transition-all duration-500 bg-primary"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    )}

                    <div className="overflow-y-auto flex-1 -mx-1 px-1">
                        <TaskListContent
                            tasks={tasks}
                            onToggle={onToggle}
                            onDelete={onDelete}
                            onAdd={onAdd}
                            dayOrPriority={DAY_DAILY}
                            addPlaceholder="Add priority…"
                            hoverBg="hover:bg-primary/5"
                            checkColor="text-primary"
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function WeeklySkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
                ))}
            </div>
        </div>
    )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function WeeklyTasksClient() {
    const [tasks, setTasks] = useState<WeeklyTask[]>([])
    const [loading, setLoading] = useState(true)
    const [resetting, setResetting] = useState(false)
    const isMobile = useIsMobile()

    const today = new Date().getDay()

    // ── Fetch + auto-reset ──
    const fetchTasks = useCallback(async () => {
        try {
            let data = await getWeeklyTasks()

            let didReset = false

            // Check weekly reset (Monday boundary)
            if (needsWeeklyReset(data)) {
                await resetWeeklyRoutineTasks()
                didReset = true
            }

            // Check daily reset (midnight boundary)
            if (needsDailyReset(data)) {
                await resetDailyPriorityTasks()
                didReset = true
            }

            if (didReset) {
                data = await getWeeklyTasks()
                toast.info('Tasks have been reset!')
            }

            setTasks(data)
        } catch {
            toast.error('Failed to load weekly tasks')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchTasks() }, [fetchTasks])

    // ── Handlers ──
    const handleToggle = async (id: string, done: boolean) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, is_done: done } : t))
        try {
            await updateWeeklyTask(id, { is_done: done })
        } catch {
            setTasks(prev => prev.map(t => t.id === id ? { ...t, is_done: !done } : t))
            toast.error('Failed to update task')
        }
    }

    const handleAdd = async (day: number, title: string) => {
        try {
            const created = await createWeeklyTask(day, title)
            setTasks(prev => [...prev, created])
        } catch {
            toast.error('Failed to add task')
        }
    }

    const handleDelete = async (id: string) => {
        const prev = tasks
        setTasks(t => t.filter(x => x.id !== id))
        try {
            await deleteWeeklyTask(id)
        } catch {
            setTasks(prev)
            toast.error('Failed to delete task')
        }
    }

    const handleManualReset = async () => {
        toast('Reset all tasks?', {
            description: 'This will uncheck all tasks including daily priorities.',
            action: {
                label: 'Reset',
                onClick: async () => {
                    setResetting(true)
                    try {
                        await resetAllWeeklyTasks()
                        setTasks(prev => prev.map(t => ({ ...t, is_done: false })))
                        toast.success('All tasks reset')
                    } catch {
                        toast.error('Failed to reset tasks')
                    } finally {
                        setResetting(false)
                    }
                },
            },
        })
    }

    if (loading) return <WeeklySkeleton />

    // Group tasks
    const dailyTasks = tasks.filter(t => t.day_of_week === DAY_DAILY)
    const routineTasks = tasks.filter(t => t.day_of_week < 7)

    const tasksByDay: Record<number, WeeklyTask[]> = {}
    for (let d = 0; d < 7; d++) tasksByDay[d] = []
    routineTasks.forEach(t => {
        if (tasksByDay[t.day_of_week]) tasksByDay[t.day_of_week].push(t)
    })

    // Mon→Sun order
    const orderedDays = [1, 2, 3, 4, 5, 6, 0]

    const totalDone = tasks.filter(t => t.is_done).length
    const totalTasks = tasks.length

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="size-7" />
                        <h1 className="font-bold text-2xl sm:text-3xl">Weekly Tasks</h1>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Plan your recurring tasks for each day. Routines reset every Monday.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {totalTasks > 0 && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                            <CheckCircle2 className="size-3.5 text-primary" />
                            {totalDone}/{totalTasks} done
                        </div>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs rounded-xl"
                        onClick={handleManualReset}
                        disabled={resetting}
                    >
                        {resetting
                            ? <Loader2 className="size-3 animate-spin" />
                            : <RotateCcw className="size-3" />
                        }
                        Reset Week
                    </Button>
                </div>
            </div>

            {/* Overall progress */}
            {totalTasks > 0 && (
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${(totalDone / totalTasks) * 100}%` }}
                    />
                </div>
            )}

            {/* Mobile: compact list with bottom sheets */}
            {isMobile ? (
                <div className="flex flex-col gap-2">
                    {/* Pinned: Today's Priorities */}
                    <MobilePrioritiesSheet
                        tasks={dailyTasks}
                        onToggle={handleToggle}
                        onAdd={handleAdd}
                        onDelete={handleDelete}
                    />

                    {/* Day rows: Mon → Sun */}
                    {orderedDays.map(day => (
                        <MobileDaySheet
                            key={day}
                            day={day}
                            tasks={tasksByDay[day]}
                            isToday={today === day}
                            onToggle={handleToggle}
                            onAdd={handleAdd}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : (
                /* Desktop: Grid layout */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {/* Pinned: Today's Priorities */}
                    <TodayPrioritiesCard
                        tasks={dailyTasks}
                        onToggle={handleToggle}
                        onAdd={handleAdd}
                        onDelete={handleDelete}
                    />

                    {/* Day columns: Mon → Sun */}
                    {orderedDays.map(day => (
                        <DayColumn
                            key={day}
                            day={day}
                            tasks={tasksByDay[day]}
                            isToday={today === day}
                            onToggle={handleToggle}
                            onAdd={handleAdd}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

