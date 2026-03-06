/**
 * Client-side weekly tasks — uses the browser Supabase client.
 * Import these from Client Components only.
 *
 * day_of_week values:
 *   0–6 = Sunday–Saturday (weekly routine, resets every Monday)
 *   7   = "Today's Priorities" (daily focus, resets every day)
 */
import { getSupabase as createClient } from '@/lib/supabase/client'

const SCHEMA = 'risenwise'

// ─── Types ──────────────────────────────────────────────────────────────────

export const DAY_DAILY = 7 // special value for daily priorities

export type WeeklyTask = {
    id: string
    user_id: string
    day_of_week: number  // 0 = Sunday … 6 = Saturday, 7 = daily priority
    title: string
    is_done: boolean
    sort_order: number
    last_reset_at: string
    created_at: string
    updated_at: string
    deleted_at: string | null
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getWeeklyTasks(): Promise<WeeklyTask[]> {
    const sb = createClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('weekly_tasks')
        .select('*')
        .is('deleted_at', null)
        .order('day_of_week')
        .order('sort_order')
    if (error) throw error
    return data ?? []
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createWeeklyTask(dayOfWeek: number, title: string): Promise<WeeklyTask> {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get the next sort_order for this day
    const { data: existing } = await sb
        .schema(SCHEMA)
        .from('weekly_tasks')
        .select('sort_order')
        .eq('day_of_week', dayOfWeek)
        .is('deleted_at', null)
        .order('sort_order', { ascending: false })
        .limit(1)

    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

    const { data, error } = await sb
        .schema(SCHEMA)
        .from('weekly_tasks')
        .insert({
            user_id: user.id,
            day_of_week: dayOfWeek,
            title,
            sort_order: nextOrder,
        })
        .select()
        .single()
    if (error) throw error
    return data
}

export async function updateWeeklyTask(
    id: string,
    updates: Partial<Pick<WeeklyTask, 'title' | 'is_done' | 'sort_order' | 'day_of_week'>>
): Promise<WeeklyTask> {
    const sb = createClient()
    const { data, error } = await sb
        .schema(SCHEMA)
        .from('weekly_tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

export async function deleteWeeklyTask(id: string): Promise<void> {
    const sb = createClient()
    const { error } = await sb
        .schema(SCHEMA)
        .from('weekly_tasks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
    if (error) throw error
}

/**
 * Reset weekly routine tasks (day 0–6) to is_done=false.
 * Called when last_reset_at < this week's Monday.
 */
export async function resetWeeklyRoutineTasks(): Promise<void> {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await sb
        .schema(SCHEMA)
        .from('weekly_tasks')
        .update({
            is_done: false,
            last_reset_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .lt('day_of_week', 7) // only routine days 0–6
    if (error) throw error
}

/**
 * Reset daily priority tasks (day=7) to is_done=false.
 * Called when last_reset_at < today 00:00.
 */
export async function resetDailyPriorityTasks(): Promise<void> {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await sb
        .schema(SCHEMA)
        .from('weekly_tasks')
        .update({
            is_done: false,
            last_reset_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('day_of_week', DAY_DAILY)
        .is('deleted_at', null)
    if (error) throw error
}

/**
 * Reset ALL tasks (both weekly + daily) — manual reset button.
 */
export async function resetAllWeeklyTasks(): Promise<void> {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await sb
        .schema(SCHEMA)
        .from('weekly_tasks')
        .update({
            is_done: false,
            last_reset_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .is('deleted_at', null)
    if (error) throw error
}
