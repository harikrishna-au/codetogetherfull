import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
    throw new Error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_KEY in .env');
}

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
    auth: {
        persistSession: false,
    },
});
