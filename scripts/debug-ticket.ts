
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

const ticketId = "2901ffd9-4967-4fc2-a22a-5e26d565d477";

async function checkTicket() {
  console.log(`Checking ticket: ${ticketId}`);
  
  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (error) {
    console.error("Error fetching ticket:", error);
    return;
  }

  console.log("Ticket Status Check:");
  console.log("- ID:", ticket.id);
  console.log("- Status:", ticket.status);
  console.log("- Assigned To:", ticket.assigned_to);
  console.log("- Assignment Status:", ticket.assignment_status);
  console.log("- Assigned By:", ticket.assigned_by);
  console.log("- Assigned At:", ticket.assigned_at);
}

checkTicket();
