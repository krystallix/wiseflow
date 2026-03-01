'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/animate-ui/components/radix/sheet'
import {
    Tabs,
    TabsContent,
    TabsContents,
    TabsList,
    TabsTrigger,
} from '@/components/animate-ui/components/animate/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
    Clock, Star, MoreHorizontal,
    Zap, CalendarDays, Tag,
    MessageCircle, Paperclip,
    CheckCircle2, Circle, Send, UploadCloud, X,
    FileText, Image as ImageIcon, Loader2,
    ArrowUp, ArrowRight, ArrowDown,
    CheckSquare, AlignLeft, Edit2, Trash2,
} from 'lucide-react'
import { type Task } from '@/lib/supabase/tasks'
import { type TaskStatus, type TaskPriority } from '@/lib/dummy-data'
import {
    type TaskComment,
    type TaskAttachment,
    getTaskComments,
    addTaskComment,
    deleteTaskComment,
    getTaskAttachments,
    uploadTaskAttachment,
    deleteTaskAttachment,
    updateSubtaskStatus,
    deleteTaskCascade,
} from '@/lib/supabase/task-interactions'

// ─── Config ────────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<TaskStatus, string> = {
    todo: 'bg-blue-400',
    in_progress: 'bg-amber-400',
    done: 'bg-green-400',
    cancel: 'bg-rose-400',
}
const STATUS_PILL: Record<TaskStatus, string> = {
    todo: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
    in_progress: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    done: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300',
    cancel: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
}
const STATUS_LABEL: Record<TaskStatus, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
    cancel: 'Cancelled',
}

const PRIORITY_PILL: Record<TaskPriority, string> = {
    High: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
    Medium: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    Low: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
}
const PRIORITY_ICON: Record<TaskPriority, React.ElementType> = {
    High: ArrowUp, Medium: ArrowRight, Low: ArrowDown,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDateLong(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
    })
}

function formatDateTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        + '   '
        + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function isImageUrl(url: string) {
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(url)
}

// ─── Property Row ─────────────────────────────────────────────────────────────

function PropRow({
    icon: Icon,
    label,
    children,
}: {
    icon: React.ElementType
    label: string
    children: React.ReactNode
}) {
    return (
        <div className="flex items-start gap-4 py-2 border-b border-border/30 last:border-0">
            <div className="flex items-center gap-2.5 w-[140px] shrink-0 text-muted-foreground">
                <Icon className="size-4 shrink-0" />
                <span className="text-[13px] font-medium">{label}</span>
            </div>
            <div className="flex-1 min-w-0 flex items-center flex-wrap gap-1.5">
                {children}
            </div>
        </div>
    )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskDetailSheetProps {
    task: Task | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onDelete?: (taskId: string) => void
    onEdit?: (task: Task) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskDetailSheet({
    task,
    open,
    onOpenChange,
    onDelete,
    onEdit,
}: TaskDetailSheetProps) {
    const attachInputRef = useRef<HTMLInputElement>(null)
    const [activeTab, setActiveTab] = useState<'comments' | 'attachments'>('comments')

    const [liveTask, setLiveTask] = useState<Task | null>(task)
    const [deletingTask, setDeletingTask] = useState(false)

    useEffect(() => {
        setLiveTask(task)
    }, [task])

    const [comments, setComments] = useState<TaskComment[]>([])
    const [commentsLoading, setCommentsLoading] = useState(false)
    const [commentInput, setCommentInput] = useState('')
    const [commentSending, setCommentSending] = useState(false)
    const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

    const [attachments, setAttachments] = useState<TaskAttachment[]>([])
    const [attachmentsLoading, setAttachmentsLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [deletingAttachId, setDeletingAttachId] = useState<string | null>(null)

    const fetchComments = useCallback(async (taskId: string) => {
        setCommentsLoading(true)
        try { setComments(await getTaskComments(taskId)) }
        catch (err) { console.error(err) }
        finally { setCommentsLoading(false) }
    }, [])

    const fetchAttachments = useCallback(async (taskId: string) => {
        setAttachmentsLoading(true)
        try { setAttachments(await getTaskAttachments(taskId)) }
        catch (err) { console.error(err) }
        finally { setAttachmentsLoading(false) }
    }, [])

    useEffect(() => {
        if (open && task?.id) {
            fetchComments(task.id)
            fetchAttachments(task.id)
        }
    }, [open, task?.id, fetchComments, fetchAttachments])

    useEffect(() => {
        if (!open) {
            setComments([])
            setAttachments([])
            setCommentInput('')
            setActiveTab('comments')
        }
    }, [open])

    if (!liveTask) return null

    const PriorityIcon = PRIORITY_ICON[liveTask.priority]
    const doneSubtasks = (liveTask.subtasks ?? []).filter(s => s.is_done).length
    const totalSubtasks = (liveTask.subtasks ?? []).length
    const progress = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0

    async function handleSendComment() {
        if (!commentInput.trim() || !task) return
        setCommentSending(true)
        try {
            const c = await addTaskComment(task.id, commentInput.trim())
            setComments(prev => [c, ...prev])
            setCommentInput('')
        } catch (err) { console.error(err) }
        finally { setCommentSending(false) }
    }

    async function handleDeleteComment(id: string) {
        setDeletingCommentId(id)
        try {
            await deleteTaskComment(id)
            setComments(prev => prev.filter(c => c.id !== id))
        } catch (err) { console.error(err) }
        finally { setDeletingCommentId(null) }
    }

    async function handleAttachFile(file: File) {
        if (!task) return
        setUploading(true)
        try {
            const a = await uploadTaskAttachment(file, task.id)
            setAttachments(prev => [a, ...prev])
        } catch (err) { console.error(err) }
        finally {
            setUploading(false)
            if (attachInputRef.current) attachInputRef.current.value = ''
        }
    }

    async function handleDeleteAttachment(a: TaskAttachment) {
        setDeletingAttachId(a.id)
        try {
            await deleteTaskAttachment(a.id, a.file_url)
            setAttachments(prev => prev.filter(x => x.id !== a.id))
        } catch (err) { console.error(err) }
        finally { setDeletingAttachId(null) }
    }

    async function handleToggleSubtask(subtaskId: string, currentDone: boolean) {
        if (!liveTask) return
        const newDone = !currentDone

        // Optimistic UI update
        const newSubtasks = (liveTask.subtasks ?? []).map(s =>
            s.id === subtaskId ? { ...s, is_done: newDone } : s
        )
        const updatedTask = { ...liveTask, subtasks: newSubtasks }
        setLiveTask(updatedTask)
        // Also inform parent so other views update instantly if possible
        onEdit?.(updatedTask)

        try {
            await updateSubtaskStatus(subtaskId, newDone)
        } catch (err) {
            console.error('Failed to toggle subtask', err)
            // Revert on error
            setLiveTask(liveTask)
            onEdit?.(liveTask)
        }
    }

    async function handleDeleteTask() {
        if (!task?.id) return
        if (!confirm('Are you sure you want to delete this task? All subtasks, comments, and attachments will be deleted.')) return
        setDeletingTask(true)
        try {
            await deleteTaskCascade(task.id)
            onDelete?.(task.id)
            onOpenChange(false)
        } catch (err) {
            console.error('Failed to delete task', err)
            alert('Failed to delete task.')
        } finally {
            setDeletingTask(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="w-[520px] !max-w-[520px] flex flex-col p-0 gap-0 overflow-hidden"
            >
                <SheetHeader className="sr-only">
                    <SheetTitle>Task Details</SheetTitle>
                </SheetHeader>

                {/* ── Top action bar ── */}
                <div className="flex items-center justify-between px-2 pt-3 pb-2 shrink-0">
                    {/* Close */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => onOpenChange(false)}
                        aria-label="Close"
                    >
                        <X className="size-4" />
                    </Button>

                    {/* Right actions */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            aria-label="Edit Task"
                            onClick={() => liveTask && onEdit?.(liveTask)}
                        >
                            <Edit2 className="size-[15px]" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            aria-label="Delete Task"
                            onClick={handleDeleteTask}
                            disabled={deletingTask}
                        >
                            {deletingTask ? <Loader2 className="size-[15px] animate-spin" /> : <Trash2 className="size-[15px]" />}
                        </Button>
                    </div>
                </div>

                {/* ── Scrollable body ── */}
                <div className="flex-1 overflow-y-auto px-6 pb-8">

                    {/* Cover */}
                    {liveTask.cover_url && (
                        <div className="relative group mb-5">
                            <img
                                src={liveTask.cover_url}
                                alt="Cover"
                                className="w-full h-[140px] shadow-sm object-cover rounded-xl"
                            />
                        </div>
                    )}

                    {/* Title & Description */}
                    <div className="mb-3">
                        <h1 className="text-lg font-bold leading-tight text-foreground">
                            {liveTask.title}
                        </h1>
                        {liveTask.description && (
                            <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">
                                {liveTask.description}
                            </p>
                        )}
                    </div>

                    {/* ── Properties ── */}
                    <div className="flex flex-col ">
                        {/* Created */}
                        <PropRow icon={Clock} label="Created time">
                            <span className="text-[13.5px] text-foreground/80 font-normal">
                                {formatDateTime(liveTask.created_at)}
                            </span>
                        </PropRow>

                        {/* Status */}
                        <PropRow icon={Zap} label="Status">
                            <span className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold',
                                STATUS_PILL[liveTask.status]
                            )}>
                                <span className={cn('size-1.5 rounded-full shrink-0', STATUS_DOT[liveTask.status])} />
                                {STATUS_LABEL[liveTask.status]}
                            </span>
                        </PropRow>

                        {/* Priority */}
                        <PropRow icon={PriorityIcon} label="Priority">
                            <span className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold',
                                PRIORITY_PILL[liveTask.priority]
                            )}>
                                <PriorityIcon className="size-3 shrink-0" />
                                {liveTask.priority}
                            </span>
                        </PropRow>

                        {/* Due Date */}
                        <PropRow icon={CalendarDays} label="Due Date">
                            {liveTask.due_date ? (
                                <span className="text-[13.5px] text-foreground/80 font-normal">
                                    {formatDateLong(liveTask.due_date)}
                                </span>
                            ) : (
                                <span className="text-[13px] text-muted-foreground/40">Not set</span>
                            )}
                        </PropRow>

                        {/* Category / Tags */}
                        {liveTask.category && (
                            <PropRow icon={Tag} label="Tags">
                                {liveTask.category.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                                    <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border/60 text-[12px] font-medium text-muted-foreground bg-muted/20">
                                        {t}
                                    </span>
                                ))}
                            </PropRow>
                        )}

                        {/* Subtasks */}
                        {totalSubtasks > 0 && (
                            <PropRow icon={CheckSquare} label="Subtasks">
                                <div className="flex-1 flex flex-col gap-2 w-full">
                                    <div className="flex items-center gap-2">
                                        <Progress value={progress} className="flex-1 h-[3px]" />
                                        <span className="text-[11px] text-muted-foreground font-semibold shrink-0">
                                            {doneSubtasks}/{totalSubtasks}
                                        </span>
                                    </div>
                                    <ul className="flex flex-col gap-1">
                                        {(liveTask.subtasks ?? []).map(sub => (
                                            <li key={sub.id} className="flex items-center gap-2 group/sub">
                                                <button
                                                    onClick={() => handleToggleSubtask(sub.id, sub.is_done)}
                                                    className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full shrink-0"
                                                >
                                                    {sub.is_done
                                                        ? <CheckCircle2 className="size-4 text-green-500 hover:text-green-600 transition-colors" />
                                                        : <Circle className="size-4 text-muted-foreground/30 group-hover/sub:text-primary/50 transition-colors" />
                                                    }
                                                </button>
                                                <span className={cn('text-[13px] transition-colors', sub.is_done && 'line-through text-muted-foreground')}>
                                                    {sub.title}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </PropRow>
                        )}
                    </div>

                    <Separator className="mt-2 mb-4" />

                    {/* ── Tabs: Comments / Attachments ── */}
                    <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="flex flex-col flex-1 min-h-0">
                        <div className="border-b border-border/30 mb-5 pb-2 pt-1 px-1">
                            <TabsList className="w-fit">
                                <TabsTrigger value="comments" className="text-xs px-4">
                                    <MessageCircle className="size-3.5 mr-1" />
                                    Comments
                                    {comments.length > 0 && (
                                        <span className="bg-muted rounded-full px-1.5 ml-1.5 text-[10px] font-bold text-muted-foreground">{comments.length}</span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="attachments" className="text-xs px-4">
                                    <Paperclip className="size-3.5 mr-1" />
                                    Attachments
                                    {attachments.length > 0 && (
                                        <span className="bg-muted rounded-full px-1.5 ml-1.5 text-[10px] font-bold text-muted-foreground">{attachments.length}</span>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContents className="flex-1 w-full flex flex-col min-h-0 relative">
                            {/* ── Comments ── */}
                            <TabsContent value="comments" className="flex flex-col gap-3">
                                <div className="flex flex-col gap-2">
                                    <Textarea
                                        placeholder="Write a comment… (Ctrl+Enter to send)"
                                        value={commentInput}
                                        onChange={e => setCommentInput(e.target.value)}
                                        rows={3}
                                        className="resize-none text-sm outline-none focus-visible:ring-0 px-3 py-2"
                                        disabled={commentSending}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                                e.preventDefault()
                                                handleSendComment()
                                            }
                                        }}
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            onClick={handleSendComment}
                                            disabled={!commentInput.trim() || commentSending}
                                            className="h-8 px-3 text-xs"
                                        >
                                            {commentSending
                                                ? <Loader2 className="size-3 mr-1.5 animate-spin" />
                                                : <Send className="size-3 mr-1.5" />
                                            }
                                            Send
                                        </Button>
                                    </div>
                                </div>

                                {commentsLoading ? (
                                    <div className="flex flex-col gap-2">
                                        {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="flex flex-col items-center gap-1.5 py-10 text-muted-foreground/40">
                                        <MessageCircle className="size-9 stroke-[1.2]" />
                                        <p className="text-xs font-medium">No comments yet</p>
                                    </div>
                                ) : (
                                    <ul className="flex flex-col gap-2.5">
                                        {comments.map(c => (
                                            <li key={c.id} className="group flex flex-col gap-1 bg-muted/30 rounded-xl px-3.5 py-3 border border-border/30">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11.5px] font-semibold text-foreground">
                                                        {c.user_id.slice(0, 8)}…
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-muted-foreground">{formatDateLong(c.created_at)}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                                            onClick={() => handleDeleteComment(c.id)}
                                                            disabled={deletingCommentId === c.id}
                                                        >
                                                            {deletingCommentId === c.id
                                                                ? <Loader2 className="size-2.5 animate-spin" />
                                                                : <X className="size-2.5" />
                                                            }
                                                        </Button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </TabsContent>

                            {/* ── Attachments ── */}
                            <TabsContent value="attachments" className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    disabled={uploading}
                                    onClick={() => attachInputRef.current?.click()}
                                    className={cn(
                                        'w-full h-[76px] rounded-xl border-2 border-dashed border-border/50 bg-muted/10',
                                        'flex flex-col items-center justify-center gap-1.5 transition-all',
                                        'text-muted-foreground hover:bg-muted/30 hover:border-foreground/20 hover:text-foreground',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed'
                                    )}
                                >
                                    {uploading ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
                                    <span className="text-xs font-medium">{uploading ? 'Uploading…' : 'Click to attach a file'}</span>
                                </button>
                                <input
                                    ref={attachInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={e => {
                                        const file = e.target.files?.[0]
                                        if (file) handleAttachFile(file)
                                    }}
                                />

                                {attachmentsLoading ? (
                                    <div className="flex flex-col gap-2">
                                        {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                                    </div>
                                ) : attachments.length === 0 ? (
                                    <div className="flex flex-col items-center gap-1.5 py-10 text-muted-foreground/40">
                                        <Paperclip className="size-9 stroke-[1.2]" />
                                        <p className="text-xs font-medium">No attachments yet</p>
                                    </div>
                                ) : (
                                    <ul className="flex flex-col gap-2">
                                        {attachments.map(a => (
                                            <li key={a.id} className="group flex items-center gap-3 rounded-xl px-3.5 py-3 border border-border/30 bg-muted/10 hover:bg-muted/30 transition-colors">
                                                <div className="shrink-0">
                                                    {isImageUrl(a.file_url)
                                                        ? <ImageIcon className="size-4 text-blue-400" />
                                                        : <FileText className="size-4 text-muted-foreground" />
                                                    }
                                                </div>
                                                {isImageUrl(a.file_url) && (
                                                    <img src={a.file_url} alt={a.file_name} className="h-9 w-9 object-cover rounded-md border border-border/30 shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[12.5px] font-semibold text-foreground truncate">{a.file_name}</p>
                                                    <p className="text-[10.5px] text-muted-foreground">
                                                        {a.file_size ? formatBytes(a.file_size) : '—'} · {formatDateLong(a.created_at)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={a.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        download={a.file_name}
                                                        onClick={e => e.stopPropagation()}
                                                        className="text-[10.5px] text-muted-foreground hover:text-foreground font-medium px-2 py-1 rounded hover:bg-muted transition-colors"
                                                    >
                                                        Download
                                                    </a>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        disabled={deletingAttachId === a.id}
                                                        onClick={() => handleDeleteAttachment(a)}
                                                        aria-label="Remove"
                                                    >
                                                        {deletingAttachId === a.id
                                                            ? <Loader2 className="size-3 animate-spin" />
                                                            : <X className="size-3" />
                                                        }
                                                    </Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </TabsContent>
                        </TabsContents>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    )
}
