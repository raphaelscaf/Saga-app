import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return a mock client if Supabase is not configured
  if (!supabaseUrl || !supabaseKey || supabaseUrl === "your_supabase_url_here") {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { code: "NOT_CONFIGURED", message: "Supabase not configured" } }), order: () => ({ data: [], error: null }), limit: () => ({ data: [], error: null }), data: [], error: null }), order: () => ({ data: [], error: null }), data: [], error: null }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: "Supabase not configured" } }) }), data: null, error: { message: "Supabase not configured" } }),
        update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: "Supabase not configured" } }) }), data: null, error: { message: "Supabase not configured" } }) }),
        delete: () => ({ eq: () => ({ data: null, error: { message: "Supabase not configured" } }) }),
      }),
    } as any;
  }

  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
