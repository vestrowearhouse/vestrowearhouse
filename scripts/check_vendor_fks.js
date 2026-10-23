require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkFKs() {
  const sql = `
    SELECT 
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu 
      ON tc.constraint_name = kcu.constraint_name 
    JOIN information_schema.constraint_column_usage AS ccu 
      ON ccu.constraint_name = tc.constraint_name 
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND ccu.table_name = 'vendors'
  `;

  const res = await supabase.rpc('exec_sql', { query: sql });
  console.log('Foreign keys referencing vendors:', res.data);

  // Also check products and vendor_products
  const prodFk = await supabase.rpc('exec_sql', {
    query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name IN ('products', 'vendor_products') AND column_name LIKE '%vendor%'`
  });
  console.log('Vendor columns in products/vendor_products:', prodFk.data);
}

checkFKs();
