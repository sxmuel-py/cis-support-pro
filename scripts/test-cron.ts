// Quick test script to check if the cron endpoint works locally
// Run with: npx tsx scripts/test-cron.ts

async function testCron() {
  const url = 'http://localhost:3000/api/cron/process-emails';
  
  console.log('Testing cron endpoint locally...');
  console.log('URL:', url);
  console.log('');
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'Kx9mP2vL8nQ4rT6wY1zB5cD7fG3hJ0kM'}`
      }
    });
    
    console.log('Status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCron();
