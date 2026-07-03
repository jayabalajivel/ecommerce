import React, { useEffect, useState } from 'react';
import { Search, Edit2, X, Check, Plus, Minus, Package } from 'lucide-react';
import { productsApi } from '../../lib/api';
import type { Product, Category } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminProducts() {
  const { adminSessionId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Category Management State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [catForm, setCatForm] = useState<Partial<Category>>({});

  useEffect(() => {
    Promise.all([
      productsApi.list().then(r => setProducts(r.products)),
      productsApi.categories().then(r => setCategories(r.categories))
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setIsCreating(false);
    setForm({
      category_id: p.category_id,
      name: p.name,
      description: p.description,
      price: p.price,
      original_price: p.original_price,
      weight_grams: p.weight_grams,
      weight_label: p.weight_label,
      stock_qty: p.stock_qty,
      image_url: p.image_url,
      badge: p.badge || '',
    });
  }

  function openCreate() {
    setEditProduct({} as Product); // Dummy object to open modal
    setIsCreating(true);
    setForm({
      category_id: categories.length > 0 ? categories[0].id : '', // default
      name: '',
      description: '',
      price: 0,
      original_price: 0,
      weight_grams: 100,
      weight_label: '100g',
      stock_qty: 10,
      image_url: '',
      badge: '',
    });
  }

  async function handleSave() {
    if (!editProduct) return;
    setSaving(true);
    try {
      if (isCreating) {
        const result = await productsApi.create({ ...form, session_id: adminSessionId || undefined });
        setProducts(prev => [...prev, result.product]);
        showToast('Product created successfully!');
      } else {
        const result = await productsApi.update(editProduct.id, { ...form, session_id: adminSessionId || undefined });
        setProducts(prev => prev.map(p => p.id === editProduct.id ? result.product : p));
        showToast(`Product updated (${result.edits_logged} change${result.edits_logged !== 1 ? 's' : ''} logged)`);
      }
      setEditProduct(null);
      setIsCreating(false);
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editProduct || isCreating) return;
    if (!confirm('Are you sure you want to delete this product?')) return;
    setSaving(true);
    try {
      await productsApi.delete(editProduct.id);
      setProducts(prev => prev.filter(p => p.id !== editProduct.id));
      setEditProduct(null);
      showToast('Product deleted successfully');
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickStock(product: Product, delta: number) {
    const newStock = Math.max(0, product.stock_qty + delta);
    try {
      const result = await productsApi.updateStock(product.id, newStock, adminSessionId || undefined);
      setProducts(prev => prev.map(p => p.id === product.id ? result.product : p));
      showToast(`Stock updated to ${newStock}`);
    } catch (err: any) {
      showToast('Error: ' + err.message);
    }
  }

  const filtered = products.filter(p =>
    search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Product Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{products.length} products · Click Edit to update details</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <button
            onClick={async () => {
              setShowCategoryModal(true);
              setLoadingCats(true);
              try {
                const res = await productsApi.categories();
                setCategories(res.categories);
              } catch (e: any) { showToast(e.message); }
              setLoadingCats(false);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors flex-1 sm:flex-none"
          >
            Manage Categories
          </button>
          <div className="relative flex-1 sm:flex-none min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-56"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all shadow-md shadow-primary/20 flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(product => (
            <div key={product.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <img src={product.image_url} alt={product.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-muted" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-foreground truncate">{product.name}</span>
                    {product.badge && (
                      <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium flex-shrink-0">{product.badge}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-sm font-bold text-primary">₹{product.price}</span>
                    <span className="text-xs line-through text-muted-foreground">₹{product.original_price}</span>
                    <span className="text-xs text-muted-foreground">{product.weight_label} ({product.weight_grams}g)</span>
                    <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded-full">{product.category_id}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-0 border-border/50 pt-3 sm:pt-0 mt-2 sm:mt-0">
                {/* Stock quick-edit */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <div className="text-center mr-2">
                    <div className={`text-xs font-medium ${product.stock_qty === 0 ? 'text-red-600' : product.stock_qty <= 10 ? 'text-amber-600' : 'text-green-600'}`}>
                      {product.stock_qty === 0 ? 'Out of Stock' : `Stock: ${product.stock_qty}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-muted rounded-lg overflow-hidden">
                    <button onClick={() => handleQuickStock(product, -1)} className="px-2 py-1.5 hover:bg-muted/80 transition-colors">
                      <Minus className="w-3 h-3 text-foreground" />
                    </button>
                    <span className="text-sm font-bold min-w-[2rem] text-center">{product.stock_qty}</span>
                    <button onClick={() => handleQuickStock(product, 1)} className="px-2 py-1.5 hover:bg-muted/80 transition-colors">
                      <Plus className="w-3 h-3 text-foreground" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => openEdit(product)}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                {isCreating ? 'Add New Product' : 'Edit Product'}
              </h3>
              <button onClick={() => { setEditProduct(null); setIsCreating(false); }} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                <select
                  value={form.category_id ?? (categories.length > 0 ? categories[0].id : '')}
                  onChange={e => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  {categories.length === 0 && <option value="" disabled>No categories available</option>}
                </select>
              </div>
              {[
                { label: 'Product Name', key: 'name', type: 'text' },
                { label: 'Price (₹)', key: 'price', type: 'number' },
                { label: 'Original Price (₹)', key: 'original_price', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key] ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea
                  value={form.description ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              {/* Weight fields — 2 column grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Weight (grams)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.weight_grams ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, weight_grams: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Weight Label (e.g. 100g)</label>
                  <input
                    type="text"
                    value={form.weight_label ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, weight_label: e.target.value }))}
                    placeholder="e.g. 100g, 250g, 1kg"
                    className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Stock Quantity
                  {(form.stock_qty ?? 0) === 0 && <span className="ml-2 text-xs text-red-500 font-normal">Out of stock</span>}
                  {(form.stock_qty ?? 0) > 0 && (form.stock_qty ?? 0) <= 10 && <span className="ml-2 text-xs text-amber-500 font-normal">Low stock</span>}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, stock_qty: Math.max(0, (prev.stock_qty ?? 0) - 1) }))}
                    className="w-9 h-9 flex items-center justify-center bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={form.stock_qty ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, stock_qty: Math.max(0, Number(e.target.value)) }))}
                    className="flex-1 px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-center font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, stock_qty: (prev.stock_qty ?? 0) + 1 }))}
                    className="w-9 h-9 flex items-center justify-center bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Badge */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Badge (optional)</label>
                <input
                  type="text"
                  value={form.badge ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, badge: e.target.value }))}
                  placeholder="e.g. Bestseller, Organic, Premium"
                  className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Image</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={form.image_url ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="Image URL or upload"
                    className="flex-1 px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <label className="flex-shrink-0 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium cursor-pointer hover:bg-muted/80 transition-colors flex items-center justify-center border border-border">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            showToast('Image must be less than 2MB');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setForm(prev => ({ ...prev, image_url: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {form.image_url && (
                  <img src={form.image_url} alt="preview" className="mt-2 w-20 h-20 rounded-lg object-cover bg-muted border border-border shadow-sm" />
                )}
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              {!isCreating && (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2.5 bg-red-100 text-red-700 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-60 flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Delete
                </button>
              )}
              <div className="flex-1" />
              <button onClick={() => { setEditProduct(null); setIsCreating(false); }} className="px-6 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Manage Categories</h3>
              <button onClick={() => { setShowCategoryModal(false); setEditCat(null); }} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              {editCat ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">{isCreatingCat ? 'New Category' : 'Edit Category'}</h4>
                    <button onClick={() => setEditCat(null)} className="text-sm text-muted-foreground hover:text-foreground">Back to list</button>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">ID (lowercase, no spaces)</label>
                    <input disabled={!isCreatingCat} value={catForm.id || ''} onChange={e => setCatForm(p => ({...p, id: e.target.value.toLowerCase().replace(/\\s+/g, '-')}))} placeholder="e.g. spices" className="w-full px-3 py-2 bg-input border border-border rounded-lg disabled:opacity-60" />
                    {!isCreatingCat && <p className="text-xs text-muted-foreground mt-1">Category ID cannot be changed once created.</p>}
                  </div>
                  <div><label className="block text-sm mb-1">Name</label><input value={catForm.name || ''} onChange={e => setCatForm(p => ({...p, name: e.target.value}))} className="w-full px-3 py-2 bg-input border border-border rounded-lg" /></div>
                  <div><label className="block text-sm mb-1">Description</label><textarea value={catForm.description || ''} onChange={e => setCatForm(p => ({...p, description: e.target.value}))} className="w-full px-3 py-2 bg-input border border-border rounded-lg" /></div>
                  <div>
                    <label className="block text-sm mb-1">Category Image</label>
                    <div className="flex gap-3">
                      <input value={catForm.image_url || ''} onChange={e => setCatForm(p => ({...p, image_url: e.target.value}))} placeholder="Image URL or upload" className="flex-1 px-3 py-2 bg-input border border-border rounded-lg" />
                      <label className="flex-shrink-0 px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium cursor-pointer hover:bg-muted/80 transition-colors flex items-center justify-center border border-border">
                        Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                showToast('Image must be less than 2MB');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setCatForm(prev => ({ ...prev, image_url: reader.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    {catForm.image_url && (
                      <img src={catForm.image_url} alt="preview" className="mt-2 w-20 h-20 rounded-lg object-cover bg-muted border border-border shadow-sm" />
                    )}
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    {!isCreatingCat && (
                      <button onClick={async () => {
                        if (!confirm('Delete this category?')) return;
                        setSaving(true);
                        try { await productsApi.deleteCategory(editCat.id); setCategories(categories.filter(c => c.id !== editCat.id)); setEditCat(null); showToast('Category deleted'); }
                        catch(e:any) { showToast(e.message); } finally { setSaving(false); }
                      }} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm">Delete</button>
                    )}
                    <div className="flex-1" />
                    <button onClick={async () => {
                      setSaving(true);
                      try {
                        if (isCreatingCat) {
                          const res = await productsApi.createCategory(catForm);
                          setCategories([...categories, res.category]); showToast('Created!');
                        } else {
                          const res = await productsApi.updateCategory(editCat.id, catForm);
                          setCategories(categories.map(c => c.id === editCat.id ? res.category : c)); showToast('Updated!');
                        }
                        setEditCat(null);
                      } catch(e:any) { showToast(e.message); } finally { setSaving(false); }
                    }} disabled={saving} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm">{saving ? 'Saving...' : 'Save Category'}</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-muted-foreground">{categories.length} categories</p>
                    <button onClick={() => { setIsCreatingCat(true); setEditCat({} as Category); setCatForm({ sort_order: categories.length + 1 }); }} className="text-sm font-medium text-primary hover:underline">+ Add Category</button>
                  </div>
                  {loadingCats ? <div className="text-center text-sm py-4">Loading...</div> : (
                    <div className="grid gap-3">
                      {categories.map(c => (
                        <div key={c.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                          <div className="flex items-center gap-3">
                            <img src={c.image_url} alt="" className="w-10 h-10 rounded object-cover bg-muted" />
                            <div><div className="font-semibold text-sm">{c.name}</div><div className="text-xs text-muted-foreground">{c.id} · {c.product_count} products</div></div>
                          </div>
                          <button onClick={() => { setIsCreatingCat(false); setEditCat(c); setCatForm(c); }} className="p-2 hover:bg-muted rounded text-primary"><Edit2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium shadow-xl z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
