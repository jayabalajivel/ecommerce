import supabase from './lib/supabase.js';

async function inspectDb() {
  console.log('Querying foreign key constraints in Supabase...');
  const { data, error } = await supabase.rpc('get_foreign_keys');
  
  if (error) {
    console.log('RPC get_foreign_keys not found or failed, querying pg_catalog...');
    const query = `
      SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY';
    `;
    // We don't have a direct sql query execution in supabase client unless we use a custom function or RPC,
    // or we can run it via a simple express endpoint or pg client if pg is installed.
    // Let's check if we can run RPC with sql.
    console.error(error);
  } else {
    console.log('Foreign keys:', data);
  }
}

inspectDb().catch(console.error);
