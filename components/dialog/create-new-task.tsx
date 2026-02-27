'use client'

import { useState, useRef, useId } from 'react'
import {
    Loader2, SaveIcon,
    Circle, Timer, CheckCircle2, Ban,
    ArrowDown, ArrowRight, ArrowUp,
    CalendarIcon, Tag, AlignLeft, Type,
    ListChecks, Plus, X, GripVertical,
    CircleCheck,
} from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/animate-ui/components/radix/sheet'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/animate-ui/components/radix/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { type TaskStatus, type TaskPriority } from '@/lib/dummy-data'

// ─── Config ────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
    label: string
    value: TaskStatus
    icon: React.ElementType
    activeClass: string
}[] = [
        {
            label: 'To Do',
            value: 'todo',
            icon: Circle,
            activeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400',
        },
        {
            label: 'In Progress',
            value: 'in_progress',
            icon: Timer,
            activeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400',
        },
        {
            label: 'Done',
            value: 'done',
            icon: CheckCircle2,
            activeClass: 'bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400',
        },
        {
            label: 'Cancelled',
            value: 'cancel',
            icon: Ban,
            activeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400',
        },
    ]

const PRIORITY_OPTIONS: {
    label: string
    value: TaskPriority
    icon: React.ElementType
    activeClass: string
}[] = [
        {
            label: 'Low',
            value: 'Low',
            icon: ArrowDown,
            activeClass: 'bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400',
        },
        {
            label: 'Medium',
            value: 'Medium',
            icon: ArrowRight,
            activeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400',
        },
        {
            label: 'High',
            value: 'High',
            icon: ArrowUp,
            activeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400',
        },
    ]

// ─── Types ─────────────────────────────────────────────────────────────────────

type SubtaskDraft = {
    id: string
    title: string
    is_done: boolean
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({
    icon: Icon,
    htmlFor,
    children,
}: {
    icon: React.ElementType
    htmlFor?: string
    children: React.ReactNode
}) {
    return (
        <Label
            htmlFor={htmlFor}
            className="flex items-center gap-1.5 mb-2 text-xs font-medium text-foreground cursor-default"
        >
            <Icon className="size-3.5 text-foreground" />
            {children}
        </Label>
    )
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface CreateNewTaskProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId?: string
    defaultStatus?: TaskStatus
    onCreated?: () => void
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function CreateNewTask({
    open,
    onOpenChange,
    projectId,
    defaultStatus = 'todo',
    onCreated,
}: CreateNewTaskProps) {
    const uid = useId()
    const subtaskInputRef = useRef<HTMLInputElement>(null)

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState<TaskStatus>(defaultStatus)
    const [priority, setPriority] = useState<TaskPriority>('Medium')
    const [category, setCategory] = useState('')
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
    const [dueDateOpen, setDueDateOpen] = useState(false)
    const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([])
    const [subtaskInput, setSubtaskInput] = useState('')
    const [loading, setLoading] = useState(false)

    function reset() {
        setTitle('')
        setDescription('')
        setStatus(defaultStatus)
        setPriority('Medium')
        setCategory('')
        setDueDate(undefined)
        setSubtasks([])
        setSubtaskInput('')
    }

    function addSubtask() {
        const trimmed = subtaskInput.trim()
        if (!trimmed) return
        setSubtasks((prev) => [
            ...prev,
            { id: crypto.randomUUID(), title: trimmed, is_done: false },
        ])
        setSubtaskInput('')
        subtaskInputRef.current?.focus()
    }

    function removeSubtask(id: string) {
        setSubtasks((prev) => prev.filter((s) => s.id !== id))
    }

    function toggleSubtask(id: string) {
        setSubtasks((prev) =>
            prev.map((s) => (s.id === id ? { ...s, is_done: !s.is_done } : s)),
        )
    }

    function updateSubtaskTitle(id: string, value: string) {
        setSubtasks((prev) =>
            prev.map((s) => (s.id === id ? { ...s, title: value } : s)),
        )
    }

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!title.trim()) return
        setLoading(true)
        try {
            const payload = {
                title: title.trim(),
                description: description.trim() || null,
                status,
                priority,
                category: category.trim() || null,
                due_date: dueDate?.toISOString() ?? null,
                subtasks,
                project_id: projectId ?? null,
            }
            console.log('Task payload:', payload)
            await new Promise((r) => setTimeout(r, 600))
            onCreated?.()
            onOpenChange(false)
            reset()
        } catch (err) {
            console.error('Failed to create task:', err)
        } finally {
            setLoading(false)
        }
    }

    const doneCount = subtasks.filter((s) => s.is_done).length

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[500px] !max-w-[500px] flex flex-col p-0 gap-0"
            >
                {/* ── Header ── */}
                <SheetHeader className="border-b px-6 py-4 shrink-0">
                    <SheetTitle className="text-base">Create New Task</SheetTitle>
                    <SheetDescription className="text-xs">
                        Fill in the details below to add a task to this project.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex flex-col gap-5 px-6 py-5 flex-1 overflow-y-auto">

                        {/* ── Title ── */}
                        <div>
                            <FieldLabel icon={Type} htmlFor={`${uid}-title`}>
                                Title <span className="text-destructive ml-0.5">*</span>
                            </FieldLabel>
                            <Input
                                id={`${uid}-title`}
                                placeholder="e.g. Design landing page"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                                autoComplete="off"
                                disabled={loading}
                                className="h-9"
                            />
                        </div>

                        {/* ── Description ── */}
                        <div>
                            <FieldLabel icon={AlignLeft} htmlFor={`${uid}-desc`}>
                                Description
                            </FieldLabel>
                            <Textarea
                                id={`${uid}-desc`}
                                placeholder="Add a short description (optional)..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={loading}
                                rows={3}
                                className="resize-none min-h-0"
                            />
                        </div>

                        <Separator />

                        {/* ── Status ── */}
                        <div>
                            <FieldLabel icon={CircleCheck}>Status</FieldLabel>
                            <div className="flex flex-wrap gap-2">
                                {STATUS_OPTIONS.map((opt) => {
                                    const Icon = opt.icon
                                    const active = status === opt.value
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            disabled={loading}
                                            onClick={() => setStatus(opt.value)}
                                            className={cn(
                                                'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150',
                                                'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40',
                                                active
                                                    ? opt.activeClass
                                                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20',
                                            )}
                                        >
                                            <Icon className="size-3.5" />
                                            {opt.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* ── Priority ── */}
                        <div>
                            <FieldLabel icon={ArrowUp}>Priority</FieldLabel>
                            <div className="flex gap-2">
                                {PRIORITY_OPTIONS.map((opt) => {
                                    const Icon = opt.icon
                                    const active = priority === opt.value
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            disabled={loading}
                                            onClick={() => setPriority(opt.value)}
                                            className={cn(
                                                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all duration-150',
                                                'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40',
                                                active
                                                    ? opt.activeClass
                                                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20',
                                            )}
                                        >
                                            <Icon className="size-3.5" />
                                            {opt.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <Separator />

                        {/* ── Category + Due Date ── */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <FieldLabel icon={Tag} htmlFor={`${uid}-category`}>Category</FieldLabel>
                                <Input
                                    id={`${uid}-category`}
                                    placeholder="e.g. Front-End..."
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    autoComplete="off"
                                    disabled={loading}
                                    className="h-9"
                                />
                            </div>
                            <div>
                                <FieldLabel icon={CalendarIcon}>Due Date</FieldLabel>
                                <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={loading}
                                            className={cn(
                                                'w-full h-9 justify-start text-left font-normal',
                                                !dueDate && 'text-muted-foreground',
                                            )}
                                        >
                                            <CalendarIcon className="size-3.5 shrink-0" />
                                            {dueDate
                                                ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                : 'Pick a date'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={dueDate}
                                            onSelect={(date) => {
                                                setDueDate(date)
                                                setDueDateOpen(false)
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <Separator />

                        {/* ── Subtasks ── */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <FieldLabel icon={ListChecks}>Sub Tasks</FieldLabel>
                                {subtasks.length > 0 && (
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                        {doneCount}/{subtasks.length} done
                                    </Badge>
                                )}
                            </div>

                            {/* Subtask list */}
                            {subtasks.length > 0 && (
                                <ul className="mb-2 flex flex-col gap-1">
                                    {subtasks.map((sub) => (
                                        <li
                                            key={sub.id}
                                            className="group flex items-center gap-2 rounded-md px-2 py-1.5 border border-border bg-muted/30 hover:bg-muted/60 transition-colors"
                                        >
                                            {/* Grip handle */}
                                            <GripVertical className="size-3.5 text-muted-foreground/40 shrink-0 cursor-grab" />

                                            {/* Toggle done */}
                                            <button
                                                type="button"
                                                onClick={() => toggleSubtask(sub.id)}
                                                className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                                                aria-label={sub.is_done ? 'Mark as incomplete' : 'Mark as complete'}
                                            >
                                                {sub.is_done ? (
                                                    <CheckCircle2 className="size-4 text-green-500" />
                                                ) : (
                                                    <Circle className="size-4 text-muted-foreground/50" />
                                                )}
                                            </button>

                                            {/* Inline editable title */}
                                            <input
                                                type="text"
                                                value={sub.title}
                                                onChange={(e) => updateSubtaskTitle(sub.id, e.target.value)}
                                                disabled={loading}
                                                className={cn(
                                                    'flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground',
                                                    sub.is_done && 'line-through text-muted-foreground',
                                                )}
                                            />

                                            {/* Remove */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => removeSubtask(sub.id)}
                                                className="shrink-0 opacity-0 group-hover:opacity-100 size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                                aria-label="Remove subtask"
                                            >
                                                <X className="size-3.5" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Add subtask input */}
                            <div className="flex items-center gap-2">
                                <div className="flex-1 flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-2.5 h-9 focus-within:border-ring focus-within:bg-background transition-all">
                                    <Plus className="size-3.5 text-muted-foreground shrink-0" />
                                    <input
                                        ref={subtaskInputRef}
                                        type="text"
                                        placeholder="Add a subtask... (press Enter)"
                                        value={subtaskInput}
                                        onChange={(e) => setSubtaskInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                addSubtask()
                                            }
                                        }}
                                        disabled={loading}
                                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={addSubtask}
                                    disabled={!subtaskInput.trim() || loading}
                                    className="h-9 px-3 shrink-0"
                                >
                                    Add
                                </Button>
                            </div>
                        </div>

                    </div>

                    {/* ── Footer ── */}
                    <SheetFooter className="border-t px-6 py-4 shrink-0 flex-row justify-between items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                            {subtasks.length > 0
                                ? `${subtasks.length} subtask${subtasks.length !== 1 ? 's' : ''} · ${doneCount} done`
                                : 'No subtasks yet'}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={loading}
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={!title.trim() || loading}
                            >
                                {loading
                                    ? <Loader2 className="size-3.5 animate-spin" />
                                    : <SaveIcon className="size-3.5" />
                                }
                                Create Task
                            </Button>
                        </div>
                    </SheetFooter>
                </form>

            </SheetContent>
        </Sheet>
    )
}
