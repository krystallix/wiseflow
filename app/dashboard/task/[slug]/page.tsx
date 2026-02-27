"use client";

import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, List, Plus, RefreshCw, Upload, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tabs,
    TabsContent,
    TabsContents,
    TabsList,
    TabsTrigger,
} from '@/components/animate-ui/components/animate/tabs';
const KanbanView = dynamic(() => import('@/components/dash/KanbanView'), { ssr: false });
import ListView from "@/components/dash/ListView";
import { type TaskStatus } from "@/lib/dummy-data";
import { getProjectBySlug, type Project } from "@/lib/supabase/projects";
import { getTasks, type Task } from "@/lib/supabase/tasks";
import { DynamicIcon } from "@/lib/dynamic-icon";
import CreateNewTask from "@/components/dialog/create-new-task";
import TaskDetailSheet from '@/components/dialog/task-detail-sheet';

// ─── Helper ────────────────────────────────────────────────────────────────────

const EMPTY_COLUMNS: Record<TaskStatus, Task[]> = {
    todo: [],
    in_progress: [],
    done: [],
    cancel: [],
}

function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
    const columns: Record<TaskStatus, Task[]> = {
        todo: [],
        in_progress: [],
        done: [],
        cancel: [],
    }
    for (const task of tasks) {
        if (task.status in columns) {
            columns[task.status].push(task)
        }
    }
    return columns
}

// ─── Skeleton Components ───────────────────────────────────────────────────────

function HeaderSkeleton() {
    return (
        <div className="flex justify-between items-center shrink-0">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="size-7 rounded-md" />
                    <Skeleton className="h-9 w-52 rounded-md" />
                </div>
                <Skeleton className="h-3 w-64 rounded" />
            </div>
            <div className="flex items-center gap-2 me-2">
                <Skeleton className="size-10 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-full hidden sm:block" />
                <Skeleton className="h-9 w-36 rounded-full hidden sm:block" />
            </div>
        </div>
    )
}

function KanbanCardSkeleton() {
    return (
        <div className="rounded-[1.2rem] p-[14px] border border-border/30 bg-card flex flex-col gap-3">
            <div className="flex gap-1.5">
                <Skeleton className="h-4 w-12 rounded-[4px]" />
                <Skeleton className="h-4 w-16 rounded-[4px]" />
            </div>
            <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
                <Skeleton className="h-3 w-3/5 rounded" />
            </div>
            <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-3 w-20 rounded" />
                <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-10 rounded-[5px]" />
                    <Skeleton className="h-5 w-10 rounded-[5px]" />
                </div>
            </div>
        </div>
    )
}

function KanbanSkeleton() {
    const columns = [
        { label: 'To Do', color: 'bg-muted-foreground/40', cards: 3 },
        { label: 'On Progress', color: 'bg-yellow-400', cards: 4 },
        { label: 'Done', color: 'bg-green-400', cards: 2 },
        { label: 'Cancel', color: 'bg-red-400', cards: 1 },
    ]

    return (
        <div className="flex w-full h-full gap-4 overflow-x-auto no-scrollbar">
            {columns.map((col) => (
                <div key={col.label} className="flex flex-col w-[280px] sm:w-[290px] shrink-0 h-full p-1 overflow-hidden">
                    {/* Column header */}
                    <div className="flex items-center justify-between mb-3 px-1.5">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-[4px] h-[16px] rounded-full", col.color)} />
                            <span className="font-bold text-foreground text-[14px]">{col.label}</span>
                            <div className="flex bg-muted text-muted-foreground min-w-[18px] h-[18px] px-1 items-center justify-center rounded-[4px] font-bold text-[10px] ml-1">
                                {col.cards}
                            </div>
                        </div>
                    </div>
                    {/* Cards */}
                    <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar pb-10 px-1 pt-1">
                        {Array.from({ length: col.cards }).map((_, i) => (
                            <KanbanCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TaskPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [project, setProject] = useState<Project | null>(null);
    const [projectLoading, setProjectLoading] = useState(true);
    const [columns, setColumns] = useState<Record<TaskStatus, Task[]>>(EMPTY_COLUMNS);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [initialTasksLoaded, setInitialTasksLoaded] = useState(false);
    const [openCreateTask, setOpenCreateTask] = useState(false)
    const [creationDefaultStatus, setCreationDefaultStatus] = useState<TaskStatus>('todo')
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)

    // Fetch project
    useEffect(() => {
        getProjectBySlug(slug)
            .then(setProject)
            .catch(console.error)
            .finally(() => setProjectLoading(false))
    }, [slug])

    // Fetch tasks whenever project is loaded
    const fetchTasks = useCallback(async (projectId: string) => {
        setTasksLoading(true)
        try {
            const tasks = await getTasks(projectId)
            setColumns(groupByStatus(tasks))
        } catch (err) {
            console.error('Failed to fetch tasks:', err)
        } finally {
            setTasksLoading(false)
            setInitialTasksLoaded(true)
        }
    }, [])

    useEffect(() => {
        if (project?.id) {
            fetchTasks(project.id)
        }
    }, [project?.id, fetchTasks])

    // Combined loading = project belum selesai ATAU tasks pertama kali belum load
    const isInitialLoading = projectLoading || (!!project && !initialTasksLoaded)

    return (
        <>
            <TaskDetailSheet
                task={selectedTask}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onEdit={(task) => {
                    // Update task internally in list
                    setColumns(prev => {
                        const next = { ...prev }
                        for (const status of Object.keys(next) as TaskStatus[]) {
                            const index = next[status].findIndex(t => t.id === task.id)
                            if (index !== -1) {
                                next[status][index] = task
                            }
                        }
                        return next
                    })
                    // If the parent actually requested an edit mode (e.g. from the dropdown or Edit button inside TaskDetailSheet)
                    // We close the detail sheet and open the edit form.
                    setTaskToEdit(task)
                    setOpenCreateTask(true)
                    setDetailOpen(false)
                }}
                onDelete={(id) => {
                    setColumns(prev => {
                        const next = { ...prev }
                        for (const key of Object.keys(next) as TaskStatus[]) {
                            next[key] = next[key].filter(t => t.id !== id)
                        }
                        return next
                    })
                }}
            />
            <CreateNewTask
                open={openCreateTask}
                onOpenChange={(op) => {
                    setOpenCreateTask(op)
                    if (!op) setTaskToEdit(null) // reset on close
                }}
                projectId={project?.id}
                projectSlug={slug}
                defaultStatus={creationDefaultStatus}
                taskToEdit={taskToEdit}
                onCreated={() => {
                    if (project?.id) fetchTasks(project.id)
                }}
            />
            <div className="flex h-[calc(100vh-theme(spacing.24))] flex-col max-w-full overflow-hidden w-full gap-4 animate-in fade-in zoom-in-95 duration-500">

                {/* ── Header ── */}
                {isInitialLoading ? (
                    <HeaderSkeleton />
                ) : (
                    <div className="flex justify-between items-center shrink-0">
                        <div className="flex flex-col gap-1">
                            {!project ? (
                                <h1 className="font-bold text-3xl text-muted-foreground">Project not found</h1>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <DynamicIcon name={project.icon} className="size-7" />
                                    <h1 className="font-bold text-3xl">{project.name}</h1>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {project?.description}
                            </p>
                        </div>
                        <div className="flex justify-end me-2">
                            <Button
                                size="icon-lg"
                                variant="outline"
                                disabled={tasksLoading || !project}
                                onClick={() => project?.id && fetchTasks(project.id)}
                                aria-label="Refresh tasks"
                            >
                                <RefreshCw className={cn("transition-transform", tasksLoading && "animate-spin")} />
                            </Button>
                            <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-sm h-9 px-4 ml-2 hidden sm:flex font-semibold text-xs border-none">
                                <Upload className="mr-1 size-4" /> Export
                            </Button>
                            <Button
                                size="sm"
                                className="rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-sm h-9 px-4 ml-2 hidden sm:flex font-semibold text-xs border-none"
                                onClick={() => {
                                    setCreationDefaultStatus('todo')
                                    setOpenCreateTask(true)
                                }}
                                disabled={!project}
                            >
                                <Plus className="mr-1 size-4" /> Create New Task
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Tab content ── */}
                <div className="flex-1 flex flex-col min-h-0 w-full">
                    <Tabs defaultValue="kanban" className="flex-1 flex flex-col w-full min-h-0">
                        <div className="bg-card rounded-lg rounded-b-none px-3 py-1 shrink-0 z-10">
                            <div className="w-fit">
                                <TabsList className="w-full">
                                    <TabsTrigger value="kanban" className="flex items-center gap-2"><LayoutDashboard />Kanban</TabsTrigger>
                                    <TabsTrigger value="list" className="flex items-center gap-2"><List />List</TabsTrigger>
                                    <TabsTrigger value="timeline" className="flex items-center gap-2"><Workflow />Timeline</TabsTrigger>
                                </TabsList>
                            </div>
                        </div>
                        <div className="relative flex-1 w-full -mt-2 rounded-2xl rounded-t-none border border-border/70 overflow-x-hidden overflow-y-auto flex flex-col min-w-0">
                            <div
                                className={cn(
                                    "absolute inset-0 z-0",
                                    "[background-size:20px_20px]",
                                    "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]",
                                    "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]",
                                )}
                            />
                            <TabsContents fillHeight className="flex-1 w-full min-w-0 p-4">
                                <TabsContent value="kanban" className="h-full w-full overflow-x-auto overflow-y-hidden">
                                    {isInitialLoading ? (
                                        <KanbanSkeleton />
                                    ) : (
                                        <KanbanView
                                            columns={columns}
                                            setColumns={setColumns}
                                            onTaskClick={(task) => {
                                                setSelectedTask(task)
                                                setDetailOpen(true)
                                            }}
                                            onAddTask={(status) => {
                                                setCreationDefaultStatus(status)
                                                setOpenCreateTask(true)
                                            }}
                                        />
                                    )}
                                </TabsContent>
                                <TabsContent value="list" className="h-full w-full overflow-hidden">
                                    <ListView
                                        columns={columns}
                                        onTaskClick={(task) => {
                                            setSelectedTask(task)
                                            setDetailOpen(true)
                                        }}
                                    />
                                </TabsContent>
                                <TabsContent value="timeline" className="h-full w-full">
                                    Timeline
                                </TabsContent>
                            </TabsContents>
                        </div>
                    </Tabs>
                </div>
            </div>
        </>
    );
}
