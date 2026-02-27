import React, { useState, useRef } from 'react';
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
import { Plus, MoreVertical, MessageCircle, Paperclip, CalendarDays, ArrowUp, ArrowRight, ArrowDown, Hash } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TaskStatus, type TaskPriority } from '@/lib/dummy-data';
import { type Task, updateTasksOrder } from '@/lib/supabase/tasks';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive flat order updates from the columns state and persist to Supabase.
 * Fire-and-forget — UI already updated optimistically.
 */
function persistOrder(columns: Record<TaskStatus, Task[]>) {
    const updates = (Object.keys(columns) as TaskStatus[]).flatMap((status) =>
        columns[status].map((task, index) => ({
            id: task.id,
            status,
            position: index,
        }))
    )
    updateTasksOrder(updates).catch((err) =>
        console.error('Failed to persist task order:', err)
    )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function KanbanView({
    columns,
    setColumns,
    onTaskClick,
    onAddTask
}: {
    columns: Record<TaskStatus, Task[]>;
    setColumns: React.Dispatch<React.SetStateAction<Record<TaskStatus, Task[]>>>;
    onTaskClick: (task: Task) => void;
    onAddTask?: (status: TaskStatus) => void;
}) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const dragStartSnapshotRef = useRef<Record<TaskStatus, Task[]> | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const findContainer = (
        id: string | number,
        cols: Record<TaskStatus, Task[]> = columns
    ) => {
        if (id in cols) return id as TaskStatus;
        return (Object.keys(cols) as TaskStatus[]).find((key) =>
            cols[key].find((t) => t.id === id)
        );
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        // Snapshot columns at drag-start
        dragStartSnapshotRef.current = columns;
    };

    // handleDragOver — visual preview only, no DB calls
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
                newIndex = overItems.length;
            } else {
                const isBelowOverItem =
                    over && active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;
                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length;
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

    // handleDragEnd — source of truth: compute final state, update UI + DB
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const snapshot = dragStartSnapshotRef.current;
        dragStartSnapshotRef.current = null;
        setActiveId(null);

        if (!over || !snapshot) return;

        const activeTaskId = active.id as string;
        const overId = over.id as string;
        const fromContainer = findContainer(activeTaskId, snapshot);
        if (!fromContainer) return;

        // Use functional updater so `prev` is guaranteed to be the latest React state
        setColumns((prev) => {
            const toContainer =
                findContainer(activeTaskId, prev) ??
                findContainer(overId, prev);
            if (!toContainer) return prev;

            let next: Record<TaskStatus, Task[]>;

            if (fromContainer === toContainer) {
                // ── Same-column reorder ──────────────────────────────────────
                const activeIndex = prev[toContainer].findIndex((t) => t.id === activeTaskId);
                const overIndex = prev[toContainer].findIndex((t) => t.id === overId);
                if (activeIndex === overIndex || activeIndex < 0 || overIndex < 0) return prev;

                next = {
                    ...prev,
                    [toContainer]: arrayMove(prev[toContainer], activeIndex, overIndex),
                };
            } else {
                // ── Cross-column move ────────────────────────────────────────
                // handleDragOver already moved the task visually; prev already
                // has the task in toContainer with status=toContainer.
                // Just ensure the task object's status field is correct.
                next = {
                    ...prev,
                    [toContainer]: prev[toContainer].map((t) =>
                        t.id === activeTaskId ? { ...t, status: toContainer } : t
                    ),
                };
            }

            // Persist fire-and-forget — runs after React applies the state
            persistOrder(next);
            return next;
        });
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
                        onTaskClick={onTaskClick}
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
const KanbanColumn = ({ id, title, count, items, colorClass, onTaskClick, onAddTask }: {
    id: TaskStatus; title: string; count: number; items: Task[]; colorClass: string;
    onTaskClick: (task: Task) => void;
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
                    <Button variant="ghost" size="icon" className="h-[26px] w-[26px] hover:bg-muted text-foreground cursor-pointer" onClick={() => onAddTask?.(id)}>
                        <Plus className="size-4" />
                    </Button>
                </div>
            </div>

            <div ref={setNodeRef} className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar pb-10 px-1 pt-1">
                <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map((item) => (
                        <SortableTask key={item.id} task={item} onTaskClick={onTaskClick} />
                    ))}
                </SortableContext>
                <Button onClick={() => onAddTask?.(id)} variant="outline" className="w-full py-5 rounded-xl border-dashed border-border/60 text-muted-foreground flex items-center justify-center gap-1 mt-0.5 hover:bg-muted/50 border-dashed border-2 border-foreground/10 transition-colors text-[12px] font-semibold bg-transparent">
                    <Plus className="size-[13px]" /> Add new
                </Button>
            </div>
        </div>
    );
};

// ─── Sortable wrapper ──────────────────────────────────────────────────────────
const SortableTask = ({ task, onTaskClick }: { task: Task; onTaskClick: (task: Task) => void }) => {
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
            <TaskCard task={task} onClick={() => !isDragging && onTaskClick(task)} />
        </div>
    );
};

const PRIORITY_ICON: Record<string, React.ElementType> = {
    High: ArrowUp,
    Medium: ArrowRight,
    Low: ArrowDown,
};

// ─── Task Card ─────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onClick }: { task: Task; onClick?: () => void }) => {
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
    const PriorityIcon = PRIORITY_ICON[task.priority] ?? ArrowRight;

    const doneSubtasks = (task.subtasks ?? []).filter(s => s.is_done).length;
    const totalSubtasks = (task.subtasks ?? []).length;
    const progressValue = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0;

    return (
        <Card
            onClick={onClick}
            className={cn(
                "rounded-[1.2rem] p-[14px] border border-border/30 transition-shadow relative",
                onClick && "cursor-pointer hover:shadow-md hover:border-border/60"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                    <Badge variant="secondary" className={cn("px-1.5 py-0 h-4 rounded-[4px] text-[9px] hover:bg-transparent border-transparent pointer-events-none flex items-center gap-0.5", priorityColors[task.priority])}>
                        <PriorityIcon className="size-2.5" />
                        {task.priority}
                    </Badge>
                    {task.category && (
                        <Badge variant="secondary" className={cn("px-1.5 py-0 h-4 rounded-[4px] text-[9px] hover:bg-transparent border-transparent pointer-events-none flex items-center gap-0.5", task.category ? categoryColors[task.category] : '')}>
                            <Hash className="size-2.5" />
                            {task.category}
                        </Badge>
                    )}
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
            <div>
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
                        <MessageCircle className="size-[11px]" /> {task.comments_count ?? 0}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-[5px] bg-background border border-border/50">
                        <Paperclip className="size-[11px]" /> {task.attachments_count ?? 0}
                    </div>
                </div>
            </div>
        </Card>
    );
};