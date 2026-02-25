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
        {
            id: 'task-1',
            title: 'Develop API Endpoints',
            description: 'Build the necessary REST API endpoints for the app',
            category: 'Back-End',
            tag_id: 'D-149',
            status: 'todo',
            priority: 'High',
            comments_count: 2,
            attachments_count: 1,
            created_at: '2026-02-20T08:00:00Z',
            subtasks: [
                { id: 'st-1-1', task_id: 'task-1', title: 'Design endpoint structure', is_done: true, sort_order: 0 },
                { id: 'st-1-2', task_id: 'task-1', title: 'Write authentication middleware', is_done: false, sort_order: 1 },
                { id: 'st-1-3', task_id: 'task-1', title: 'Implement CRUD for tasks', is_done: false, sort_order: 2 },
            ],
        },
        {
            id: 'task-2',
            title: 'Ensure Responsive Design',
            description: 'Test and adjust the UI for all screen sizes',
            category: 'Front-End',
            tag_id: 'D-148',
            status: 'todo',
            priority: 'Low',
            comments_count: 8,
            attachments_count: 7,
            due_date: '2026-03-01',
            created_at: '2026-02-21T08:00:00Z',
            subtasks: [
                { id: 'st-2-1', task_id: 'task-2', title: 'Mobile breakpoints', is_done: false, sort_order: 0 },
                { id: 'st-2-2', task_id: 'task-2', title: 'Tablet layout review', is_done: false, sort_order: 1 },
            ],
        },
        {
            id: 'task-3',
            title: 'Implement UI Components',
            description: 'Develop reusable front-end components library',
            category: 'Front-End',
            tag_id: 'D-147',
            status: 'todo',
            priority: 'Medium',
            comments_count: 1,
            attachments_count: 9,
            created_at: '2026-02-22T08:00:00Z',
            subtasks: [],
        },
    ],
    in_progress: [
        {
            id: 'task-4',
            title: 'Create Clickable Prototype',
            description: 'Landing page prototype for the management app',
            category: 'UI/UX Design',
            tag_id: 'D-146',
            status: 'in_progress',
            priority: 'High',
            comments_count: 23,
            attachments_count: 18,
            cover_url: "data:image/svg+xml;utf8,<svg width='200' height='100' xmlns='http://www.w3.org/2000/svg'><rect width='200' height='100' fill='%23f1f5f9'/><path d='M10,20 Q40,50 80,10 T150,70' fill='none' stroke='%233b82f6' strokeWidth='1.5' opacity='0.7'/><path d='M20,90 Q70,20 120,60 T190,30' fill='none' stroke='%233b82f6' strokeWidth='1.5' opacity='0.7'/><rect x='10' y='10' width='30' height='20' rx='2' fill='%23bfdbfe'/><rect x='150' y='60' width='40' height='30' rx='2' fill='%23bfdbfe'/><circle cx='80' cy='10' r='3' fill='%2360a5fa'/></svg>",
            due_date: '2026-02-28',
            created_at: '2026-02-18T08:00:00Z',
            subtasks: [
                { id: 'st-4-1', task_id: 'task-4', title: 'Wireframe screens', is_done: true, sort_order: 0 },
                { id: 'st-4-2', task_id: 'task-4', title: 'High-fidelity mockup', is_done: false, sort_order: 1 },
                { id: 'st-4-3', task_id: 'task-4', title: 'Prototype interactions', is_done: false, sort_order: 2 },
                { id: 'st-4-4', task_id: 'task-4', title: 'User testing session', is_done: false, sort_order: 3 },
            ],
        },
        {
            id: 'task-5',
            title: 'Choose Tech Stack',
            description: 'Decide on the front-end & back-end technologies',
            category: 'UI/UX Design',
            tag_id: 'D-145',
            status: 'in_progress',
            priority: 'Medium',
            comments_count: 71,
            attachments_count: 28,
            created_at: '2026-02-19T08:00:00Z',
            subtasks: [
                { id: 'st-5-1', task_id: 'task-5', title: 'Research frameworks', is_done: true, sort_order: 0 },
                { id: 'st-5-2', task_id: 'task-5', title: 'Benchmark performance', is_done: false, sort_order: 1 },
            ],
        },
    ],
    done: [
        {
            id: 'task-6',
            title: 'Database Setup',
            description: 'Initialize Supabase project and define schema',
            category: 'Back-End',
            tag_id: 'D-144',
            status: 'done',
            priority: 'High',
            comments_count: 14,
            attachments_count: 3,
            created_at: '2026-02-15T08:00:00Z',
            subtasks: [
                { id: 'st-6-1', task_id: 'task-6', title: 'Create Supabase project', is_done: true, sort_order: 0 },
                { id: 'st-6-2', task_id: 'task-6', title: 'Define tables & RLS', is_done: true, sort_order: 1 },
                { id: 'st-6-3', task_id: 'task-6', title: 'Setup storage buckets', is_done: true, sort_order: 2 },
            ],
        },
    ],
    cancel: [],
};
