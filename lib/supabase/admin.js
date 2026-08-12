import { createClient } from '@supabase/supabase-js';

// Uses the SERVICE ROLE key — bypasses all row-level security.
// Only import this inside API routes / server actions, never client components.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
