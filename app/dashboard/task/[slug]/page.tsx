"use client";

import { useState, useEffect } from 'react';
import { use } from 'react';
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
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
import { initialData } from "@/lib/dummy-data";
import { getProjectBySlug, type Project } from "@/lib/supabase/projects";
import { DynamicIcon } from "@/lib/dynamic-icon";
import CreateNewTask from "@/components/dialog/create-new-task";

export default function TaskPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [columns, setColumns] = useState(initialData);
    const [openCreateTask, setOpenCreateTask] = useState(false)
    useEffect(() => {
        getProjectBySlug(slug)
            .then(setProject)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [slug])

    return (
        <>
            <CreateNewTask
                open={openCreateTask}
                onOpenChange={setOpenCreateTask}
                projectId={project?.id}
            />
            <div className="flex h-[calc(100vh-theme(spacing.24))] flex-col max-w-full overflow-hidden w-full gap-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex justify-between items-center shrink-0">
                    <div className="flex flex-col gap-1">
                        {loading ? (
                            <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
                        ) : !project ? (
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
                        <Button size="icon-lg" variant="outline">
                            <RefreshCw />
                        </Button>
                        <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-sm h-9 px-4 ml-2 hidden sm:flex font-semibold text-xs border-none">
                            <Upload className="mr-1 size-4" /> Export
                        </Button>
                        <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-sm h-9 px-4 ml-2 hidden sm:flex font-semibold text-xs border-none"
                            onClick={() => setOpenCreateTask(true)}>
                            <Plus className="mr-1 size-4" /> Create New Task
                        </Button>
                    </div>
                </div>

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
                                    <KanbanView columns={columns} setColumns={setColumns} />
                                </TabsContent>
                                <TabsContent value="list" className="h-full w-full overflow-hidden">
                                    <ListView columns={columns} />
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
