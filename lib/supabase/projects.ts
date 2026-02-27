import { createClient } from "@/lib/supabase/client"

export type Project = {
    id: string
    user_id: string
    name: string
    slug: string
    icon: string
    description: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
}

function toSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export async function getProjects(): Promise<Project[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .schema('risenwise')
        .from('projects')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
    const supabase = createClient()
    const { data, error } = await supabase
        .schema('risenwise')
        .from('projects')
        .select('*')
        .is('deleted_at', null)
        .eq('slug', slug)
        .single()

    if (error) throw error
    return data
}

export async function createProject(name: string, icon: string, description: string) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .schema('risenwise')
        .from('projects')
        .insert({
            name,
            slug: toSlug(name),
            icon,
            description,
            user_id: user.id,
        })

    if (error) throw error
    return data
}