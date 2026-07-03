import supabase from './lib/supabase.js';

async function testDelete() {
  console.log('--- DRY RUN DELETE CATEGORY whole ---');
  
  // 1. Fetch products in category
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name')
    .eq('category_id', 'whole');
  console.log('Products in category "whole":', products, 'Error:', prodErr);

  if (products && products.length > 0) {
    const productIds = products.map(p => p.id);
    // 2. Fetch edits referencing these products
    const { data: edits, error: editsErr } = await supabase
      .from('product_edits')
      .select('id, product_id, product_name')
      .in('product_id', productIds);
    console.log('Edits referencing these products:', edits, 'Error:', editsErr);
  }

  // 3. Try to delete the category
  const { data: deleteRes, error: delErr } = await supabase
    .from('categories')
    .delete()
    .eq('id', 'whole');
  console.log('Result of deleting category "whole":', deleteRes, 'Error:', delErr);
}

testDelete().catch(console.error);
