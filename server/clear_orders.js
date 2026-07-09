import supabase from './lib/supabase.js';

async function clearOrders() {
  console.log('Attempting to delete all orders from database...');
  // Deletes all rows where ID is not empty
  const { data, error, count } = await supabase
    .from('orders')
    .delete()
    .neq('id', '')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('❌ Error clearing orders:', error);
  } else {
    console.log(`✅ Success! Deleted ${data?.length || 0} orders.`);
  }
}

clearOrders().catch(console.error);
