const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log('🔄 Starting DB Explorer RPC schema migration...');
  
  const migrationPath = path.join(__dirname, 'db_explorer_rpc.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationPath, 'utf8');
  
  // Split by STATEMENT separator
  const statements = sqlContent
    .split('-- STATEMENT')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  console.log(`📋 Found ${statements.length} SQL statements to execute.`);

  for (let i = 0; i < statements.length; i++) {
    const rawStmt = statements[i];
    
    // Use statement as-is
    const stmt = rawStmt;
    
    console.log(`\nExecuting statement [${i + 1}/${statements.length}]:`);
    console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));

    const { data, error } = await supabase.rpc('exec_sql', { query_sql: stmt });

    if (error) {
      console.error(`❌ Statement [${i + 1}] failed:`, error.message);
      console.error('SQL details:', stmt);
      process.exit(1);
    } else {
      if (data && data.error) {
        console.error(`❌ Statement [${i + 1}] returned error:`, data.error);
        console.error('SQL details:', stmt);
        process.exit(1);
      }
      console.log('✅ Success');
    }
  }

  console.log('\n🎉 Notifications schema migration executed successfully!');
}

runMigrations().catch(console.error);
