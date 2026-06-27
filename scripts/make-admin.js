const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    envVars[match[1]] = (match[2] || '').trim();
  }
});

const databaseUrl = envVars.DATABASE_URL;
const email = process.argv[2];

if (!email) {
  console.error('Please provide the user email: node scripts/make-admin.js user@example.com');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    
    // Find the user id in auth.users
    const userRes = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      console.error(`No user found with email: ${email}`);
      return;
    }
    
    const userId = userRes.rows[0].id;
    
    // Update profile role
    await client.query("UPDATE public.profiles SET role = 'admin' WHERE id = $1", [userId]);
    console.log(`Successfully promoted ${email} to admin!`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
