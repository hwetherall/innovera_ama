/**
 * Script to manually trigger the creation of a monthly session
 * Usage: node scripts/create-monthly-session.js
 */

const path = require('path');
const fs = require('fs');
// In Node.js environments, we need to use node-fetch or enable experimental fetch
// Using node-fetch as it's more stable
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables from .env.local in the project root
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading .env from:', envPath);
console.log('File exists:', fs.existsSync(envPath) ? 'Yes' : 'No');
require('dotenv').config({ path: envPath });

// Ensure the API key is available
if (!process.env.CRON_API_KEY) {
  console.error('Error: CRON_API_KEY environment variable is not set!');
  console.log('Contents of .env.local file:', fs.readFileSync(envPath, 'utf8'));
  process.exit(1);
}

async function createMonthlySession() {
  const url = 'http://localhost:3000/api/cron/monthly-session';
  
  try {
    console.log('Connecting to:', url);
    console.log('Using API key:', process.env.CRON_API_KEY ? process.env.CRON_API_KEY.substring(0, 3) + '...' : 'No key found');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.CRON_API_KEY || ''
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Success:', data.message);
      console.log('Session:', data.session);
    } else {
      console.error('Error response (Status ' + response.status + '):', data.error);
      throw new Error(data.error || 'Unknown error occurred');
    }
  } catch (error) {
    console.error('Failed to create monthly session:', error.message);
    process.exit(1);
  }
}

// Make sure the local development server is running
console.log('Make sure your Next.js server is running on http://localhost:3000');
createMonthlySession(); 