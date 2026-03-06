import WeeklyTasksClient from './weekly-tasks-client'

export const metadata = {
    title: 'Weekly Tasks · Wiseflow',
    description: 'Plan your recurring weekly tasks for each day',
}

export default function WeeklyTasksPage() {
    return <WeeklyTasksClient />
}
