/**
 * ONE-TIME CLEANUP SCRIPT - DELETE TEST DATA BEFORE PUBLIC LAUNCH
 * Run: node scripts/clear-test-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL/Key missing. Check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim().toLowerCase()); });
  });
}

async function clearTestData() {
  console.log('\n StellarMart BD - Test Data Cleanup');
  console.log('=====================================\n');

  const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  console.log(`Orders: ${orderCount ?? '?'} ta ache`);

  const { count: itemCount } = await supabase.from('order_items').select('*', { count: 'exact', head: true });
  if (itemCount !== null) console.log(`Order Items: ${itemCount} ta ache`);

  console.log('\n WARNING: Sob test data permanently delete hobe!');
  console.log('  - Sob orders');
  console.log('  - Sob order items');
  console.log('  - Revenue zero hoye jabe (orders theke calculate hoy)\n');

  const answer = await askConfirmation('Nischit hote "DELETE" likhe Enter chap: ');

  if (answer !== 'delete') {
    console.log('\nBatil kora hoyeche. Kono data delete hoyni.');
    process.exit(0);
  }

  console.log('\nDeleting...\n');

  // Delete order_items first (foreign key)
  const { error: e1 } = await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e1) {
    if (e1.code === '42P01') console.log('  order_items table nei, skip.');
    else console.error('  order_items error:', e1.message);
  } else {
    console.log('  order_items - delete hoyeche');
  }

  // Delete orders
  const { error: e2 } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e2) console.error('  orders error:', e2.message);
  else console.log(`  orders - ${orderCount} ta delete hoyeche`);

  // Check revenue table
  const { error: revCheckErr } = await supabase.from('revenue').select('id', { count: 'exact', head: true });
  if (!revCheckErr) {
    const { error: e3 } = await supabase.from('revenue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e3) console.error('  revenue error:', e3.message);
    else console.log('  revenue - delete hoyeche');
  } else {
    console.log('  Alada revenue table nei (orders thekei calculate hoy)');
  }

  // Check transactions table
  const { error: txCheckErr } = await supabase.from('transactions').select('id', { count: 'exact', head: true });
  if (!txCheckErr) {
    const { error: e4 } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e4) console.error('  transactions error:', e4.message);
    else console.log('  transactions - delete hoyeche');
  }

  console.log('\n=====================================');
  console.log('Sob test data saflyvabe delete hoyeche!');
  console.log('Website ekhon public launch er jonno ready!\n');
}

clearTestData().catch((err) => { console.error('Script error:', err); process.exit(1); });
