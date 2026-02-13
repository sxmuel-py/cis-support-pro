
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const envConfig: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1'); // Remove quotes if present
    envConfig[key] = value;
  }
});

const supabaseUrl = envConfig['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envConfig['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
-- Fix Self-Assign RLS Policy

DROP POLICY IF EXISTS "Technicians can update assigned tickets" ON public.tickets;

CREATE POLICY "Technicians can update tickets" ON public.tickets
  FOR UPDATE
  USING (
    (assigned_to = auth.uid()) OR 
    (assigned_to IS NULL)
  )
  WITH CHECK (
    (assigned_to = auth.uid())
  );
`;

async function runMigration() {
  console.log("Applying migration...");
  // Using the rpc "exec_sql" if available, or just raw query if supported by the client lib/extensions 
  // Standard supabase-js doesn't run raw SQL easily without an RPC function.
  // However, we can try running it via PostgREST if we had a function, but we don't.
  
  // ALTERNATIVE: Use the service key to update a row to see if it works? No, we need to change schema/policies.
  // Since we don't have a direct SQL runner, we'll try to use the 'pg' library if available, 
  // or guide the user to run it in the dashboard.
  
  // CHECK: Does the user have 'pg' installed?
  console.log("Checking for 'pg' module...");
  try {
    require('pg');
    console.log("'pg' module found. We could use it if we had the connection string.");
    // The .env.local usually has a wrapper, but we only have the URL/Key.
    // We cannot run DDL (CREATE POLICY) via the JS client unless we have an RPC function for it.
  } catch (e) {
    console.log("'pg' module not found.");
  }
}

// Actually, we can't run DDL from here without a connection string or an RPC.
// I will output the SQL for the user to run.
console.log("\nSince we cannot run DDL via the JS client without an RPC, please run the following SQL in your Supabase Dashboard > SQL Editor:\n");
console.log(sql);
