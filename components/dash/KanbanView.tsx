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
import { Plus, MoreVertical, MessageCircle, Paperclip, Loader } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { Task } from '@/lib/dummy-data';

// Main Component
export default function KanbanView({
    columns,
    setColumns
}: {
    columns: Record<string, Task[]>;
    setColumns: React.Dispatch<React.SetStateAction<Record<string, Task[]>>>
}) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const findContainer = (id: string | number) => {
        if (id in columns) return id;
        return Object.keys(columns).find((key) =>
            columns[key].find((t) => t.id === id)
        );
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;
        const overId = over.id;
        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        setColumns((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];

            const activeIndex = activeItems.findIndex((t) => t.id === active.id);
            const overIndex = overItems.findIndex((t) => t.id === overId);

            let newIndex;
            if (overId in prev) { // dropped directly on the droppable region of an empty column
                newIndex = overItems.length + 1;
            } else {
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top >
                    over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            return {
                ...prev,
                [activeContainer]: [
                    ...prev[activeContainer].filter((item) => item.id !== active.id),
                ],
                [overContainer]: [
                    ...prev[overContainer].slice(0, newIndex),
                    activeItems[activeIndex],
                    ...prev[overContainer].slice(newIndex, prev[overContainer].length),
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

    let activeTask = null;
    if (activeId) {
        for (const key in columns) {
            const task = columns[key].find((t) => t.id === activeId);
            if (task) {
                activeTask = task;
                break;
            }
        }
    }

    return (
        <div className="flex w-full h-full gap-4 overflow-x-auto no-scrollbar scroll-smooth">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <KanbanColumn id="todo" title="To - Do" colorClass="bg-muted-foreground/40" count={columns.todo.length} items={columns.todo} />
                <KanbanColumn id="in_progress" title="On Progress" colorClass="bg-yellow-400" count={columns.in_progress.length} items={columns.in_progress} />
                <KanbanColumn id="done" title="Done" colorClass="bg-green-400" count={columns.done.length} items={columns.done} />
                <KanbanColumn id="cancel" title="Cancel" colorClass="bg-red-400" count={columns.cancel.length} items={columns.cancel} />

                <DragOverlay
                    dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: { active: { opacity: "0.5" } }
                        }),
                    }}
                >
                    {activeTask ? (
                        <div className="w-[280px] sm:w-[290px] cursor-grabbing shadow-2xl scale-[1.02] transition-transform">
                            <TaskCard task={activeTask} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

// Column Component
const KanbanColumn = ({ id, title, count, items, colorClass }: { id: string, title: string, count: number, items: Task[], colorClass: string }) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col w-[280px] sm:w-[290px] shrink-0 h-full p-1 overflow-hidden">
            <div className="flex items-center justify-between mb-3 px-1.5">
                <div className="flex items-center gap-2">
                    <div className={cn("w-[4px] h-[16px] rounded-full", colorClass)} />
                    <h3 className="font-bold text-foreground text-[14px]">{title}</h3>
                    <div className="flex bg-muted text-muted-foreground min-w-[18px] h-[18px] px-1  items-center justify-center rounded-[4px] font-bold text-[10px] ml-1">{count}</div>
                </div>
                <div className="flex items-center gap-0.5 text-muted-foreground">
                    <Button variant="ghost" size="icon" className="h-[26px] w-[26px] hover:bg-muted text-foreground cursor-pointer"><Plus className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-[26px] w-[26px] hover:bg-muted text-muted-foreground cursor-pointer"><MoreVertical className="size-4" /></Button>
                </div>
            </div>
            <div
                ref={setNodeRef}
                className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar pb-10 px-1 pt-1"
            >
                <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map((item) => (
                        <SortableTask key={item.id} task={item} />
                    ))}
                </SortableContext>

                {/* Dummy add new button following design */}
                <Button variant="outline" className="w-full py-5 rounded-xl border-dashed border-border/60 text-muted-foreground flex items-center justify-center gap-1 mt-0.5 hover:bg-muted/50 transition-colors text-[12px] font-semibold bg-transparent">
                    <Plus className="size-[13px]" /> Add new
                </Button>
            </div>
        </div>
    );
}

// Sortable wrapper to map dnd events to logic
const SortableTask = ({ task }: { task: Task }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { type: 'Task', task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
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


// The UI Core Card matching the Figma design perfectly
const TaskCard = ({ task }: { task: Task }) => {
    const priorityColors: Record<string, string> = {
        High: "bg-red-500/10 text-destructive dark:text-red-400 font-bold",
        Medium: "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold",
        Low: "bg-background border border-border/80 text-muted-foreground font-semibold"
    };
    const categoryColors: Record<string, string> = {
        "Back-End": "bg-blue-500/10 text-primary dark:text-blue-400 font-bold",
        "Front-End": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold",
        "UI/UX Design": "bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold"
    };

    return (
        <Card className="rounded-[1.2rem] p-[16px]  border border-border/30 hover:shadow-sm transition-shadow relative">
            <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1.5">
                    <Badge variant="secondary" className={cn("px-2 py-0 h-4 rounded-[4px] text-[9px] hover:bg-transparent border-transparent pointer-events-none", priorityColors[task.priority])}>{task.priority}</Badge>
                    <Badge variant="secondary" className={cn("px-2 py-0 h-4 rounded-[4px] text-[9px] hover:bg-transparent border-transparent pointer-events-none", categoryColors[task.category])}>{task.category}</Badge>
                </div>
                <span className="text-[11.5px] font-semibold text-muted-foreground mr-1">{task.tagId}</span>
            </div>

            {task.image && (
                <img src={task.image} className="w-full h-[90px] object-cover rounded-xl mb-3 bg-muted border border-border/40" alt="Cover" draggable={false} />
            )}

            <div className="mb-3.5">
                <h4 className="font-bold text-[14px] text-foreground leading-[1.3] mb-1">{task.title}</h4>
                <p className="text-[11.5px] text-muted-foreground/90 font-medium tracking-tight leading-snug">{task.description}</p>
            </div>

            <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                    <span className="flex items-center gap-1.5 font-semibold"><Loader className="size-2.5 text-primary animate-pulse" /> Progress</span>
                    <span className="font-bold text-foreground/70">{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-[4px]" />
            </div>

            <div className="flex items-center justify-between pt-1">
                <div className="flex -space-x-1.5">
                    {task.avatars.map((av, i) => (
                        <Avatar key={i} className="size-[22px] border-[1.5px] border-card bg-background"><AvatarImage src={av} /></Avatar>
                    ))}
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-[5px] bg-background border border-border/50">
                        <MessageCircle className="size-[11px]" /> {task.comments}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-[5px] bg-background border border-border/50">
                        <Paperclip className="size-[11px]" /> {task.attachments}
                    </div>
                </div>
            </div>
        </Card>
    );
}