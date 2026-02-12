
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', url);
console.log('Key:', key ? key.substring(0, 10) + '...' : 'MISSING');

if (!url || !key) {
    console.error('Missing credentials!');
    process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
    try {
        const start = Date.now();
        console.log('Attempting to fetch questions count...');
        const { count, error } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Connection FAILED with Supabase Error:', error);
        } else {
            console.log('Connection SUCCESS!');
            console.log('Questions count:', count);
        }
        console.log('Time taken:', Date.now() - start, 'ms');
    } catch (e) {
        console.error('Connection FAILED with Exception:', e);
    }
}

testConnection();
