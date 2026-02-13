
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('--- User States Debug ---');

    const { data: users, error } = await supabase
        .from('user_states')
        .select('*');

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.table(users);

    const activeCount = users?.filter(u => u.is_active).length;
    const waitingCount = users?.filter(u => u.state === 'waiting').length;

    console.log(`Total: ${users?.length}`);
    console.log(`Active: ${activeCount}`);
    console.log(`Waiting: ${waitingCount}`);
}

main();
