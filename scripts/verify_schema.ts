import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Try loading .env.local first
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
}
dotenv.config(); // Load .env as fallback/supplement

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log("Verifying 'crew' table schema...");
    const { data, error } = await supabase.from('crew').select('sort_order').limit(1);

    if (error) {
        console.error("Error querying 'crew':", error.message);
    } else {
        console.log("Success! 'crew' table has 'sort_order'.");
    }

    console.log("Verifying 'scenes' table schema...");
    const { data: scenesData, error: scenesError } = await supabase.from('scenes').select('sort_order').limit(1);

    if (scenesError) {
        console.error("Error querying 'scenes':", scenesError.message);
    } else {
        console.log("Success! 'scenes' table has 'sort_order'.");
    }
}

verify();
