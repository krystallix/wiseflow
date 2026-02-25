import React from 'react';
import { Task } from '@/lib/dummy-data';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function ListView({ columns }: { columns: Record<string, Task[]> }) {

    const getStatusLabel = (columnId: string) => {
        if (columnId === 'todo') return { label: 'To Do', style: 'bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20' };
        if (columnId === 'in_progress') return { label: 'On Progress', style: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20' };
        if (columnId === 'done') return { label: 'Done', style: 'bg-green-500/10 text-green-500 hover:bg-green-500/20' };
        return { label: 'Cancel', style: 'bg-red-500/10 text-destructive hover:bg-red-500/20' };
    };

    const getPriorityLabel = (priority: string) => {
        if (priority === 'High') return { label: 'High', style: 'bg-red-500/10 text-destructive dark:text-red-400 hover:bg-red-500/20' };
        if (priority === 'Medium') return { label: 'Medium', style: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20' };
        return { label: 'Low', style: 'bg-background border border-border/80 text-muted-foreground hover:bg-muted/50' };
    };

    const getCategoryLabel = (category: string) => {
        if (category === 'Back-End') return { label: 'Back-End', style: 'bg-blue-500/10 text-primary dark:text-blue-400 hover:bg-blue-500/20' };
        if (category === 'Front-End') return { label: 'Front-End', style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20' };
        return { label: 'UI/UX Design', style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20' };
    };

    // Flatten all tasks into a single array for the table, injecting their status
    const allTasks = Object.entries(columns).flatMap(([columnId, tasks]) =>
        tasks.map(task => ({
            ...task,
            statusId: columnId
        }))
    );

    return (
        <div id="table-area" className="w-full h-full bg-card rounded-lg px-2 rounded-t-none overflow-y-auto overflow-x-hidden shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/40">
                        <TableHead className="w-[30%] text-foreground font-semibold pt-4 pb-4">Task</TableHead>
                        <TableHead className="text-foreground font-semibold">Team Members</TableHead>
                        <TableHead className="text-foreground font-semibold">Category</TableHead>
                        <TableHead className="text-foreground font-semibold">Priority</TableHead>
                        <TableHead className="text-foreground font-semibold">Status</TableHead>
                        <TableHead className="text-foreground font-semibold w-[15%]">Progress</TableHead>
                        <TableHead className="text-foreground font-semibold text-right pr-6">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allTasks.map((task, index) => {
                        const status = getStatusLabel(task.statusId);
                        const priority = getPriorityLabel(task.priority);
                        const category = getCategoryLabel(task.category);

                        return (
                            <TableRow key={task.id} className="border-border/40 hover:bg-muted/30 transition-colors group">
                                <TableCell className="py-4">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="px-1.5 py-0 h-[18px] text-[9px] text-muted-foreground font-semibold border-border/60 uppercase">
                                                {task.tagId}
                                            </Badge>
                                            <h4 className="font-semibold text-foreground text-[14px] truncate max-w-[250px]">{task.title}</h4>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground truncate max-w-[280px] font-medium">{task.description}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex -space-x-2">
                                        {task.avatars.map((av, i) => (
                                            <Avatar key={i} className="size-[28px] border-2 border-card bg-muted text-[10px] font-bold">
                                                <AvatarImage src={av} />
                                                <AvatarFallback>M</AvatarFallback>
                                            </Avatar>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={cn("rounded-md font-semibold px-2.5 py-0.5 text-[11px] border-transparent transition-colors", category.style)}>
                                        {category.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={cn("rounded-md font-semibold px-2.5 py-0.5 text-[11px] border-transparent transition-colors", priority.style)}>
                                        {priority.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={cn("rounded-md font-semibold px-2.5 py-0.5 text-[11px] border-transparent transition-colors", status.style)}>
                                        {status.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Progress value={task.progress} className="h-1.5 w-[60px] md:w-[80px]" />
                                        <span className="text-[11px] font-bold text-muted-foreground">{task.progress}%</span>
                                    </div>
                                </TableCell>
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