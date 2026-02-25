import React from 'react';
import { Task, TaskStatus } from '@/lib/dummy-data';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Edit, Trash2, CalendarDays, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const statusConfig: Record<TaskStatus, { label: string; style: string }> = {
    todo: { label: 'To Do', style: 'bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20' },
    in_progress: { label: 'On Progress', style: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20' },
    done: { label: 'Done', style: 'bg-green-500/10 text-green-500 hover:bg-green-500/20' },
    cancel: { label: 'Cancel', style: 'bg-red-500/10 text-destructive hover:bg-red-500/20' },
};

const priorityConfig: Record<string, { style: string }> = {
    High: { style: 'bg-red-500/10 text-destructive dark:text-red-400 hover:bg-red-500/20' },
    Medium: { style: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20' },
    Low: { style: 'bg-background border border-border/80 text-muted-foreground hover:bg-muted/50' },
};

const categoryConfig: Record<string, { style: string }> = {
    'Back-End': { style: 'bg-blue-500/10 text-primary dark:text-blue-400 hover:bg-blue-500/20' },
    'Front-End': { style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20' },
    'UI/UX Design': { style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20' },
};

export default function ListView({ columns }: { columns: Record<TaskStatus, Task[]> }) {
    const allTasks: Task[] = (Object.keys(columns) as TaskStatus[]).flatMap(
        (status) => columns[status]
    );

    return (
        <div id="table-area" className="w-full h-full bg-card rounded-lg px-2 rounded-t-none overflow-y-auto overflow-x-hidden shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/40">
                        <TableHead className="w-[28%] text-foreground font-semibold pt-4 pb-4">Task</TableHead>
                        <TableHead className="text-foreground font-semibold">Category</TableHead>
                        <TableHead className="text-foreground font-semibold">Priority</TableHead>
                        <TableHead className="text-foreground font-semibold">Status</TableHead>
                        <TableHead className="text-foreground font-semibold">Subtasks</TableHead>
                        <TableHead className="text-foreground font-semibold">Due Date</TableHead>
                        <TableHead className="text-foreground font-semibold w-[13%]">Progress</TableHead>
                        <TableHead className="text-foreground font-semibold text-right pr-6">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allTasks.map((task) => {
                        const status = statusConfig[task.status];
                        const priority = priorityConfig[task.priority];
                        const category = categoryConfig[task.category] ?? { style: '' };
                        const doneSubtasks = task.subtasks.filter(s => s.is_done).length;
                        const totalSubtasks = task.subtasks.length;

                        return (
                            <TableRow key={task.id} className="border-border/40 hover:bg-muted/30 transition-colors group">
                                {/* Task */}
                                <TableCell className="py-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="px-1.5 py-0 h-[18px] text-[9px] text-muted-foreground font-semibold border-border/60 uppercase">
                                                {task.tag_id}
                                            </Badge>
                                            <h4 className="font-semibold text-foreground text-[13.5px] truncate max-w-[220px]">{task.title}</h4>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground truncate max-w-[260px] font-medium">{task.description}</p>
                                    </div>
                                </TableCell>

                                {/* Category */}
                                <TableCell>
                                    <Badge variant="secondary" className={cn("rounded-md font-semibold px-2.5 py-0.5 text-[11px] border-transparent transition-colors", category.style)}>
                                        {task.category}
                                    </Badge>
                                </TableCell>

                                {/* Priority */}
                                <TableCell>
                                    <Badge variant="secondary" className={cn("rounded-md font-semibold px-2.5 py-0.5 text-[11px] border-transparent transition-colors", priority.style)}>
                                        {task.priority}
                                    </Badge>
                                </TableCell>

                                {/* Status */}
                                <TableCell>
                                    <Badge variant="secondary" className={cn("rounded-md font-semibold px-2.5 py-0.5 text-[11px] border-transparent transition-colors", status.style)}>
                                        {status.label}
                                    </Badge>
                                </TableCell>

                                {/* Subtasks */}
                                <TableCell>
                                    {totalSubtasks > 0 ? (
                                        <div className="flex items-center gap-2">
                                            <CheckSquare className="size-3.5 text-primary shrink-0" />
                                            <div className="flex flex-col gap-1 min-w-[60px]">
                                                <Progress value={(doneSubtasks / totalSubtasks) * 100} className="h-1" />
                                                <span className="text-[10px] font-semibold text-muted-foreground">{doneSubtasks}/{totalSubtasks}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-muted-foreground/40">—</span>
                                    )}
                                </TableCell>

                                {/* Due Date */}
                                <TableCell>
                                    {task.due_date ? (
                                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                                            <CalendarDays className="size-3.5 shrink-0" />
                                            {task.due_date}
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-muted-foreground/40">—</span>
                                    )}
                                </TableCell>

                                {/* Progress */}
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Progress value={task.progress} className="h-1.5 w-[60px] md:w-[75px]" />
                                        <span className="text-[11px] font-bold text-muted-foreground">{task.progress}%</span>
                                    </div>
                                </TableCell>

                                {/* Action */}
                                <TableCell className="text-right pr-6">
                                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-[28px] w-[28px] text-muted-foreground hover:text-foreground">
                                            <Edit className="size-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-[28px] w-[28px] text-muted-foreground hover:text-destructive">
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}