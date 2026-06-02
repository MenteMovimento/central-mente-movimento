import { createClient } from '@supabase/supabase-js'

const env = import.meta.env as Record<string, string | undefined>

export const supabaseUrl = env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ??
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''

export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0

const authStorageKey = 'central-mm-auth-token'

const authStorage =
  typeof window === 'undefined'
    ? undefined
    : {
        getItem: (key: string) => window.sessionStorage.getItem(key),
        setItem: (key: string, value: string) => window.sessionStorage.setItem(key, value),
        removeItem: (key: string) => window.sessionStorage.removeItem(key),
      }

const clearPersistentSupabaseAuth = () => {
  if (typeof window === 'undefined') return

  try {
    Object.keys(window.localStorage)
      .filter((key) => /^sb-.*-auth-token$/.test(key) || key === 'supabase.auth.token')
      .forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Sem impacto quando o browser bloqueia localStorage.
  }
}

clearPersistentSupabaseAuth()

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: authStorageKey,
        ...(authStorage ? { storage: authStorage } : {}),
      },
    })
  : null
