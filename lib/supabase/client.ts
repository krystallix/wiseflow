import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client for use in Client Components ('use client').
 * Call this function inside a component, not at module level.
 *
 * Returns null during static pre-rendering / build time when
 * env vars are not present (e.g. Docker builds without runtime secrets).
 * Use `getSupabase()` in utility functions that are only called in the browser.
 */
export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        // During static pre-rendering (e.g. `/_not-found`) the env vars are
        // not injected yet. Return null so callers (AuthProvider) can handle gracefully.
        return null
    }

    return createBrowserClient(url, key)
}

/**
 * Get a guaranteed non-null Supabase client.
 * Use this in utility functions that are only ever called in the browser
 * (i.e. NOT directly at module or render level in Server Components).
 */
export function getSupabase() {
    const client = createClient()
    if (!client) throw new Error('Supabase client is not available — env vars may be missing')
    return client
}
