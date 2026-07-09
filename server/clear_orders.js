import supabase from './lib/supabase.js';

async function clearData() {
  console.log('🧹 Starting cleanup of orders, sessions, and audit logs...');

  // 1. Clear Product Edits (Audit logs) - Must be cleared first due to foreign key referencing admin_sessions
  const { data: editsData, error: editsErr } = await supabase
    .from('product_edits')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Matches all UUIDs
    .select();
  if (editsErr) console.error('❌ Error clearing audit logs (product_edits):', editsErr);
  else console.log(`✅ Success! Deleted ${editsData?.length || 0} product edit audit logs.`);

  // 2. Clear Admin Sessions (Session logs)
  const { data: sessionsData, error: sessionsErr } = await supabase
    .from('admin_sessions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select();
  if (sessionsErr) console.error('❌ Error clearing session logs (admin_sessions):', sessionsErr);
  else console.log(`✅ Success! Deleted ${sessionsData?.length || 0} admin session logs.`);

  // 3. Clear Orders
  const { data: ordersData, error: ordersErr } = await supabase
    .from('orders')
    .delete()
    .neq('id', '')
    .select();
  if (ordersErr) console.error('❌ Error clearing orders:', ordersErr);
  else console.log(`✅ Success! Deleted ${ordersData?.length || 0} orders.`);
}

clearData().catch(console.error);
