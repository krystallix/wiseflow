"use client";

import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    useDroppable
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreVertical, MessageCircle, Paperclip, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Task, TaskStatus } from '@/lib/dummy-data';

// ─── Main Component ────────────────────────────────────────────────────────────
export default function KanbanView({
    columns,
    setColumns,
    onAddTask,
}: {
    columns: Record<TaskStatus, Task[]>;
    setColumns: React.Dispatch<React.SetStateAction<Record<TaskStatus, Task[]>>>;
    onAddTask?: (status: TaskStatus) => void;
}) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const findContainer = (id: string | number) => {
        if (id in columns) return id as TaskStatus;
        return (Object.keys(columns) as TaskStatus[]).find((key) =>
            columns[key].find((t) => t.id === id)
        );
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;
        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(over.id);
        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        setColumns((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];
            const activeIndex = activeItems.findIndex((t) => t.id === active.id);
            const overIndex = overItems.findIndex((t) => t.id === over.id);
            let newIndex: number;

            if (over.id in prev) {
                newIndex = overItems.length + 1;
            } else {
                const isBelowOverItem =
                    over && active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;
                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            return {
                ...prev,
                [activeContainer]: prev[activeContainer].filter((item) => item.id !== active.id),
                [overContainer]: [
                    ...prev[overContainer].slice(0, newIndex),
                    { ...activeItems[activeIndex], status: overContainer },
                    ...prev[overContainer].slice(newIndex),
                ],
            };
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(over?.id as string);
        if (!activeContainer || !overContainer || activeContainer !== overContainer) {
            setActiveId(null);
            return;
        }
        const activeIndex = columns[activeContainer].findIndex((t) => t.id === active.id);
        const overIndex = columns[overContainer].findIndex((t) => t.id === over?.id);
        if (activeIndex !== overIndex) {
            setColumns((prev) => ({
                ...prev,
                [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex),
            }));
        }
        setActiveId(null);
    };

    let activeTask: Task | null = null;
    if (activeId) {
        for (const key in columns) {
            const task = columns[key as TaskStatus].find((t) => t.id === activeId);
            if (task) { activeTask = task; break; }
        }
    }

    const columnConfig: { id: TaskStatus; label: string; color: string }[] = [
        { id: 'todo', label: 'To Do', color: 'bg-muted-foreground/40' },
        { id: 'in_progress', label: 'On Progress', color: 'bg-yellow-400' },
        { id: 'done', label: 'Done', color: 'bg-green-400' },
        { id: 'cancel', label: 'Cancel', color: 'bg-red-400' },
    ];

    return (
        <div className="flex w-full h-full gap-4 overflow-x-auto no-scrollbar scroll-smooth">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                {columnConfig.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.label}
                        colorClass={col.color}
                        count={columns[col.id].length}
                        items={columns[col.id]}
                        onAddTask={onAddTask}
                    />
                ))}

                <DragOverlay
                    dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: { active: { opacity: '0.5' } }
                        }),
                    }}
                >
                    {activeTask ? (
                        <div className="w-[280px] sm:w-[290px] cursor-grabbing shadow-2xl scale-[1.02]">
                            <TaskCard task={activeTask} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

// ─── Column ────────────────────────────────────────────────────────────────────
const KanbanColumn = ({ id, title, count, items, colorClass, onAddTask }: {
    id: TaskStatus; title: string; count: number; items: Task[]; colorClass: string;
    onAddTask?: (status: TaskStatus) => void;
}) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col w-[280px] sm:w-[290px] shrink-0 h-full p-1 overflow-hidden">
            <div className="flex items-center justify-between mb-3 px-1.5">
                <div className="flex items-center gap-2">
                    <div className={cn("w-[4px] h-[16px] rounded-full", colorClass)} />
                    <h3 className="font-bold text-foreground text-[14px]">{title}</h3>
                    <div className="flex bg-muted text-muted-foreground min-w-[18px] h-[18px] px-1 items-center justify-center rounded-[4px] font-bold text-[10px] ml-1">
                        {count}
                    </div>
                </div>
                <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="h-[26px] w-[26px] hover:bg-muted text-foreground cursor-pointer">
                        <Plus className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-[26px] w-[26px] hover:bg-muted text-muted-foreground cursor-pointer">
                        <MoreVertical className="size-4" />
                    </Button>
                </div>
            </div>

            <div ref={setNodeRef} className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar pb-10 px-1 pt-1">
                <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map((item) => (
                        <SortableTask key={item.id} task={item} />
                    ))}
                </SortableContext>
                <Button
                    variant="outline"
                    className="w-full py-5 rounded-xl border-dashed border-border/60 text-muted-foreground flex items-center justify-center gap-1 mt-0.5 hover:bg-muted/50 transition-colors text-[12px] font-semibold bg-transparent"
                    onClick={() => onAddTask?.(id)}
                >
                    <Plus className="size-[13px]" /> Add new
                </Button>
            </div>
        </div>
    );
};

// ─── Sortable wrapper ──────────────────────────────────────────────────────────
const SortableTask = ({ task }: { task: Task }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { type: 'Task', task }
    });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            {...attributes}
            {...listeners}
            className={cn(
                "cursor-grab active:cursor-grabbing outline-none",
                isDragging ? "opacity-30 mix-blend-multiply dark:mix-blend-screen ring-2 ring-primary ring-offset-2 rounded-2xl" : ""
            )}
        >
            <TaskCard task={task} />
        </div>
    );
};

// ─── Task Card ─────────────────────────────────────────────────────────────────
const TaskCard = ({ task }: { task: Task }) => {
    const priorityColors: Record<string, string> = {
        High: "bg-red-500/10 text-destructive dark:text-red-400 font-bold",
        Medium: "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold",
        Low: "bg-background border border-border/80 text-muted-foreground font-semibold",
    };
    const categoryColors: Record<string, string> = {
        "Back-End": "bg-blue-500/10 text-primary dark:text-blue-400 font-bold",
        "Front-End": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold",
        "UI/UX Design": "bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold",
    };

    const doneSubtasks = task.subtasks.filter(s => s.is_done).length;
    const totalSubtasks = task.subtasks.length;
    const progressValue = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0;

    return (
        <Card className="rounded-[1.2rem] p-[14px] border border-border/30 hover:shadow-sm transition-shadow relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1.5 flex-wrap">
                    <Badge variant="secondary" className={cn("px-2 py-0 h-4 rounded-[4px] text-[9px] hover:bg-transparent border-transparent pointer-events-none", priorityColors[task.priority])}>
                        {task.priority}
                    </Badge>
                    <Badge variant="secondary" className={cn("px-2 py-0 h-4 rounded-[4px] text-[9px] hover:bg-transparent border-transparent pointer-events-none", categoryColors[task.category])}>
                        {task.category}
                    </Badge>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">{task.tag_id}</span>
            </div>

            {/* Cover Image */}
            {task.cover_url && (
                <img
                    src={task.cover_url}
                    className="w-full h-[80px] object-cover rounded-xl mb-3 bg-muted border border-border/40"
                    alt="Cover"
                    draggable={false}
                />
            )}

            {/* Title & Description */}
            <div className="mb-3">
                <h4 className="font-bold text-[13.5px] text-foreground leading-[1.3] mb-1">{task.title}</h4>
                <p className="text-[11px] text-muted-foreground/80 font-medium tracking-tight leading-snug line-clamp-2">{task.description}</p>
            </div>

            {/* Progress (from subtasks) */}
            {totalSubtasks > 0 && (
                <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                        <span className="font-semibold">Progress</span>
                        <span className="font-bold text-foreground/70">{doneSubtasks}/{totalSubtasks} done</span>
                    </div>
                    <Progress value={progressValue} className="h-[4px]" />
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
                {/* Due date */}
                <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-semibold">
                    {task.due_date ? (
                        <>
                            <CalendarDays className="size-[11px]" />
                            <span>{task.due_date}</span>
                        </>
                    ) : (
                        <span className="text-muted-foreground/40">No due date</span>
                    )}
                </div>

                {/* Comments & attachments */}
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-[5px] bg-background border border-border/50">
                        <MessageCircle className="size-[11px]" /> {task.comments_count}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-[5px] bg-background border border-border/50">
                        <Paperclip className="size-[11px]" /> {task.attachments_count}
                    </div>
                </div>
            </div>
        </Card>
    );
};