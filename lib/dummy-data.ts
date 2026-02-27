// ─── Types (mirrors Supabase schema) ──────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancel';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export type SubTask = {
    id: string;
    task_id: string;
    title: string;
    is_done: boolean;
    sort_order: number;
};

export type Task = {
    id: string;
    project_id?: string;
    title: string;
    description: string;
    category: string;
    tag_id: string;
    status: TaskStatus;
    priority: TaskPriority;
    cover_url?: string;
    due_date?: string;
    comments_count: number;
    attachments_count: number;
    subtasks: SubTask[];
    created_at: string;
};

// ─── Dummy Data ────────────────────────────────────────────────────────────────

export const initialData: Record<TaskStatus, Task[]> = {
    todo: [

    ],
    in_progress: [

    ],
    done: [

    ],
    cancel: [],
};
