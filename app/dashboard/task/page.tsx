"use client";

import React, { useState, useCallback } from 'react';
import { LayoutDashboard, List, Workflow, Plus, FolderKanban, RefreshCw, Upload, CalendarDays, CheckSquare2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Sheet, SheetContent, SheetHeader,
    SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import {
    Tabs, TabsContent, TabsContents,
    TabsList, TabsTrigger,
} from '@/components/animate-ui/primitives/animate/tabs';
import KanbanView from '@/components/dash/KanbanView';
import ListView from '@/components/dash/ListView';
import {
    type Task, type TaskStatus, type TaskPriority, type Project,
    initialProjects, initialTasksByProject, emptyColumns,
} from '@/lib/dummy-data';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PROJECT_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#f59e0b', '#22c55e', '#06b6d4',
];

const CATEGORIES = ['Front-End', 'Back-End', 'UI/UX Design', 'DevOps', 'Testing', 'Other'];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'On Progress' },
    { value: 'done', label: 'Done' },
    { value: 'cancel', label: 'Cancel' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TaskPage() {
    // ── Projects state ──
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjects[0]?.id ?? '');
    const [tasksByProject, setTasksByProject] = useState<Record<string, Record<TaskStatus, Task[]>>>(initialTasksByProject);

    // ── Sheet open states ──
    const [projectSheetOpen, setProjectSheetOpen] = useState(false);
    const [taskSheetOpen, setTaskSheetOpen] = useState(false);

    // ── New Project form ──
    const [newProjName, setNewProjName] = useState('');
    const [newProjDesc, setNewProjDesc] = useState('');
    const [newProjColor, setNewProjColor] = useState(PROJECT_COLORS[0]);

    // ── New Task form ──
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Medium');
    const [newTaskCategory, setNewTaskCategory] = useState('Front-End');
    const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');

    // ── Derived ──
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const columns = tasksByProject[selectedProjectId] ?? emptyColumns;

    const setColumns = useCallback(
        (updater: React.SetStateAction<Record<TaskStatus, Task[]>>) => {
            setTasksByProject(prev => ({
                ...prev,
                [selectedProjectId]: typeof updater === 'function'
                    ? updater(prev[selectedProjectId] ?? emptyColumns)
                    : updater,
            }));
        },
        [selectedProjectId],
    );

    const taskCount = (projectId: string) =>
        Object.values(tasksByProject[projectId] ?? {}).flat().length;

    const totalTaskCount = Object.values(columns).flat().length;
    const doneTaskCount = columns.done.length;

    // ── Handlers ──
    const handleCreateProject = () => {
        if (!newProjName.trim()) return;
        const id = `proj-${Date.now()}`;
        const project: Project = {
            id,
            name: newProjName.trim(),
            description: newProjDesc.trim() || undefined,
            color: newProjColor,
            created_at: new Date().toISOString(),
        };
        setProjects(prev => [...prev, project]);
        setTasksByProject(prev => ({ ...prev, [id]: { ...emptyColumns } }));
        setSelectedProjectId(id);
        setNewProjName(''); setNewProjDesc(''); setNewProjColor(PROJECT_COLORS[0]);
        setProjectSheetOpen(false);
    };

    const openTaskSheet = (status: TaskStatus = 'todo') => {
        setNewTaskStatus(status);
        setTaskSheetOpen(true);
    };

    const handleCreateTask = () => {
        if (!newTaskTitle.trim() || !selectedProjectId) return;
        const allTaskCount = Object.values(tasksByProject).flatMap(Object.values).flat().length;
        const task: Task = {
            id: `task-${Date.now()}`,
            project_id: selectedProjectId,
            title: newTaskTitle.trim(),
            description: newTaskDesc.trim(),
            category: newTaskCategory,
            tag_id: `D-${String(200 + allTaskCount).padStart(3, '0')}`,
            status: newTaskStatus,
            priority: newTaskPriority,
            comments_count: 0,
            attachments_count: 0,
            subtasks: [],
            created_at: new Date().toISOString(),
            ...(newTaskDueDate ? { due_date: newTaskDueDate } : {}),
        };
        setTasksByProject(prev => ({
            ...prev,
            [selectedProjectId]: {
                ...prev[selectedProjectId],
                [newTaskStatus]: [...(prev[selectedProjectId][newTaskStatus] ?? []), task],
            },
        }));
        setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskPriority('Medium');
        setNewTaskCategory('Front-End'); setNewTaskDueDate('');
        setTaskSheetOpen(false);
    };

    return (
        <div className="flex h-[calc(100vh-theme(spacing.24))] gap-3 max-w-full overflow-hidden w-full animate-in fade-in zoom-in-95 duration-500">

            {/* ── Project Panel ──────────────────────────────── */}
            <div className="w-[200px] shrink-0 flex flex-col bg-card rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 pt-3 pb-2">
                    <div className="flex items-center gap-1.5 text-foreground">
                        <FolderKanban className="size-4" />
                        <span className="font-bold text-sm">Projects</span>
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 hover:bg-muted"
                        onClick={() => setProjectSheetOpen(true)}
                    >
                        <Plus className="size-3.5" />
                    </Button>
                </div>

                <div className="flex-1 flex flex-col gap-0.5 px-2 pb-3 overflow-y-auto">
                    {projects.map(p => {
                        const count = taskCount(p.id);
                        const isActive = p.id === selectedProjectId;
                        return (
                            <button
                                key={p.id}
                                onClick={() => setSelectedProjectId(p.id)}
                                className={cn(
                                    "flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-all text-sm group w-full",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <div
                                    className="w-[7px] h-[7px] rounded-full shrink-0"
                                    style={{ backgroundColor: p.color }}
                                />
                                <span className={cn("truncate flex-1 text-[13px]", isActive ? "font-bold" : "font-medium")}>
                                    {p.name}
                                </span>
                                <span className={cn(
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0",
                                    isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}

                    {projects.length === 0 && (
                        <p className="text-xs text-muted-foreground/50 text-center py-6">
                            No projects yet
                        </p>
                    )}
                </div>
            </div>

            {/* ── Main Content ────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
                {selectedProject ? (
                    <>
                        {/* Header */}
                        <div className="flex justify-between items-start shrink-0 mb-3">
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full shrink-0 mt-1"
                                        style={{ backgroundColor: selectedProject.color }}
                                    />
                                    <h1 className="font-bold text-3xl leading-tight">{selectedProject.name}</h1>
                                </div>
                                <p className="text-xs text-muted-foreground ml-5">
                                    {selectedProject.description ?? 'No description'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {/* Stats */}
                                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-card px-3 py-1.5 rounded-lg border border-border/50">
                                    <CheckSquare2 className="size-3.5 text-primary" />
                                    <span className="font-semibold">{doneTaskCount}/{totalTaskCount}</span>
                                    <span>done</span>
                                </div>
                                <Button size="icon-lg" variant="outline">
                                    <RefreshCw />
                                </Button>
                                <Button
                                    size="sm"
                                    className="rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-sm h-9 px-4 font-semibold text-xs border-none hidden sm:flex"
                                >
                                    <Upload className="mr-1 size-4" /> Export
                                </Button>
                                <Button
                                    size="sm"
                                    className="rounded-full h-9 px-4 font-semibold text-xs"
                                    onClick={() => openTaskSheet('todo')}
                                >
                                    <Plus className="mr-1 size-4" /> New Task
                                </Button>
                            </div>
                        </div>

                        {/* Tabs + Views */}
                        <div className="flex-1 flex flex-col min-h-0 w-full">
                            <Tabs defaultValue="kanban" className="flex-1 flex flex-col w-full min-h-0">
                                <div className="bg-card rounded-lg rounded-b-none px-3 py-1 shrink-0 z-10">
                                    <div className="w-fit">
                                        <TabsList className="w-full">
                                            <TabsTrigger value="kanban" className="flex items-center gap-2">
                                                <LayoutDashboard />Kanban
                                            </TabsTrigger>
                                            <TabsTrigger value="list" className="flex items-center gap-2">
                                                <List />List
                                            </TabsTrigger>
                                            <TabsTrigger value="timeline" className="flex items-center gap-2">
                                                <Workflow />Timeline
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>
                                </div>

                                <div className="relative flex-1 w-full -mt-2 rounded-2xl rounded-t-none border border-border/70 overflow-x-hidden overflow-y-auto flex flex-col min-w-0">
                                    <div className={cn(
                                        "absolute inset-0 z-0",
                                        "[background-size:20px_20px]",
                                        "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]",
                                        "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]",
                                    )} />

                                    <TabsContents fillHeight className="flex-1 w-full min-w-0 p-4">
                                        <TabsContent value="kanban" className="h-full w-full overflow-x-auto overflow-y-hidden">
                                            <KanbanView
                                                columns={columns}
                                                setColumns={setColumns}
                                                onAddTask={openTaskSheet}
                                            />
                                        </TabsContent>
                                        <TabsContent value="list" className="h-full w-full overflow-hidden">
                                            <ListView columns={columns} />
                                        </TabsContent>
                                        <TabsContent value="timeline" className="h-full w-full flex items-center justify-center">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Workflow className="size-8 opacity-30" />
                                                <p className="text-sm font-medium">Timeline coming soon</p>
                                            </div>
                                        </TabsContent>
                                    </TabsContents>
                                </div>
                            </Tabs>
                        </div>
                    </>
                ) : (
                    /* Empty state */
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                        <FolderKanban className="size-12 opacity-20" />
                        <p className="font-semibold text-sm">No project selected</p>
                        <Button size="sm" variant="outline" onClick={() => setProjectSheetOpen(true)}>
                            <Plus className="mr-1 size-4" /> Create a project
                        </Button>
                    </div>
                )}
            </div>

            {/* ── Create Project Sheet ───────────────────────── */}
            <Sheet open={projectSheetOpen} onOpenChange={setProjectSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
                    <SheetHeader className="p-6 pb-4 border-b border-border/50">
                        <SheetTitle className="text-lg font-bold">New Project</SheetTitle>
                        <SheetDescription>Create a new project to group your tasks.</SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                        {/* Name */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="proj-name">Project name <span className="text-destructive">*</span></Label>
                            <Input
                                id="proj-name"
                                placeholder="e.g. Mobile App Redesign"
                                value={newProjName}
                                onChange={e => setNewProjName(e.target.value)}
                            />
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="proj-desc">Description</Label>
                            <Textarea
                                id="proj-desc"
                                placeholder="What is this project about?"
                                className="resize-none h-20"
                                value={newProjDesc}
                                onChange={e => setNewProjDesc(e.target.value)}
                            />
                        </div>

                        {/* Color */}
                        <div className="flex flex-col gap-2">
                            <Label>Color</Label>
                            <div className="flex gap-2 flex-wrap">
                                {PROJECT_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setNewProjColor(color)}
                                        className={cn(
                                            "w-7 h-7 rounded-full transition-all border-2",
                                            newProjColor === color
                                                ? "border-foreground scale-110 shadow-md"
                                                : "border-transparent hover:scale-105"
                                        )}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="flex flex-col gap-1.5">
                            <Label>Preview</Label>
                            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: newProjColor }} />
                                <span className="text-sm font-semibold text-foreground">
                                    {newProjName.trim() || 'Project name'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="p-6 pt-4 border-t border-border/50 flex-row gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setProjectSheetOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1"
                            disabled={!newProjName.trim()}
                            onClick={handleCreateProject}
                        >
                            Create Project
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* ── Create Task Sheet ──────────────────────────── */}
            <Sheet open={taskSheetOpen} onOpenChange={setTaskSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
                    <SheetHeader className="p-6 pb-4 border-b border-border/50">
                        <div className="flex items-center gap-2">
                            {selectedProject && (
                                <div
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: selectedProject.color }}
                                />
                            )}
                            <SheetTitle className="text-lg font-bold">New Task</SheetTitle>
                        </div>
                        <SheetDescription>
                            Add a task to <strong>{selectedProject?.name}</strong>
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                        {/* Title */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="task-title">Task title <span className="text-destructive">*</span></Label>
                            <Input
                                id="task-title"
                                placeholder="e.g. Build authentication flow"
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateTask()}
                            />
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="task-desc">Description</Label>
                            <Textarea
                                id="task-desc"
                                placeholder="What needs to be done?"
                                className="resize-none h-20"
                                value={newTaskDesc}
                                onChange={e => setNewTaskDesc(e.target.value)}
                            />
                        </div>

                        {/* Status + Priority row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label>Status</Label>
                                <Select
                                    value={newTaskStatus}
                                    onValueChange={v => setNewTaskStatus(v as TaskStatus)}
                                >
                                    <SelectTrigger className="w-full h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map(s => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label>Priority</Label>
                                <Select
                                    value={newTaskPriority}
                                    onValueChange={v => setNewTaskPriority(v as TaskPriority)}
                                >
                                    <SelectTrigger className="w-full h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Category */}
                        <div className="flex flex-col gap-1.5">
                            <Label>Category</Label>
                            <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                                <SelectTrigger className="w-full h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Due Date */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="task-due" className="flex items-center gap-1.5">
                                <CalendarDays className="size-3.5" /> Due Date
                            </Label>
                            <Input
                                id="task-due"
                                type="date"
                                value={newTaskDueDate}
                                onChange={e => setNewTaskDueDate(e.target.value)}
                                className="h-9"
                            />
                        </div>
                    </div>

                    <SheetFooter className="p-6 pt-4 border-t border-border/50 flex-row gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setTaskSheetOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1"
                            disabled={!newTaskTitle.trim()}
                            onClick={handleCreateTask}
                        >
                            Create Task
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}