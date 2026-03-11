import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazily initialised so missing env vars don't crash the build —
// the client is only created when a request actually calls getSupabaseAdmin().
let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing Supabase credentials: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment."
      );
    }
    _client = createClient(url, key);
  }
  return _client;
}
