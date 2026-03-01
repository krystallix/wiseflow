"use client"

import { useState, useMemo, useEffect } from "react"
import {
    ChevronDown, ChevronRight, RotateCcw, Trash2,
    CalendarDays, CheckSquare, ArrowUp, ArrowRight, ArrowDown, Hash,
    CircleDashed, Circle, Timer, CheckCircle2, XCircle
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { DynamicIcon } from "@/lib/dynamic-icon"

const statusConfig: Record<string, { label: string; style: string; icon: React.ElementType }> = {
    todo: { label: 'To Do', style: 'bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20', icon: Circle },
    in_progress: { label: 'On Progress', style: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20', icon: Timer },
    done: { label: 'Done', style: 'bg-green-500/10 text-green-500 hover:bg-green-500/20', icon: CheckCircle2 },
    cancel: { label: 'Cancel', style: 'bg-red-500/10 text-destructive hover:bg-red-500/20', icon: XCircle },
};

const priorityConfig: Record<string, { style: string; icon: React.ElementType }> = {
    High: { style: 'bg-red-500/10 text-destructive dark:text-red-400 hover:bg-red-500/20', icon: ArrowUp },
    Medium: { style: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20', icon: ArrowRight },
    Low: { style: 'bg-background border border-border/80 text-muted-foreground hover:bg-muted/50', icon: ArrowDown },
};

const categoryConfig: Record<string, { style: string }> = {
    'Back-End': { style: 'bg-blue-500/10 text-primary dark:text-blue-400 hover:bg-blue-500/20' },
    'Front-End': { style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20' },
    'UI/UX Design': { style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20' },
};

// ─── Types & Component ─────────────────────────────────────────────────────────

type TaskSubtask = {
    id: string
    is_done: boolean
}

type DeletedTask = {
    id: string
    title: string
    description?: string | null
    category?: string | null
    priority?: string | null
    status?: string | null
    due_date?: string | null
    project_id: string | null
    deleted_at: string
    project?: { id: string; name: string; icon?: string | null } | null
    subtasks?: TaskSubtask[]
}

type DeletedProject = {
    id: string
    name: string
    icon?: string | null
    deleted_at: string
}

type Group = {
    projectId: string
    projectName: string
    projectIcon: string | null
    isProjectDeleted: boolean
    tasks: DeletedTask[]
}

export function TrashClient({
    initialTasks,
    initialProjects
}: {
    initialTasks: any[]
    initialProjects: any[]
}) {
    const router = useRouter()
    const [tasks, setTasks] = useState<DeletedTask[]>(initialTasks)
    const [projects, setProjects] = useState<DeletedProject[]>(initialProjects)

    useEffect(() => {
        setTasks(initialTasks)
        setProjects(initialProjects)
    }, [initialTasks, initialProjects])

    useEffect(() => {
        const handleProjectUpdated = () => {
            router.refresh()
        }
        window.addEventListener('project-updated', handleProjectUpdated)
        return () => window.removeEventListener('project-updated', handleProjectUpdated)
    }, [router])

    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
    const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())

    const [loading, setLoading] = useState(false)

    const groups = useMemo(() => {
        const groupMap = new Map<string, Group>()

        for (const p of projects) {
            groupMap.set(p.id, {
                projectId: p.id,
                projectName: p.name,
                projectIcon: p.icon || 'folder',
                isProjectDeleted: true,
                tasks: []
            })
        }

        for (const t of tasks) {
            const pid = t.project_id || 'unassigned'
            const pName = t.project ? t.project.name : (t.project_id ? 'Unknown Project' : 'No Project')
            const pIcon = t.project?.icon || 'folder'

            if (!groupMap.has(pid)) {
                groupMap.set(pid, {
                    projectId: pid,
                    projectName: pName,
                    projectIcon: pIcon,
                    isProjectDeleted: false,
                    tasks: []
                })
            }
            groupMap.get(pid)!.tasks.push(t)
        }

        return Array.from(groupMap.values())
    }, [tasks, projects])

    const toggleTask = (id: string, checked: boolean) => {
        const next = new Set(selectedTasks)
        if (checked) { next.add(id) } else { next.delete(id) }
        setSelectedTasks(next)
    }

    const toggleProject = (id: string, checked: boolean) => {
        const next = new Set(selectedProjects)
        if (checked) { next.add(id) } else { next.delete(id) }
        setSelectedProjects(next)

        // When checking project, check all its tasks
        const group = groups.find(g => g.projectId === id)
        if (group) {
            const nextTasks = new Set(next.has(id) ? selectedTasks : new Set(selectedTasks)) // shallow copy trick handled below

            const ns = new Set(selectedTasks)
            if (checked) {
                group.tasks.forEach(t => ns.add(t.id))
            } else {
                group.tasks.forEach(t => ns.delete(t.id))
            }
            setSelectedTasks(ns)
        }
    }

    const restoreSelected = async () => {
        setLoading(true)
        const supabase = createClient()
        try {
            if (selectedProjects.size > 0) {
                await supabase
                    .schema('risenwise')
                    .from('projects')
                    .update({ deleted_at: null })
                    .in('id', Array.from(selectedProjects))
            }
            if (selectedTasks.size > 0) {
                await supabase
                    .schema('risenwise')
                    .from('tasks')
                    .update({ deleted_at: null })
                    .in('id', Array.from(selectedTasks))
            }

            setProjects(prev => prev.filter(p => !selectedProjects.has(p.id)))
            setTasks(prev => prev.filter(t => !selectedTasks.has(t.id)))
            setSelectedProjects(new Set())
            setSelectedTasks(new Set())
            window.dispatchEvent(new CustomEvent('project-updated'))
            router.refresh()
        } catch (e) {
            console.error(e)
            alert("Failed to restore items")
        } finally {
            setLoading(false)
        }
    }

    const permanentDeleteSelected = async () => {
        if (!confirm("Are you sure you want to permanently delete these items?")) return
        setLoading(true)
        const supabase = createClient()
        try {
            if (selectedTasks.size > 0) {
                await supabase
                    .schema('risenwise')
                    .from('tasks')
                    .delete()
                    .in('id', Array.from(selectedTasks))
            }
            if (selectedProjects.size > 0) {
                await supabase
                    .schema('risenwise')
                    .from('projects')
                    .delete()
                    .in('id', Array.from(selectedProjects))
            }

            setProjects(prev => prev.filter(p => !selectedProjects.has(p.id)))
            setTasks(prev => prev.filter(t => !selectedTasks.has(t.id)))
            setSelectedProjects(new Set())
            setSelectedTasks(new Set())
            router.refresh()
        } catch (e) {
            console.error(e)
            alert("Failed to permanently delete items")
        } finally {
            setLoading(false)
        }
    }

    const isAnySelected = selectedTasks.size > 0 || selectedProjects.size > 0

    return (
        <>
            <div className="flex justify-between items-center shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Trash2 className="size-7" />
                        <h1 className="font-bold text-3xl">Trash</h1>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Items will be permanently deleted from the bin after 30 days                    </p>
                </div>
                <div className="flex gap-4 mb-2">
                    <Button variant="outline" size="sm" onClick={restoreSelected} disabled={!isAnySelected || loading} className="gap-2">
                        <RotateCcw className="w-4 h-4" /> Restore
                    </Button>
                    <Button variant="destructive" size="sm" onClick={permanentDeleteSelected} disabled={!isAnySelected || loading} className="gap-2">
                        <Trash2 className="w-4 h-4" /> Delete Forever
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-card rounded-md shadow-sm border">
                <div className="w-full flex-1 overflow-y-auto min-h-0">
                    {groups.length === 0 ? (
                        <div className="flex flex-col w-full h-full items-center justify-center p-8 text-muted-foreground">
                            <Trash2 className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm font-medium">No items in trash</p>
                        </div>
                    ) : (
                        <div className="flex flex-col w-full h-full">
                            {groups.map(g => (
                                <ProjectGroupRow
                                    key={g.projectId}
                                    group={g}
                                    selectedTasks={selectedTasks}
                                    selectedProjects={selectedProjects}
                                    onToggleTask={toggleTask}
                                    onToggleProject={toggleProject}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

function ProjectGroupRow({
    group,
    selectedTasks,
    selectedProjects,
    onToggleTask,
    onToggleProject
}: {
    group: Group
    selectedTasks: Set<string>
    selectedProjects: Set<string>
    onToggleTask: (id: string, checked: boolean) => void
    onToggleProject: (id: string, checked: boolean) => void
}) {
    const [open, setOpen] = useState(true)

    // Check if project is available to be selected as a deleted project
    const hasProjectCheckbox = group.isProjectDeleted && group.projectId !== 'unassigned'

    return (
        <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col border-b last:border-0 border-border/40">
            {/* Header / Project Row */}
            <div
                className="flex items-center justify-between py-3 px-4 hover:bg-muted/30 transition-colors w-full cursor-pointer"
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center gap-3">
                    {hasProjectCheckbox ? (
                        <Checkbox
                            id={`proj-${group.projectId}`}
                            checked={selectedProjects.has(group.projectId)}
                            onCheckedChange={(c) => onToggleProject(group.projectId, !!c)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <div className="w-4 h-4 shrink-0" />
                    )}
                    <div className="flex items-center gap-2">
                        {group.projectIcon && <div className="text-muted-foreground size-4 flex items-center justify-center"><DynamicIcon name={group.projectIcon} /></div>}
                        <span className="font-semibold text-base">{group.projectName}</span>
                    </div>
                </div>

                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 transition-transform">
                        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                </CollapsibleTrigger>
            </div>

            {/* Content / Tasks Row */}
            <CollapsibleContent className="flex flex-col">
                {group.tasks.map((t, idx) => {
                    const categoryLabel = t.category || ''
                    const category = categoryConfig[categoryLabel] || { style: '' }

                    const priorityLabel = t.priority || 'Low'
                    const priority = priorityConfig[priorityLabel] || priorityConfig['Low']
                    const PriorityIcon = priority.icon

                    const statusValue = t.status || 'todo'
                    const status = statusConfig[statusValue] || statusConfig['todo']
                    const StatusIcon = status.icon

                    const doneSubtasks = (t.subtasks || []).filter(s => s.is_done).length
                    const totalSubtasks = (t.subtasks || []).length

                    return (
                        <div
                            key={t.id}
                            onClick={() => onToggleTask(t.id, !selectedTasks.has(t.id))}
                            className={cn("grid grid-cols-[auto_3fr_1fr_1fr_1fr_1.5fr_1fr] gap-4 items-center h-12 px-4 hover:bg-muted/30 transition-colors min-w-[800px] cursor-pointer", idx !== group.tasks.length - 1 && "border-b border-border/30")}
                        >
                            {/* Checkbox */}
                            <Checkbox
                                id={`task-${t.id}`}
                                checked={selectedTasks.has(t.id)}
                                onCheckedChange={(c) => onToggleTask(t.id, !!c)}
                                onClick={(e) => e.stopPropagation()}
                            />

                            {/* Title & Description */}
                            <div className="flex flex-col gap-0.5 h-[38px] justify-center min-w-0 pr-4">
                                <h4 className={cn("font-semibold text-foreground text-[13px] truncate leading-tight", !t.description && "h-full flex items-center")}>
                                    {t.title}
                                </h4>
                                {t.description && (
                                    <p className="text-[11px] text-muted-foreground truncate font-medium leading-tight">
                                        {t.description}
                                    </p>
                                )}
                            </div>

                            {/* Category */}
                            <div className="flex items-center">
                                {categoryLabel ? (
                                    <Badge variant="secondary" className={cn("rounded-md font-semibold px-2 py-0.5 text-[11px] border-transparent transition-colors flex items-center gap-1 w-fit", category.style)}>
                                        <Hash className="size-2.5 shrink-0" />
                                        {categoryLabel}
                                    </Badge>
                                ) : (
                                    <span className="text-[11px] text-muted-foreground/40">—</span>
                                )}
                            </div>

                            {/* Priority */}
                            <div className="flex items-center">
                                <Badge variant="secondary" className={cn("rounded-md font-semibold px-2 py-0.5 text-[11px] border-transparent transition-colors flex items-center gap-1 w-fit", priority.style)}>
                                    <PriorityIcon className="size-3 shrink-0" />
                                    {priorityLabel}
                                </Badge>
                            </div>

                            {/* Status */}
                            <div className="flex items-center">
                                <Badge variant="secondary" className={cn("rounded-md font-semibold px-2 py-0.5 text-[11px] border-transparent transition-colors flex items-center gap-1 w-fit", status.style)}>
                                    <StatusIcon className="size-3 shrink-0" />
                                    {status.label}
                                </Badge>
                            </div>

                            {/* Subtasks */}
                            <div className="flex items-center pr-2">
                                {totalSubtasks > 0 ? (
                                    <div className="flex items-center gap-2 w-full max-w-[120px]">
                                        <CheckSquare className="size-3.5 text-primary shrink-0" />
                                        <Progress value={(doneSubtasks / totalSubtasks) * 100} className="h-1 flex-1" />
                                        <span className="text-[10px] font-semibold text-muted-foreground w-6 text-right shrink-0">{doneSubtasks}/{totalSubtasks}</span>
                                    </div>
                                ) : (
                                    <span className="text-[11px] text-muted-foreground/40">—</span>
                                )}
                            </div>

                            {/* Due Date */}
                            <div className="flex items-center">
                                {t.due_date ? (
                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground truncate">
                                        <CalendarDays className="size-3.5 shrink-0" />
                                        {new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                ) : (
                                    <span className="text-[11px] text-muted-foreground/40">—</span>
                                )}
                            </div>
                        </div>
                    )
                })}
                {group.tasks.length === 0 && group.isProjectDeleted && (
                    <div className="text-sm text-muted-foreground pl-11 py-3 border-t border-border/30">
                        No deleted tasks in this project.
                    </div>
                )}
            </CollapsibleContent>
        </Collapsible>
    )
}
