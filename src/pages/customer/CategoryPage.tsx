import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search, Plus, Minus, Star, AlertCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { productsApi } from '../../lib/api';
import type { Product, Category } from '../../lib/api';
import { useCart } from '../../contexts/CartContext';
import { SEO } from '../../components/SEO';

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [loading, setLoading] = useState(true);
  const { cart, addToCart, updateQty, removeItem } = useCart();

  useEffect(() => {
    if (!categoryId) return;
    setLoading(true);
    Promise.all([
      productsApi.list({ category: categoryId }),
      productsApi.categories(),
    ]).then(([prods, cats]) => {
      setProducts(prods.products);
      setCategory(cats.categories.find(c => c.id === categoryId) || null);
    }).catch(console.error).finally(() => setLoading(false));
  }, [categoryId]);

  const filtered = products.filter(p =>
    searchQ ? p.name.toLowerCase().includes(searchQ.toLowerCase()) : true
  );

  return (
    <div>
      <SEO 
        title={category?.name || categoryId || 'Category'} 
        description={category?.description || `Explore our premium collection of ${category?.name || 'spices'}.`}
      />
      {/* Category Hero */}
      <div className="relative h-44 overflow-hidden">
        {category && <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 to-transparent" />
        <div className="absolute inset-0 flex items-center px-4 sm:px-6 max-w-7xl mx-auto">
          <div>
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-white/70 text-sm mb-3 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to categories
            </button>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              {category?.name || categoryId}
            </h1>
            <p className="text-white/75 text-sm mt-1">{category?.description}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder={`Search in ${category?.name || 'products'}...`}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
                <div className="h-44 bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No products found{searchQ ? ` for "${searchQ}"` : ''}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(product => {
              const inCart = cart.find(i => i.id === product.id);
              const isLowStock = product.stock_qty > 0 && product.stock_qty <= 10;
              const isOutOfStock = product.stock_qty === 0;
              const discount = Math.round((1 - product.price / product.original_price) * 100);

              return (
                <div key={product.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col">
                  <div className="relative overflow-hidden flex-shrink-0">
                    <img src={product.image_url} alt={product.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500 bg-muted" />
                    {product.badge && (
                      <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">{product.badge}</span>
                    )}
                    <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                      {product.weight_label}
                    </span>
                    {isLowStock && (
                      <span className="absolute bottom-2 left-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium animate-pulse">
                        Only {product.stock_qty} left!
                      </span>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-lg">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h4 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">{product.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">{product.description}</p>
                    <div className="flex items-center gap-1.5 mb-3">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-3 h-3 ${i <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`} />
                      ))}
                      <span className="text-xs text-muted-foreground">{product.rating} ({product.reviews})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-base font-bold text-foreground">₹{product.price}</span>
                        <span className="text-xs text-muted-foreground line-through ml-1">₹{product.original_price}</span>
                        <div className="text-xs text-green-600 font-medium">{discount}% off</div>
                      </div>
                      {!isOutOfStock && (
                        inCart ? (
                          <div className="flex items-center gap-1 bg-primary/10 rounded-xl overflow-hidden">
                            <button
                              onClick={() => { if (inCart.qty === 1) removeItem(product.id); else updateQty(product.id, -1); }}
                              className="px-2.5 py-1.5 hover:bg-primary/20 transition-colors"
                            >
                              <Minus className="w-3 h-3 text-primary" />
                            </button>
                            <span className="text-primary font-bold text-sm min-w-[1.5rem] text-center">{inCart.qty}</span>
                            <button
                              onClick={() => updateQty(product.id, 1)}
                              disabled={inCart.qty >= product.stock_qty}
                              className="px-2.5 py-1.5 hover:bg-primary/20 transition-colors disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3 text-primary" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
                          >
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
