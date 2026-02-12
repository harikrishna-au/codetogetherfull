import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
    throw new Error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_KEY in .env');
}

// Use service role key to bypass RLS for server-side operations
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY;

export const supabase = createClient(env.SUPABASE_URL, supabaseKey, {
    auth: {
        persistSession: false,
    },
});
