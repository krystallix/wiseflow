import React, { useState, useMemo } from 'react';
import { TaskStatus } from '@/lib/dummy-data';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    CalendarDays, CheckSquare,
    ArrowUp, ArrowRight, ArrowDown, Hash,
    ChevronsUpDown, ChevronDown,
    FileText, Flag, CircleDashed,
    Circle, Timer, CheckCircle2, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { type Task as SupabaseTask } from '@/lib/supabase/tasks';

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"

// ─── Config ────────────────────────────────────────────────────────────────────

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

// ─── Columns ──────────────────────────────────────────────────────────────────

export const columnIcons: Record<string, React.ElementType> = {
    title: FileText,
    category: Hash,
    priority: Flag,
    status: CircleDashed,
    subtasks: CheckSquare,
    due_date: CalendarDays,
};

export const columns: ColumnDef<SupabaseTask>[] = [
    {
        accessorKey: "title",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="px-0 py-4 hover:bg-transparent font-semibold text-foreground flex items-center gap-1 h-auto"
                >
                    <FileText className="h-4 w-4 mr-1 text-muted-foreground" />
                    Task
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const task = row.original;
            return (
                <div className="flex flex-col gap-0.5 py-0.5 w-[28%] min-w-[200px] h-[38px] justify-center">
                    <div className="flex items-center gap-2">
                        {task.tag_id && (
                            <Badge variant="outline" className="px-1.5 py-0 h-[16px] text-[8.5px] text-muted-foreground font-semibold border-border/60 uppercase shrink-0">
                                {task.tag_id}
                            </Badge>
                        )}
                        <h4 className="font-semibold text-foreground text-[13px] truncate max-w-[220px] leading-tight">{task.title}</h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[260px] font-medium leading-tight min-h-[14px]">
                        {task.description || "\u00A0"}
                    </p>
                </div>
            );
        },
    },
    {
        accessorKey: "category",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="px-0 hover:bg-transparent font-semibold text-foreground flex items-center gap-1 h-auto"
                >
                    <Hash className="h-4 w-4 mr-1 text-muted-foreground" />
                    Category
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const categoryLabel = row.original.category ?? '';
            const category = categoryConfig[categoryLabel] ?? { style: '' };
            return categoryLabel ? (
                <Badge variant="secondary" className={cn("rounded-md font-semibold px-2 py-0.5 text-[11px] border-transparent transition-colors flex items-center gap-1 w-fit", category.style)}>
                    <Hash className="size-2.5 shrink-0" />
                    {categoryLabel}
                </Badge>
            ) : (
                <span className="text-[11px] text-muted-foreground/40">—</span>
            );
        }
    },
    {
        accessorKey: "priority",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="px-0 hover:bg-transparent font-semibold text-foreground flex items-center gap-1 h-auto"
                >
                    <Flag className="h-4 w-4 mr-1 text-muted-foreground" />
                    Priority
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const priorityLabel = row.original.priority ?? 'Low';
            const priority = priorityConfig[priorityLabel] ?? priorityConfig['Low'];
            const PriorityIcon = priority.icon;
            return (
                <Badge variant="secondary" className={cn("rounded-md font-semibold px-2 py-0.5 text-[11px] border-transparent transition-colors flex items-center gap-1 w-fit", priority.style)}>
                    <PriorityIcon className="size-3 shrink-0" />
                    {priorityLabel}
                </Badge>
            );
        }
    },
    {
        accessorKey: "status",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="px-0 hover:bg-transparent font-semibold text-foreground flex items-center gap-1 h-auto"
                >
                    <CircleDashed className="h-4 w-4 mr-1 text-muted-foreground" />
                    Status
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const statusValue = row.original.status;
            const status = statusConfig[statusValue] ?? statusConfig['todo'];
            const StatusIcon = status.icon;
            return (
                <Badge variant="secondary" className={cn("rounded-md font-semibold px-2 py-0.5 text-[11px] border-transparent transition-colors flex items-center gap-1 w-fit", status.style)}>
                    <StatusIcon className="size-3 shrink-0" />
                    {status.label}
                </Badge>
            );
        }
    },
    {
        id: "subtasks",
        accessorFn: (row) => row.subtasks?.length ?? 0,
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="px-0 hover:bg-transparent font-semibold text-foreground flex items-center gap-1 h-auto"
                >
                    <CheckSquare className="h-4 w-4 mr-1 text-muted-foreground" />
                    Subtasks
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const task = row.original;
            const doneSubtasks = (task.subtasks ?? []).filter(s => s.is_done).length;
            const totalSubtasks = (task.subtasks ?? []).length;

            return totalSubtasks > 0 ? (
                <div className="flex items-center gap-2">
                    <CheckSquare className="size-3.5 text-primary shrink-0" />
                    <Progress value={(doneSubtasks / totalSubtasks) * 100} className="h-1" />
                    <span className="text-[10px] font-semibold text-muted-foreground">{doneSubtasks}/{totalSubtasks}</span>
                </div>
            ) : (
                <span className="text-[11px] text-muted-foreground/40">—</span>
            );
        }
    },
    {
        accessorKey: "due_date",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="px-0 hover:bg-transparent font-semibold text-foreground flex items-center gap-1 h-auto"
                >
                    <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
                    Due Date
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const dateStr = row.original.due_date;
            return dateStr ? (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    <CalendarDays className="size-3.5 shrink-0" />
                    {new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            ) : (
                <span className="text-[11px] text-muted-foreground/40">—</span>
            );
        }
    }
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function ListView({ columns: taskColumns, onTaskClick }: { columns: Record<TaskStatus, SupabaseTask[]>, onTaskClick: (task: SupabaseTask) => void }) {

    const allTasks: SupabaseTask[] = useMemo(() => {
        return (Object.keys(taskColumns) as TaskStatus[]).flatMap(
            (status) => taskColumns[status]
        );
    }, [taskColumns]);

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    const table = useReactTable({
        data: allTasks,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
    })

    return (
        <div className="w-full h-full flex flex-col gap-3">
            <div className="flex items-center px-1 shrink-0">
                <Input
                    placeholder="Search tasks..."
                    value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("title")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm h-9 bg-card shadow-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto h-9 bg-card shadow-sm">
                            Columns <ChevronDown className="ml-2 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                const Icon = columnIcons[column.id];
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        <div className="flex items-center gap-2">
                                            {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
                                            {column.id.replace("_", " ")}
                                        </div>
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div id="table-area" className="bg-card rounded-lg px-2 rounded-t-none overflow-y-auto overflow-x-hidden shadow-sm flex-1 min-h-0">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-border/40 h-9">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="text-foreground font-semibold pt-1 pb-1 h-9">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="border-border/40 hover:bg-muted/30 transition-colors group cursor-pointer h-12"
                                    onClick={() => onTaskClick(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-1">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No tasks found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}