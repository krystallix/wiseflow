import { createClient } from "@/lib/supabase/server"

async function getClient() {
    const sb = await createClient()
    if (!sb) throw new Error('Supabase server client not available')
    return sb
}

export type Note = {
    id: string
    user_id: string
    title: string
    content: string | null
    deleted_at: string | null
    created_at: string
    updated_at: string
}

/**
 * Get all active notes (deleted_at IS NULL) for the current user.
 */
export async function getNotes(): Promise<Note[]> {
    const supabase = await getClient()

    const { data, error } = await supabase
        .schema('risenwise')
        .from('notes')
        .select('*')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })

    if (error) throw error
    return data ?? []
}

/**
 * Get all recently-deleted notes (deleted_at IS NOT NULL) for the current user.
 */
export async function getDeletedNotes(): Promise<Note[]> {
    const supabase = await getClient()

    const { data, error } = await supabase
        .schema('risenwise')
        .from('notes')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

    if (error) throw error
    return data ?? []
}

/**
 * Get a single note by id.
 */
export async function getNoteById(id: string): Promise<Note | null> {
    const supabase = await getClient()

    const { data, error } = await supabase
        .schema('risenwise')
        .from('notes')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error
    return data
}

/**
 * Create a new note.
 */
export async function createNote(title: string, content: string = '') {
    const supabase = await getClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .schema('risenwise')
        .from('notes')
        .insert({
            title,
            content,
            user_id: user.id,
        })
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * Update a note's title and/or content.
 */
export async function updateNote(id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) {
    const supabase = await getClient()

    const { data, error } = await supabase
        .schema('risenwise')
        .from('notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * Soft-delete a note (set deleted_at to now).
 */
export async function softDeleteNote(id: string) {
    const supabase = await getClient()

    const { error } = await supabase
        .schema('risenwise')
        .from('notes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

    if (error) throw error
}

/**
 * Restore a soft-deleted note (set deleted_at to null).
 */
export async function restoreNote(id: string) {
    const supabase = await getClient()

    const { data, error } = await supabase
        .schema('risenwise')
        .from('notes')
        .update({ deleted_at: null })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * Permanently delete a note.
 */
export async function permanentlyDeleteNote(id: string) {
    const supabase = await getClient()

    const { error } = await supabase
        .schema('risenwise')
        .from('notes')
        .delete()
        .eq('id', id)

    if (error) throw error
}
