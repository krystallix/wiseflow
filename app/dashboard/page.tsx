'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Folder, Wallet, ArrowUpRight, ArrowDownLeft,
  CheckCircle2, Circle, Clock, Zap, Target,
  TrendingUp, TrendingDown, Loader2, Sparkles,
  CalendarDays, ListChecks, Banknote,
  ArrowUp, ArrowRight, ArrowDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DynamicIcon } from '@/lib/dynamic-icon'

import { getProjects, type Project } from '@/lib/supabase/projects'
import { getTasks, type Task } from '@/lib/supabase/tasks'
import {
  getWallets, getTransactions, getSavingGoals, computeSummary,
  type Wallet as WalletType, type Transaction, type SavingGoal, type FinanceSummary,
} from '@/lib/supabase/finance'
import {
  getWeeklyTasks, DAY_DAILY, type WeeklyTask,
} from '@/lib/supabase/weekly-tasks'

// ─── Helpers ────────────────────────────────────────────────────────────────

function greetByTime(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

const PRIORITY_COLOR: Record<string, string> = {
  High: 'text-rose-500',
  Medium: 'text-amber-500',
  Low: 'text-emerald-500',
}
const PRIORITY_ICON: Record<string, React.ElementType> = {
  High: ArrowUp, Medium: ArrowRight, Low: ArrowDown,
}

const STATUS_DOT: Record<string, string> = {
  todo: 'bg-blue-400',
  in_progress: 'bg-amber-400',
  done: 'bg-green-400',
  cancel: 'bg-rose-400',
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ─── Skeleton ───────────────────────────────────────────────────────────────

function DashSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center gap-3">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={cn('rounded-2xl bg-muted animate-pulse', i < 4 ? 'h-36' : 'h-48')} />
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([])
  const [wallets, setWallets] = useState<WalletType[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([])
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [p, wk, w, tx, sg] = await Promise.all([
        getProjects(),
        getWeeklyTasks(),
        getWallets(),
        getTransactions({ limit: 50 }),
        getSavingGoals(),
      ])
      setProjects(p)
      setWeeklyTasks(wk)
      setWallets(w)
      setTransactions(tx)
      setSavingGoals(sg)

      // Fetch tasks for all projects
      const taskArrays = await Promise.all(p.map(proj => getTasks(proj.id)))
      setAllTasks(taskArrays.flat())
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const generateAiInsight = useCallback(async (summary: FinanceSummary, recentTx: Transaction[]) => {
    if (loadingAi || aiInsight || summary.monthIncome === 0 && summary.monthExpense === 0) return
    setLoadingAi(true)
    try {
      const res = await fetch('/api/finance-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: { monthNet: summary.monthNet },
          monthIncome: summary.monthIncome,
          monthExpense: summary.monthExpense,
          recentTransactions: recentTx
        })
      })
      if (res.ok) {
        const data = await res.json()
        setAiInsight(data.summary)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAi(false)
    }
  }, [aiInsight, loadingAi])

  const summary: FinanceSummary = useMemo(() => computeSummary(wallets, transactions), [wallets, transactions])
  const recentTx = useMemo(() => transactions.slice(0, 5), [transactions])

  useEffect(() => {
    if (!loading && recentTx.length > 0 && summary) {
      generateAiInsight(summary, recentTx)
    }
  }, [loading, recentTx, summary, generateAiInsight])

  if (loading) return <DashSkeleton />

  // ── Computed data ──

  const today = new Date().getDay()
  const todayRoutines = weeklyTasks.filter(t => t.day_of_week === today)
  const todayPriorities = weeklyTasks.filter(t => t.day_of_week === DAY_DAILY)
  const todayAll = [...todayPriorities, ...todayRoutines]
  const todayDone = todayAll.filter(t => t.is_done).length

  const totalTasks = allTasks.length
  const doneTasks = allTasks.filter(t => t.status === 'done').length
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length
  const taskCompletionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const upcomingTasks = allTasks
    .filter(t => t.due_date && t.status !== 'done' && t.status !== 'cancel')
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5)

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4)

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            {greetByTime()}! 👋
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Here&apos;s an overview of your workspace.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg font-semibold text-muted-foreground">
            <Folder className="size-3.5" />
            {projects.length} Projects
          </div>
          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg font-semibold text-muted-foreground">
            <ListChecks className="size-3.5" />
            {totalTasks} Tasks
          </div>
        </div>
      </div>

      {/* ── Row 1: Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* AI Insight */}
        <div className="bg-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border/30 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-card relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 z-10">
              <Sparkles className="size-3.5 fill-indigo-200" /> AI Insights
            </span>
          </div>
          <div className="mt-1 flex-1 z-10 relative">
            {loadingAi ? (
              <div className="flex flex-col gap-1.5 animate-pulse">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-5/6" />
              </div>
            ) : aiInsight ? (
              <p className="text-sm font-medium text-foreground/80 leading-snug line-clamp-3">
                {aiInsight}
              </p>
            ) : (
              <p className="text-xs italic text-muted-foreground">Not enough data to analyze your habits.</p>
            )}
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="size-24" />
          </div>
        </div>

        {/* Task Completion */}
        <div className="bg-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">Tasks Done</span>
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500">
              <CheckCircle2 className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{doneTasks}<span className="text-sm font-normal text-muted-foreground">/{totalTasks}</span></div>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${taskCompletionPct}%` }} />
          </div>
          <p className="text-2xs text-muted-foreground mt-1.5">{taskCompletionPct}% complete</p>
        </div>



        {/* Total Balance */}
        <div className="bg-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">Total Balance</span>
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <Wallet className="size-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-foreground truncate">{formatCurrency(summary.totalBalance)}</div>
          <p className="text-2xs text-muted-foreground mt-1.5">{wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Month Net */}
        <div className="bg-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">This Month</span>
            <div className={cn('p-1.5 rounded-lg', summary.monthNet >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
              {summary.monthNet >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            </div>
          </div>
          <div className={cn('text-lg sm:text-2xl font-bold truncate', summary.monthNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
            {summary.monthNet >= 0 ? '+' : ''}{formatCurrency(summary.monthNet)}
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-2xs text-muted-foreground">
            <span className="text-emerald-500 flex items-center gap-0.5"><ArrowDownLeft className="size-2.5" />{formatCurrency(summary.monthIncome)}</span>
            <span className="text-rose-500 flex items-center gap-0.5"><ArrowUpRight className="size-2.5" />{formatCurrency(summary.monthExpense)}</span>
          </div>
        </div>
      </div>

      {/* ── Row 2: Main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Today's Tasks (Weekly) */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/30 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              <h3 className="font-bold text-sm">Today&apos;s Tasks</h3>
              <span className="text-2xs text-muted-foreground font-medium">{DAYS[today]}</span>
            </div>
            {todayAll.length > 0 && (
              <span className="text-2xs font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {todayDone}/{todayAll.length}
              </span>
            )}
          </div>
          {todayAll.length > 0 && (
            <div className="h-1 bg-muted rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${todayAll.length > 0 ? (todayDone / todayAll.length) * 100 : 0}%` }}
              />
            </div>
          )}
          <div className="flex-1 space-y-1 overflow-y-auto max-h-[220px]">
            {todayPriorities.length > 0 && (
              <p className="text-2xs font-semibold text-primary uppercase tracking-wider mb-1">Priorities</p>
            )}
            {todayPriorities.map(t => (
              <div key={t.id} className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg', t.is_done && 'opacity-40')}>
                {t.is_done ? <CheckCircle2 className="size-3.5 text-primary shrink-0" /> : <Circle className="size-3.5 text-muted-foreground/40 shrink-0" />}
                <span className={cn('text-xs font-medium', t.is_done && 'line-through text-muted-foreground')}>{t.title}</span>
              </div>
            ))}
            {todayRoutines.length > 0 && (
              <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-2">Routines</p>
            )}
            {todayRoutines.map(t => (
              <div key={t.id} className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg', t.is_done && 'opacity-40')}>
                {t.is_done ? <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" /> : <Circle className="size-3.5 text-muted-foreground/40 shrink-0" />}
                <span className={cn('text-xs font-medium', t.is_done && 'line-through text-muted-foreground')}>{t.title}</span>
              </div>
            ))}
            {todayAll.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
                <CalendarDays className="size-8 mb-2" />
                <p className="text-xs font-medium">No tasks for today</p>
              </div>
            )}
          </div>
          <Link href="/dashboard/weekly" className="text-xs text-primary font-semibold mt-3 hover:underline">
            View all weekly tasks →
          </Link>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/30 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="size-4 text-muted-foreground" />
            <h3 className="font-bold text-sm">Upcoming Deadlines</h3>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[260px]">
            {upcomingTasks.map(task => {
              const PIcon = PRIORITY_ICON[task.priority] ?? ArrowRight
              const dueDate = new Date(task.due_date!)
              const isOverdue = dueDate < new Date()
              return (
                <div key={task.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className={cn('size-1.5 rounded-full mt-1.5 shrink-0', STATUS_DOT[task.status])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('text-2xs font-medium flex items-center gap-0.5', PRIORITY_COLOR[task.priority])}>
                        <PIcon className="size-2.5" />{task.priority}
                      </span>
                      <span className={cn('text-2xs font-medium', isOverdue ? 'text-rose-500' : 'text-muted-foreground')}>
                        {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {isOverdue && ' (overdue)'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            {upcomingTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
                <CheckCircle2 className="size-8 mb-2" />
                <p className="text-xs font-medium">No upcoming deadlines</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/30 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Banknote className="size-4 text-muted-foreground" />
              <h3 className="font-bold text-sm">Recent Transactions</h3>
            </div>
            <Link href="/dashboard/finance" className="text-2xs text-primary font-semibold hover:underline">
              View all
            </Link>
          </div>
          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[260px]">
            {recentTx.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-muted/30 transition-colors">
                <div className={cn(
                  'size-8 rounded-lg flex items-center justify-center shrink-0',
                  tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' :
                    tx.type === 'expense' ? 'bg-rose-500/10 text-rose-500' :
                      'bg-blue-500/10 text-blue-500',
                )}>
                  {tx.type === 'income' ? <ArrowDownLeft className="size-3.5" /> :
                    tx.type === 'expense' ? <ArrowUpRight className="size-3.5" /> :
                      <ArrowRight className="size-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {tx.category?.name ?? tx.note ?? (tx.type === 'transfer' ? 'Transfer' : 'Transaction')}
                  </p>
                  <p className="text-2xs text-muted-foreground truncate">
                    {tx.wallet?.name ?? 'Unknown wallet'} · {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className={cn(
                  'text-xs font-bold shrink-0',
                  tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' :
                    tx.type === 'expense' ? 'text-rose-600 dark:text-rose-400' :
                      'text-foreground',
                )}>
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
            {recentTx.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
                <Banknote className="size-8 mb-2" />
                <p className="text-xs font-medium">No transactions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: Projects + Saving Goals ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Projects */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Folder className="size-4 text-muted-foreground" />
              <h3 className="font-bold text-sm">Recent Projects</h3>
            </div>
            <span className="text-2xs text-muted-foreground font-medium">{projects.length} total</span>
          </div>
          <div className="space-y-2">
            {recentProjects.map(proj => {
              const projTasks = allTasks.filter(t => t.project_id === proj.id)
              const projDone = projTasks.filter(t => t.status === 'done').length
              const projTotal = projTasks.length
              const projPct = projTotal > 0 ? Math.round((projDone / projTotal) * 100) : 0
              return (
                <Link
                  key={proj.id}
                  href={`/dashboard/task/${proj.slug}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors group"
                >
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/15 transition-colors">
                    <DynamicIcon name={proj.icon} className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{proj.name}</p>
                    {proj.description && (
                      <p className="text-2xs text-muted-foreground truncate mt-0.5">{proj.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {projTotal > 0 ? (
                      <>
                        <p className="text-2xs font-semibold text-muted-foreground">{projDone}/{projTotal}</p>
                        <div className="w-14 h-1 bg-muted rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${projPct}%` }} />
                        </div>
                      </>
                    ) : (
                      <p className="text-2xs text-muted-foreground/40">No tasks</p>
                    )}
                  </div>
                </Link>
              )
            })}
            {recentProjects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
                <Folder className="size-8 mb-2" />
                <p className="text-xs font-medium">No projects yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Saving Goals */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-muted-foreground" />
              <h3 className="font-bold text-sm">Saving Goals</h3>
            </div>
            <Link href="/dashboard/finance" className="text-2xs text-primary font-semibold hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {savingGoals.slice(0, 4).map(goal => {
              const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0
              return (
                <div key={goal.id} className="p-3 rounded-xl bg-muted/20 border border-border/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {goal.icon ? (
                        <DynamicIcon name={goal.icon} className="size-3.5 text-primary" />
                      ) : (
                        <Target className="size-3.5 text-primary" />
                      )}
                      <span className="text-xs font-semibold text-foreground">{goal.name}</span>
                    </div>
                    {goal.is_achieved && (
                      <span className="text-2xs font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Achieved ✓</span>
                    )}
                  </div>
                  <div className="flex justify-between text-2xs mb-1.5">
                    <span className="font-semibold text-foreground">{formatCurrency(goal.current_amount)}</span>
                    <span className="text-muted-foreground">{formatCurrency(goal.target_amount)}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', goal.is_achieved ? 'bg-emerald-500' : 'bg-primary')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-2xs text-muted-foreground mt-1">{pct}%{goal.deadline ? ` · Due ${new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}</p>
                </div>
              )
            })}
            {savingGoals.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
                <Target className="size-8 mb-2" />
                <p className="text-xs font-medium">No saving goals yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 4: Wallets overview ── */}
      {wallets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {wallets.map(w => (
            <div key={w.id} className="bg-card rounded-2xl p-4 shadow-sm border border-border/30 hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                {w.icon ? (
                  <DynamicIcon name={w.icon} className="size-3.5 text-muted-foreground" />
                ) : (
                  <Wallet className="size-3.5 text-muted-foreground" />
                )}
                <span className="text-2xs font-medium text-muted-foreground truncate">{w.name}</span>
              </div>
              <p className="text-sm font-bold text-foreground truncate">{formatCurrency(w.balance)}</p>
              <p className="text-3xs text-muted-foreground/60 mt-0.5 capitalize">{w.type}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
