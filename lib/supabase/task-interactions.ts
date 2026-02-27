import { createClient } from '@/lib/supabase/client'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TaskComment = {
    id: string
    user_id: string
    task_id: string
    content: string
    created_at: string
}

export type TaskAttachment = {
    id: string
    user_id: string
    task_id: string
    file_name: string
    file_url: string
    file_size: number | null
    created_at: string
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .schema('risenwise')
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
}

export async function addTaskComment(taskId: string, content: string): Promise<TaskComment> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .schema('risenwise')
        .from('task_comments')
        .insert({ task_id: taskId, user_id: user.id, content })
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteTaskComment(commentId: string): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .schema('risenwise')
        .from('task_comments')
        .update({ deleted_at: new Date().toISOString(), user_id: user.id })
        .eq('id', commentId)

    if (error) throw error
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export async function getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .schema('risenwise')
        .from('task_attachments')
        .select('*')
        .eq('task_id', taskId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
}

/**
 * Upload a file to Supabase Storage and insert a record into task_attachments.
 * Storage path: wiseflow/{user_id}/attachments/{task_id}/{uuid}.{ext}
 */
export async function uploadTaskAttachment(
    file: File,
    taskId: string
): Promise<TaskAttachment> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const randomName = crypto.randomUUID()
    const path = `${user.id}/attachments/${taskId}/${randomName}.${ext}`

    // Upload to storage
    const { error: storageError } = await supabase.storage
        .from('wiseflow')
        .upload(path, file, { upsert: false, contentType: file.type })

    if (storageError) throw storageError

    const { data: urlData } = supabase.storage.from('wiseflow').getPublicUrl(path)

    // Insert record
    const { data, error } = await supabase
        .schema('risenwise')
        .from('task_attachments')
        .insert({
            task_id: taskId,
            user_id: user.id,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_size: file.size,
        })
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * Soft-delete an attachment record and remove the file from storage.
 */
export async function deleteTaskAttachment(
    attachmentId: string,
    fileUrl?: string
): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .schema('risenwise')
        .from('task_attachments')
        .update({ deleted_at: new Date().toISOString(), user_id: user.id })
        .eq('id', attachmentId)

    if (error) throw error

    if (fileUrl) {
        try {
            const url = new URL(fileUrl)
            const storagePath = url.pathname.split('/object/public/wiseflow/')[1]
            if (storagePath) {
                await supabase.storage.from('wiseflow').remove([decodeURIComponent(storagePath)])
            }
        } catch { /* non-critical */ }
    }
}

// ─── Subtasks ─────────────────────────────────────────────────────────────────

/** Toggle is_done on a subtask (optimistic-friendly). */
export async function updateSubtaskStatus(
    subtaskId: string,
    isDone: boolean
): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .schema('risenwise')
        .from('task_subtasks')
        .update({ is_done: isDone, user_id: user.id })
        .eq('id', subtaskId)

    if (error) throw error
}

// ─── Cover upload (for editing existing task) ─────────────────────────────────

/**
 * Upload a new cover image for an existing task.
 * Path: wiseflow/{user_id}/covers/{task_id}/{uuid}.{ext}
 */
export async function uploadCoverForTask(
    file: File,
    userId: string,
    taskId: string
): Promise<string> {
    const supabase = createClient()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${userId}/covers/${taskId}/${crypto.randomUUID()}.${ext}`

    const { error } = await supabase.storage
        .from('wiseflow')
        .upload(path, file, { upsert: false, contentType: file.type })

    if (error) throw error

    const { data } = supabase.storage.from('wiseflow').getPublicUrl(path)
    return data.publicUrl
}

// ─── Cascade delete ───────────────────────────────────────────────────────────

/**
 * Soft-delete a task and all related records (comments, attachments, subtasks).
 * Also removes attachment files from Supabase Storage.
 */
export async function deleteTaskCascade(taskId: string): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const now = new Date().toISOString()

    // 1. Soft-delete comments
    await supabase
        .schema('risenwise')
        .from('task_comments')
        .update({ deleted_at: now, user_id: user.id })
        .eq('task_id', taskId)
        .is('deleted_at', null)

    // 2. Fetch + remove attachments from storage, then soft-delete records
    const { data: attachments } = await supabase
        .schema('risenwise')
        .from('task_attachments')
        .select('file_url')
        .eq('task_id', taskId)
        .is('deleted_at', null)

    if (attachments && attachments.length > 0) {
        const paths = attachments.flatMap(a => {
            try {
                const url = new URL(a.file_url)
                const p = url.pathname.split('/object/public/wiseflow/')[1]
                return p ? [decodeURIComponent(p)] : []
            } catch { return [] }
        })
        if (paths.length > 0) {
            await supabase.storage.from('wiseflow').remove(paths)
        }
        await supabase
            .schema('risenwise')
            .from('task_attachments')
            .update({ deleted_at: now, user_id: user.id })
            .eq('task_id', taskId)
    }

    // 3. Soft-delete subtasks
    await supabase
        .schema('risenwise')
        .from('task_subtasks')
        .update({ deleted_at: now, user_id: user.id })
        .eq('task_id', taskId)
        .is('deleted_at', null)

    // 4. Soft-delete the task itself
    const { data: task } = await supabase
        .schema('risenwise')
        .from('tasks')
        .select('cover_url')
        .eq('id', taskId)
        .single()

    if (task?.cover_url) {
        try {
            const url = new URL(task.cover_url)
            const p = url.pathname.split('/object/public/wiseflow/')[1]
            if (p) await supabase.storage.from('wiseflow').remove([decodeURIComponent(p)])
        } catch { /* skip */ }
    }

    const { error } = await supabase
        .schema('risenwise')
        .from('tasks')
        .update({ deleted_at: now, user_id: user.id })
        .eq('id', taskId)

    if (error) throw error
}
