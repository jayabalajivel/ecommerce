import supabase from './lib/supabase.js';

async function clearData() {
  console.log('🧹 Starting cleanup of orders, sessions, profiles, and auth users...');

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

  // 4. Clear Customer Profiles (keep admin profile)
  const { data: profilesData, error: profilesErr } = await supabase
    .from('profiles')
    .delete()
    .neq('role', 'admin')
    .select();
  if (profilesErr) console.error('❌ Error clearing profiles:', profilesErr);
  else console.log(`✅ Success! Deleted ${profilesData?.length || 0} customer profiles.`);

  // 5. Clear Auth Users (except admin)
  const adminEmail = (process.env.ADMIN_EMAIL || 'maduraimadasamyidlipodi@gmail.com').trim().toLowerCase();
  console.log('🧹 Listing and deleting all customer accounts from Supabase Auth...');
  try {
    const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    
    if (listErr) {
      console.error('❌ Error listing auth users:', listErr);
    } else if (users && users.length > 0) {
      let deletedCount = 0;
      for (const u of users) {
        if (u.email && u.email.toLowerCase() !== adminEmail) {
          const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
          if (delErr) {
            console.error(`❌ Error deleting auth user ${u.email}:`, delErr);
          } else {
            console.log(`✅ Deleted auth user: ${u.email}`);
            deletedCount++;
          }
        }
      }
      console.log(`✅ Success! Deleted ${deletedCount} auth users.`);
    } else {
      console.log('✅ No auth users found to delete.');
    }
  } catch (authErr) {
    console.error('❌ Authentication API error during cleanup:', authErr);
  }
}

clearData().catch(console.error);
