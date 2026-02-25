export type Task = {
    id: string;
    title: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    category: string;
    tagId: string;
    progress: number;
    comments: number;
    attachments: number;
    avatars: string[];
    image?: string;
};

export const initialData: Record<string, Task[]> = {
    todo: [
        {
            id: 'task-1',
            title: 'Develop API Endpoints',
            description: 'Build the necessary API endpoints',
            priority: 'High',
            category: 'Back-End',
            tagId: 'D-149',
            progress: 0,
            comments: 2,
            attachments: 1,
            avatars: ['https://github.com/shadcn.png', 'https://github.com/shadcn.png', 'https://github.com/shadcn.png']
        },
        {
            id: 'task-2',
            title: 'Ensure Responsive Design',
            description: 'Test and adjust the UI for responsive',
            priority: 'Low',
            category: 'Front-End',
            tagId: 'D-148',
            progress: 0,
            comments: 8,
            attachments: 7,
            avatars: ['https://github.com/shadcn.png', 'https://github.com/shadcn.png']
        },
        {
            id: 'task-3',
            title: 'Implement UI Components',
            description: 'Develop front-end components',
            priority: 'Medium',
            category: 'Front-End',
            tagId: 'D-147',
            progress: 0,
            comments: 1,
            attachments: 9,
            avatars: ['https://github.com/shadcn.png', 'https://github.com/shadcn.png']
        }
    ],
    in_progress: [
        {
            id: 'task-4',
            title: 'Create Clickable Prototype',
            description: 'Landing page for management app',
            priority: 'High',
            category: 'UI/UX Design',
            tagId: 'D-146',
            progress: 30,
            comments: 23,
            attachments: 18,
            avatars: ['https://github.com/shadcn.png', 'https://github.com/shadcn.png'],
            image: "data:image/svg+xml;utf8,<svg width='200' height='100' xmlns='http://www.w3.org/2000/svg'><rect width='200' height='100' fill='%23f1f5f9'/><path d='M10,20 Q40,50 80,10 T150,70' fill='none' stroke='%233b82f6' strokeWidth='1.5' opacity='0.7'/><path d='M20,90 Q70,20 120,60 T190,30' fill='none' stroke='%233b82f6' strokeWidth='1.5' opacity='0.7'/><rect x='10' y='10' width='30' height='20' rx='2' fill='%23bfdbfe'/><rect x='150' y='60' width='40' height='30' rx='2' fill='%23bfdbfe'/><circle cx='80' cy='10' r='3' fill='%2360a5fa'/></svg>"
        },
        {
            id: 'task-5',
            title: 'Choose Tech Stack',
            description: 'Decide on the FE & BE technologies',
            priority: 'Medium',
            category: 'UI/UX Design',
            tagId: 'D-145',
            progress: 20,
            comments: 71,
            attachments: 28,
            avatars: ['https://github.com/shadcn.png', 'https://github.com/shadcn.png']
        }
    ],
    done: [
        {
            id: 'task-6',
            title: 'Database Setup',
            description: 'Initialize PostgreSQL instance',
            priority: 'High',
            category: 'Back-End',
            tagId: 'D-144',
            progress: 100,
            comments: 14,
            attachments: 3,
            avatars: ['https://github.com/shadcn.png']
        }
    ],
    cancel: []
};
