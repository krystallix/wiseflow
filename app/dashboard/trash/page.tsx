import { createClient } from "@/lib/supabase/server"
import { TrashClient } from "./trash-client"

export default async function TrashPage() {
    const supabase = await createClient()

    // Fetch deleted tasks
    const { data: tasks, error: tasksError } = await supabase
        .schema('risenwise')
        .from('tasks')
        .select(`
            id, title, description, category, priority, status, due_date,
            project_id, deleted_at, 
            project:project_id(id, name, icon),
            subtasks:task_subtasks(id, is_done)
        `)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

    // Fetch deleted projects
    const { data: projects, error: projectsError } = await supabase
        .schema('risenwise')
        .from('projects')
        .select(`id, name, icon, deleted_at`)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

    if (tasksError) console.error("Error fetching deleted tasks:", tasksError)
    if (projectsError) console.error("Error fetching deleted projects:", projectsError)

    return (
        <div className="flex h-[calc(100vh-theme(spacing.24))] flex-col max-w-full overflow-hidden w-full gap-4 animate-in fade-in zoom-in-95 duration-500">
            <TrashClient initialTasks={tasks || []} initialProjects={projects || []} />
        </div>
    )
}
