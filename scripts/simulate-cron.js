/**
 * Local Cron Simulator
 * 
 * Simulates Vercel Cron by automatically triggering the email processing endpoint
 * every 60 seconds. This saves you from running the curl command manually.
 * 
 * Usage: node scripts/simulate-cron.js
 */

const CRON_URL = 'http://localhost:3000/api/cron/process-emails';
// Use the secret from env or fallback to the one we know
const CRON_SECRET = process.env.CRON_SECRET || 'Kx9mP2vL8nQ4rT6wY1zB5cD7fG3hJ0kM';

console.log('\n🔄 Starting Local Cron Simulator...');
console.log(`Target: ${CRON_URL}`);
console.log('Interval: Every 60 seconds');
console.log('Press Ctrl+C to stop.\n');

async function triggerCron() {
  const timestamp = new Date().toLocaleTimeString();
  try {
    process.stdout.write(`[${timestamp}] Triggering job... `);
    
    const response = await fetch(CRON_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.results.processed > 0 || data.results.errors > 0) {
      console.log('✅ Done!');
      console.log('   Stats:', JSON.stringify(data.results, null, 2));
    } else {
      console.log('💤 No new emails.');
    }

    if (data.results.errorDetails && data.results.errorDetails.length > 0) {
        console.log('   ⚠️ Errors:', JSON.stringify(data.results.errorDetails, null, 2));
    }

  } catch (error) {
    console.log('❌ Failed!');
    console.error('   Error:', error.message);
    if (error.cause) console.error('   Cause:', error.cause);
  }
}

// Run immediately on start
triggerCron();

// Then run every 60 seconds
setInterval(triggerCron, 60 * 1000);
