import { createClient } from "@supabase/supabase-js";

// Service client — bypasses RLS, used for all server-side operations
export function createServiceClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}
