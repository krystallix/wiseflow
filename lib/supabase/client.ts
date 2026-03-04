import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client for use in Client Components ('use client').
 * Call this function inside a component, not at module level.
 *
 * Returns null during static pre-rendering / build time when
 * env vars are not present (e.g. Docker builds without runtime secrets).
 */
export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        // During static pre-rendering (e.g. `/_not-found`) the env vars are
        // not injected yet. Return null so callers can handle this gracefully.
        return null
    }

    return createBrowserClient(url, key)
}
