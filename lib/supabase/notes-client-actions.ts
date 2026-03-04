/**
 * Client-side note mutations — uses the browser Supabase client.
 * Import these from Client Components only.
 */
import { getSupabase as createClient } from "@/lib/supabase/client"
import type { Note } from "./notes"

export async function createNoteClient(title: string, content: string = ''): Promise<Note> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .schema('risenwise')
        .from('notes')
        .insert({ title, content, user_id: user.id })
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateNoteClient(
    id: string,
    updates: Partial<Pick<Note, 'title' | 'content'>>
): Promise<Note> {
    const supabase = createClient()

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

export async function softDeleteNoteClient(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .schema('risenwise')
        .from('notes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

    if (error) throw error
}

export async function restoreNoteClient(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .schema('risenwise')
        .from('notes')
        .update({ deleted_at: null })
        .eq('id', id)

    if (error) throw error
}

export async function permanentlyDeleteNoteClient(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .schema('risenwise')
        .from('notes')
        .delete()
        .eq('id', id)

    if (error) throw error
}