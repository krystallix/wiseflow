import { createClient } from "@/lib/supabase/client"
import { type TaskStatus, type TaskPriority } from "@/lib/dummy-data"

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SubtaskDraft = {
    id: string
    title: string
    is_done: boolean
}

export type Subtask = SubtaskDraft & {
    task_id: string
    sort_order?: number
    created_at: string
}

export type Task = {
    id: string
    user_id: string
    project_id: string | null
    title: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority
    category: string | null
    due_date: string | null
    position: number
    created_at: string
    updated_at: string
    // Optional fields that may come from DB or KanbanView display
    tag_id?: string
    cover_url?: string
    comments_count?: number
    attachments_count?: number
    subtasks?: Subtask[]
}

export type CreateTaskPayload = {
    title: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority
    category: string | null
    due_date: string | null
    subtasks: SubtaskDraft[]
    project_id: string | null
    cover_url?: string | null
}

// ─── Functions ─────────────────────────────────────────────────────────────────

export async function createSubtasks(taskId: string, subtasks: SubtaskDraft[]): Promise<Subtask[]> {
    if (subtasks.length === 0) return []

    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')


    const rows = subtasks.map((s, index) => ({
        id: s.id,
        task_id: taskId,
        user_id: user.id,
        title: s.title,
        is_done: s.is_done,
        sort_order: index,
    }))
    const { data, error } = await supabase
        .schema('risenwise')
        .from('task_subtasks')
        .insert(rows)
        .select()

    if (error) throw error
    return data ?? []
}

// ─── Storage ───────────────────────────────────────────────────────────────────

/**
 * Upload a cover image to Supabase Storage.
 * Path: wiseflow/{user_id}/{project-slug}/{task_id}/{uuid}.{ext}
 * Returns the public URL.
 */
export async function uploadTaskCover(
    file: File,
    userId: string,
    projectSlug: string,
    taskId: string
): Promise<string> {
    const supabase = createClient()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const randomName = crypto.randomUUID()
    const path = `${userId}/${projectSlug}/${taskId}/${randomName}.${ext}`

    const { error } = await supabase.storage
        .from('wiseflow')
        .upload(path, file, { upsert: false, contentType: file.type })

    if (error) throw error

    const { data } = supabase.storage.from('wiseflow').getPublicUrl(path)
    return data.publicUrl
}

// ─── Task CRUD ─────────────────────────────────────────────────────────────────

export async function createTask(
    payload: CreateTaskPayload,
    coverFile?: File,
    projectSlug?: string
): Promise<Task & { subtasks: Subtask[] }> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { subtasks, cover_url: _coverUrl, ...taskData } = payload

    // Step 1: Insert task (no cover_url yet — need task.id for storage path)
    const { data: task, error: taskError } = await supabase
        .schema('risenwise')
        .from('tasks')
        .insert({ ...taskData, user_id: user.id })
        .select()
        .single()

    if (taskError) throw taskError

    // Step 2: Upload cover image if provided, then patch cover_url
    let finalCoverUrl: string | null = null
    if (coverFile && projectSlug) {
        try {
            finalCoverUrl = await uploadTaskCover(coverFile, user.id, projectSlug, task.id)
            await supabase
                .schema('risenwise')
                .from('tasks')
                .update({ cover_url: finalCoverUrl, user_id: user.id })
                .eq('id', task.id)
        } catch (err) {
            console.error('Cover upload failed, task saved without image:', err)
        }
    }

    // Step 3: Insert subtasks
    const createdSubtasks = await createSubtasks(task.id, subtasks)

    return { ...task, cover_url: finalCoverUrl ?? undefined, subtasks: createdSubtasks }
}

export async function getTasks(projectId?: string): Promise<Task[]> {
    const supabase = createClient()

    let query = supabase
        .schema('risenwise')
        .from('tasks')
        .select('*, subtasks:task_subtasks(*)')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })

    if (projectId) {
        query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) throw error
    return data ?? []
}

export async function updateTask(id: string, updates: Partial<Omit<CreateTaskPayload, 'subtasks'>>): Promise<Task> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .schema('risenwise')
        .from('tasks')
        .update({ ...updates, user_id: user.id })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function editTaskDetailed(
    taskId: string,
    taskData: CreateTaskPayload,
    coverFile?: File,
    projectSlug?: string,
    removeCover?: boolean
): Promise<Task> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    let finalCoverUrl: string | undefined = undefined

    if (removeCover && !coverFile) {
        finalCoverUrl = null as any // we want to set it to null but TS might complain if exact
    } else if (coverFile && projectSlug) {
        finalCoverUrl = await uploadTaskCover(coverFile, user.id, projectSlug, taskId)
    }

    const updates: any = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        category: taskData.category,
        due_date: taskData.due_date,
        user_id: user.id
    }
    if (finalCoverUrl !== undefined) updates.cover_url = finalCoverUrl

    // 1. Update task row
    const { error: taskError } = await supabase
        .schema('risenwise')
        .from('tasks')
        .update(updates)
        .eq('id', taskId)

    if (taskError) throw taskError

    // 2. Sync subtasks
    // For simplicity, fetch existing, keep IDs that match, delete missing, insert new without ID
    const { data: existingSubtasks } = await supabase
        .schema('risenwise')
        .from('task_subtasks')
        .select('id')
        .eq('task_id', taskId)
        .is('deleted_at', null)

    const newSubtaskIds = new Set(
        taskData.subtasks.map(s => s.id).filter(id => !id.includes('-') && id.length > 20) // simplistic UUID check for existing subtasks; if we use crypto.randomUUID() for new drafts, they have dashes. Wait, Supabase IDs have dashes.
    )

    // Actually, simple sync: delete all existing, insert new ones. Wait, that changes their IDs and deletes history? Since we don't have subtask relations, it's fine, but let's try true upsert.
    // Let's just update where ID exists, insert where not, delete where not in list.
    const incomingSubtasks = taskData.subtasks

    // Delete missing
    const incomingIds = incomingSubtasks.map(s => s.id)
    if (existingSubtasks && existingSubtasks.length > 0) {
        const toDelete = existingSubtasks.filter(e => !incomingIds.includes(e.id)).map(e => e.id)
        if (toDelete.length > 0) {
            await supabase
                .schema('risenwise')
                .from('task_subtasks')
                .update({ deleted_at: new Date().toISOString() })
                .in('id', toDelete)
        }
    }

    // Upsert others
    for (let i = 0; i < incomingSubtasks.length; i++) {
        const st = incomingSubtasks[i]
        const isExisting = existingSubtasks?.some(e => e.id === st.id)
        if (isExisting) {
            await supabase
                .schema('risenwise')
                .from('task_subtasks')
                .update({ title: st.title, is_done: st.is_done, sort_order: i })
                .eq('id', st.id)
        } else {
            // New subtask, strip ID to let DB generate it
            await supabase
                .schema('risenwise')
                .from('task_subtasks')
                .insert({
                    task_id: taskId,
                    user_id: user.id,
                    title: st.title,
                    is_done: st.is_done,
                    sort_order: i
                })
        }
    }

    // 3. Refetch updated task
    const { data, error } = await supabase
        .schema('risenwise')
        .from('tasks')
        .select(`
            *,
            subtasks:task_subtasks(*)
        `)
        .eq('id', taskId)
        .is('subtasks.deleted_at', null)
        .order('sort_order', { referencedTable: 'task_subtasks', ascending: true })
        .single()

    if (error) throw error
    return data as Task
}

/**
 * Batch update positions after drag-and-drop.
 * Pass the full columns state; each task gets position = index within its column.
 */
export type TaskOrderUpdate = {
    id: string
    status: TaskStatus
    position: number
}

export async function updateTasksOrder(updates: TaskOrderUpdate[]): Promise<void> {
    if (updates.length === 0) return
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const results = await Promise.all(
        updates.map(({ id, status, position }) =>
            supabase
                .schema('risenwise')
                .from('tasks')
                .update({ status, position, user_id: user.id })
                .eq('id', id)
        )
    )

    const failed = results.find((r) => r.error)
    if (failed?.error) throw failed.error
}

export async function deleteTask(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .schema('risenwise')
        .from('tasks')
        .delete()
        .eq('id', id)

    if (error) throw error
}