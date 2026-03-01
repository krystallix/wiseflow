"use client";

import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { LayoutDashboard, List, Plus, RefreshCw, Upload, Workflow, Loader2Icon } from "lucide-react";
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

    const fetchProject = useCallback(() => {
        getProjectBySlug(slug)
            .then(setProject)
            .catch(console.error)
            .finally(() => setProjectLoading(false))
    }, [slug])

    // Fetch project
    useEffect(() => {
        fetchProject()

        const handleProjectUpdated = (e: Event) => {
            const customEvent = e as CustomEvent
            if (customEvent.detail === slug) {
                fetchProject()
            }
        }

        window.addEventListener('project-updated', handleProjectUpdated)
        return () => window.removeEventListener('project-updated', handleProjectUpdated)
    }, [fetchProject, slug])

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

    if (isInitialLoading) {
        return (
            <div className="flex w-full h-[calc(100vh-theme(spacing.24))] items-center justify-center">
                <Loader2Icon className="size-10 text-muted-foreground animate-spin" />
            </div>
        )
    }

    if (!project) {
        return (
            <div className="flex flex-col w-full h-[calc(100vh-theme(spacing.24))] items-center justify-center gap-2">
                <div className="text-center flex flex-col items-center">
                    <h1 className="font-bold text-3xl mb-1">Project Not Found</h1>
                    <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                        The project you're looking for doesn't exist or may have been deleted.
                    </p>
                    <Button asChild className="rounded-full shadow-sm">
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </div>
            </div>
        )
    }

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
                projectId={project.id}
                projectSlug={slug}
                defaultStatus={creationDefaultStatus}
                taskToEdit={taskToEdit}
                onCreated={() => {
                    fetchTasks(project.id)
                }}
            />
            <div className="flex h-[calc(100vh-theme(spacing.24))] flex-col max-w-full overflow-hidden w-full gap-4 animate-in fade-in zoom-in-95 duration-500">

                {/* ── Header ── */}
                <div className="flex justify-between items-center shrink-0">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <DynamicIcon name={project.icon} className="size-7" />
                            <h1 className="font-bold text-3xl">{project.name}</h1>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {project.description}
                        </p>
                    </div>
                    <div className="flex justify-end me-2">
                        <Button
                            size="icon-lg"
                            variant="outline"
                            disabled={tasksLoading}
                            onClick={() => fetchTasks(project.id)}
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
                        >
                            <Plus className="mr-1 size-4" /> Create New Task
                        </Button>
                    </div>
                </div>

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
