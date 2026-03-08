'use client'

import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, Moon, Sparkles, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    getMonthGrid,
    getDayInfo,
    GREGORIAN_MONTH_NAMES_EN,
    DAY_NAMES_EN,
    type DayInfo,
} from '@/lib/javanese-calendar'
import { Button } from '@/components/ui/button'
import { getHolidays, type Holiday } from '@/lib/holidays'
import { getTasks, type Task } from '@/lib/supabase/tasks'


// ─── Eastern Arabic Numerals ─────────────────────────────────────────────────

const EASTERN_ARABIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const

function toEasternArabic(num: number): string {
    return String(num)
        .split('')
        .map(d => EASTERN_ARABIC[parseInt(d)])
        .join('')
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
}

// ─── Calendar Page ───────────────────────────────────────────────────────────

export default function CalendarPage() {
    const today = new Date()
    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth()) // 0-indexed
    const [selectedDate, setSelectedDate] = useState<DayInfo | null>(getDayInfo(today))

    const [holidays, setHolidays] = useState<Holiday[]>([])
    const [tasks, setTasks] = useState<Task[]>([])

    useEffect(() => {
        const fetchHolidays = async () => {
            const result = await getHolidays(year)
            setHolidays(result)
        }
        fetchHolidays()
    }, [year])

    useEffect(() => {
        const fetchAllTasks = async () => {
            try {
                const fetchedTasks = await getTasks()
                setTasks(fetchedTasks)
            } catch (error) {
                console.error('Failed to fetch tasks:', error)
            }
        }
        fetchAllTasks()
    }, [])

    const grid = useMemo(() => getMonthGrid(year, month), [year, month])

    // Get the Hijri/Javanese info for the 15th of the shown month to display month names
    const midMonthInfo = useMemo(() => getDayInfo(new Date(year, month, 15)), [year, month])

    const prevMonth = () => {
        if (month === 0) {
            setYear(y => y - 1)
            setMonth(11)
        } else {
            setMonth(m => m - 1)
        }
    }

    const nextMonth = () => {
        if (month === 11) {
            setYear(y => y + 1)
            setMonth(0)
        } else {
            setMonth(m => m + 1)
        }
    }

    const goToToday = () => {
        setYear(today.getFullYear())
        setMonth(today.getMonth())
        setSelectedDate(getDayInfo(today))
    }

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500 pb-10 max-w-5xl mx-auto">
            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <CalendarDays className="size-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                            Calendar
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Gregorian · Javanese · Hijri
                        </p>
                    </div>
                </div>
                <button
                    onClick={goToToday}
                    className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                    Today
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
                {/* ─── Main Calendar Card ─── */}
                <div className="bg-card rounded-2xl  border border-border/30 overflow-hidden">
                    {/* Month/Year header with navigation */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
                        <button
                            onClick={prevMonth}
                            className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer "
                        >
                            <ChevronLeft className="size-4" />
                        </button>

                        <div className="text-center">
                            <h2 className="text-lg font-bold text-foreground">
                                {GREGORIAN_MONTH_NAMES_EN[month]} {year}
                            </h2>
                            <div className="flex items-center justify-center gap-3 mt-1">
                                <span className="text-2xs text-muted-foreground font-medium flex items-center gap-1">
                                    <Moon className="size-3" />
                                    {midMonthInfo.hijri.monthName} {midMonthInfo.hijri.year} H
                                </span>
                                <span className="text-muted-foreground/30">·</span>
                                <span className="text-2xs text-muted-foreground font-medium flex items-center gap-1">
                                    <Sparkles className="size-3" />
                                    {midMonthInfo.javanese.monthName} {midMonthInfo.javanese.year} AJ
                                </span>
                            </div>
                        </div>

                        <Button
                            size="icon-lg"
                            onClick={nextMonth}
                            className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer "
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 px-1 pt-1">
                        {DAY_NAMES_EN.map((day, i) => (
                            <div
                                key={day}
                                className={cn(
                                    'text-center text-xs font-bold py-1.5',
                                    i === 6 ? 'text-rose-600 dark:text-rose-400' : // Minggu (Sunday)
                                        'text-muted-foreground'
                                )}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid — traditional Indonesian style */}
                    <div className="px-1 pb-1">
                        {grid.map((week, wi) => (
                            <div key={wi} className="grid grid-cols-7 gap-px">
                                {week.map((info, di) => {
                                    const isCurrentMonth = info.gregorian.getMonth() === month
                                    const isToday = isSameDay(info.gregorian, today)
                                    const isSelected = selectedDate && isSameDay(info.gregorian, selectedDate.gregorian)
                                    const isSunday = di === 6

                                    // Check holidays
                                    const dateKey = `${info.gregorian.getFullYear()}-${(info.gregorian.getMonth() + 1).toString().padStart(2, '0')}-${info.gregorian.getDate().toString().padStart(2, '0')}`
                                    const dayHolidays = holidays.filter(h => h.date === dateKey)
                                    const isHoliday = dayHolidays.length > 0

                                    // Check tasks
                                    const dayTasks = tasks.filter(t => t.due_date === dateKey)
                                    const hasTasks = dayTasks.length > 0

                                    // Determine text color class
                                    const dateColorClass = isSelected
                                        ? 'text-primary-foreground'
                                        : (isSunday || isHoliday)
                                            ? 'text-rose-600 dark:text-rose-400'
                                            : 'text-foreground'

                                    const subColorClass = isSelected
                                        ? 'text-primary-foreground/70'
                                        : (isSunday || isHoliday)
                                            ? 'text-rose-500/70'
                                            : 'text-muted-foreground'

                                    return (
                                        <button
                                            key={di}
                                            onClick={() => {
                                                setSelectedDate(info)
                                                if (!isCurrentMonth) {
                                                    setMonth(info.gregorian.getMonth())
                                                    setYear(info.gregorian.getFullYear())
                                                }
                                            }}
                                            className={cn(
                                                'relative p-0.5 sm:p-1 aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer group border',
                                                isSelected
                                                    ? 'bg-primary  shadow-primary/25 border-primary'
                                                    : isToday
                                                        ? 'border-primary/50 bg-primary/5'
                                                        : 'border-transparent hover:bg-muted/40 hover:border-border/30',
                                                !isCurrentMonth && !isSelected && 'opacity-5 hover:opacity-80'
                                            )}
                                        >
                                            {/* Gregorian date — large */}
                                            <span className={cn(
                                                'text-xl sm:text-4xl font-extrabold leading-none tracking-tight',
                                                dateColorClass,
                                            )}>
                                                {info.gregorian.getDate()}
                                            </span>

                                            {/* Bottom row: [tgl jawa] [pasaran] [tgl arab] */}
                                            <span className={cn(
                                                'text-3xs sm:text-2xs gap-1 font-bold uppercase tracking-wide leading-tight flex items-center justify-center mt-0.5',
                                                subColorClass,
                                            )}>
                                                {info.javanese.day} {info.pasaran}
                                                <span
                                                    className={cn(
                                                        'text-3xs sm:text-2xs font-medium normal-case',
                                                        isSelected ? 'text-primary-foreground/50' : 'text-muted-foreground/40'
                                                    )}
                                                    style={{ fontFamily: "'Noto Naskh Arabic', 'Amiri', serif" }}
                                                >
                                                    {toEasternArabic(info.hijri.day)}
                                                </span>
                                            </span>

                                            {/* Today indicator dot */}
                                            {isToday && !isSelected && (
                                                <span className="absolute top-3 right-3 size-1.5 rounded-full bg-accent-foreground animate-pulse" />
                                            )}

                                            {/* Task indicator dots container */}
                                            {hasTasks && (
                                                <div className="absolute top-3 left-3 flex flex-col gap-0.5">
                                                    {dayTasks.slice(0, 3).map((_, i) => (
                                                        <span key={i} className={cn("size-1 rounded-full", isSelected ? 'bg-primary-foreground/80' : 'bg-primary')} />
                                                    ))}
                                                    {dayTasks.length > 3 && (
                                                        <span className={cn("size-1 rounded-full", isSelected ? 'bg-primary-foreground/40' : 'bg-primary/40')} />
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── Sidebar: Selected Date Details ─── */}
                <div className="space-y-4">
                    {/* Selected Date Info */}
                    {selectedDate && (
                        <div className="bg-card rounded-2xl  border border-border/30 p-5 animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <CalendarDays className="size-4 text-primary" />
                                <h3 className="font-bold text-sm text-foreground">Date Details</h3>
                            </div>

                            {/* Gregorian */}
                            <div className="mb-4">
                                <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Gregorian</span>
                                <p className="text-lg font-bold text-foreground mt-1">
                                    {selectedDate.gregorian.getDate()} {GREGORIAN_MONTH_NAMES_EN[selectedDate.gregorian.getMonth()]} {selectedDate.gregorian.getFullYear()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedDate.gregorian.toLocaleDateString('id', { weekday: 'long' })} {selectedDate.pasaran}
                                </p>
                            </div>

                            <div className="h-px bg-border/40 my-3" />

                            {/* Javanese */}
                            <div className="mb-4">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <Sparkles className="size-3 text-amber-500" />
                                    <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Javanese</span>
                                </div>
                                <p className="text-base font-bold text-foreground">
                                    {selectedDate.javanese.day} {selectedDate.javanese.monthName} {selectedDate.javanese.year}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Year {selectedDate.javanese.yearName} · Windu {selectedDate.javanese.windu}
                                </p>
                            </div>

                            <div className="h-px bg-border/40 my-3" />

                            {/* Hijri */}
                            <div className="mb-2">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <Moon className="size-3 text-emerald-500" />
                                    <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Hijri</span>
                                </div>
                                <p className="text-base font-bold text-foreground">
                                    {selectedDate.hijri.day} {selectedDate.hijri.monthName} {selectedDate.hijri.year} H
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5"
                                    style={{ fontFamily: "'Noto Naskh Arabic', 'Amiri', serif" }}
                                >
                                    {toEasternArabic(selectedDate.hijri.day)} {selectedDate.hijri.monthName} {toEasternArabic(selectedDate.hijri.year)}
                                </p>
                            </div>

                            <div className="h-px bg-border/40 my-3" />

                            {/* Pasaran Info */}
                            <div>
                                <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Pasaran</span>
                                <div className="flex gap-1.5 mt-2">
                                    {(['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'] as const).map((p) => (
                                        <span
                                            key={p}
                                            className={cn(
                                                'text-2xs font-semibold px-2 py-1 rounded-md transition-colors',
                                                selectedDate.pasaran === p
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted/50 text-muted-foreground/60'
                                            )}
                                        >
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>


                        </div>
                    )}

                    {/* Legend Card */}
                    {/* <div className="bg-card rounded-2xl  border border-border/30 p-5">
                        <h3 className="font-bold text-sm text-foreground mb-3">Keterangan</h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-12 rounded-lg border border-primary/50 bg-primary/5 flex flex-col items-start justify-between p-1 shrink-0 relative">
                                    <span className="text-xs font-extrabold text-foreground">5</span>
                                    <span className="text-[7px] font-bold text-muted-foreground uppercase">12 Pon</span>
                                    <span className="absolute top-0.5 right-1 text-[8px] text-muted-foreground/40" style={{ fontFamily: "'Noto Naskh Arabic', serif" }}>١٢</span>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                    <p><span className="font-bold text-foreground">5</span> = Tanggal Masehi</p>
                                    <p><span className="font-bold" style={{ fontFamily: "'Noto Naskh Arabic', serif" }}>١٢</span> = Tgl Hijriyah (Arab)</p>
                                    <p><span className="font-bold text-muted-foreground">12 PON</span> = Tgl Jawa + Pasaran</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="size-3 rounded-full bg-rose-500" />
                                <span className="text-xs text-muted-foreground">Minggu / Libur</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="size-3 rounded-full bg-primary" />
                                <span className="text-xs text-muted-foreground">Ada Task Target</span>
                            </div>
                        </div>
                    </div> */}

                    {/* Selected Date Summary */}
                    {selectedDate && (() => {
                        const stDateKey = `${selectedDate.gregorian.getFullYear()}-${(selectedDate.gregorian.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.gregorian.getDate().toString().padStart(2, '0')}`
                        const selectedHolidays = holidays.filter(h => h.date === stDateKey)
                        const selectedTasks = tasks.filter(t => t.due_date === stDateKey)

                        return (
                            <div className="bg-card rounded-2xl border border-border/30 p-5">
                                <h3 className="font-bold text-sm text-foreground mb-4">
                                    Information
                                </h3>

                                <div className="space-y-6">
                                    {/* Selected Date Holidays */}
                                    <div>
                                        <span className="text-2xs font-semibold text-rose-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                            <CalendarDays className="size-3" />
                                            Holidays
                                        </span>
                                        {selectedHolidays.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic">No holidays on this date.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {selectedHolidays.map((h, i) => (
                                                    <div key={i} className="flex gap-3 items-center bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                                                        <span className="text-xs font-medium text-foreground">{h.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Date Tasks */}
                                    <div>
                                        <span className="text-2xs font-semibold text-primary uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                            <CheckCircle2 className="size-3" />
                                            Tasks Due
                                        </span>
                                        {selectedTasks.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic">No tasks due on this date.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {selectedTasks.map((t) => (
                                                    <div key={t.id} className="flex items-start gap-2 bg-primary/5 p-2 rounded-lg border border-primary/10">
                                                        <CheckCircle2 className={cn("size-3.5 mt-0.5 shrink-0", t.status === 'done' ? 'text-emerald-500' : 'text-primary')} />
                                                        <div className="min-w-0">
                                                            <p className={cn("text-xs font-semibold truncate", t.status === 'done' && 'line-through text-muted-foreground')}>
                                                                {t.title}
                                                            </p>
                                                            {t.project_id && (
                                                                <span className="text-2xs text-muted-foreground truncate block opacity-70 mt-0.5">Project Task</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })()}
                </div>
            </div>
        </div>
    )
}
