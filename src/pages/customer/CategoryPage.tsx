import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search, Plus, Minus, Star, AlertCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { productsApi, getOptimizedImg } from '../../lib/api';
import type { Product, Category } from '../../lib/api';
import { useCart } from '../../contexts/CartContext';
import { SEO } from '../../components/SEO';

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  
  const cachedProds = productsApi.getCachedList(categoryId === 'all' ? undefined : { category: categoryId });
  const cachedCats = productsApi.getCachedCategories();

  const [products, setProducts] = useState<Product[]>(cachedProds ? cachedProds.products : []);
  const [category, setCategory] = useState<Category | null>(() => {
    if (categoryId === 'all') {
      return {
        id: 'all',
        name: 'All Products',
        description: 'Explore our full range of authentic South Indian condiments, masalas, and powders.',
        image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&fit=crop',
        sort_order: 0,
        product_count: cachedProds ? cachedProds.products.length : 0
      };
    }
    return cachedCats ? (cachedCats.categories.find(c => c.id === categoryId) || null) : null;
  });
  const [searchQ, setSearchQ] = useState('');
  const [loading, setLoading] = useState(!cachedProds || !cachedCats);
  const { cart, addToCart, updateQty, removeItem } = useCart();

  useEffect(() => {
    if (!categoryId) return;
    
    const freshProds = productsApi.getCachedList(categoryId === 'all' ? undefined : { category: categoryId });
    const freshCats = productsApi.getCachedCategories();
    
    if (freshProds && freshCats) {
      setProducts(freshProds.products);
      if (categoryId === 'all') {
        setCategory({
          id: 'all',
          name: 'All Products',
          description: 'Explore our full range of authentic South Indian condiments, masalas, and powders.',
          image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&fit=crop',
          sort_order: 0,
          product_count: freshProds.products.length
        });
      } else {
        setCategory(freshCats.categories.find(c => c.id === categoryId) || null);
      }
      setLoading(false);
    } else {
      setProducts([]);
      setCategory(null);
      setLoading(true);
    }
    
    const apiCall = categoryId === 'all'
      ? productsApi.list()
      : productsApi.list({ category: categoryId });

    Promise.all([
      apiCall,
      productsApi.categories(),
    ]).then(([prods, cats]) => {
      setProducts(prods.products);
      if (categoryId === 'all') {
        setCategory({
          id: 'all',
          name: 'All Products',
          description: 'Explore our full range of authentic South Indian condiments, masalas, and powders.',
          image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&fit=crop',
          sort_order: 0,
          product_count: prods.products.length
        });
      } else {
        setCategory(cats.categories.find(c => c.id === categoryId) || null);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [categoryId]);

  const filtered = products.filter(p =>
    searchQ ? p.name.toLowerCase().includes(searchQ.toLowerCase()) : true
  );

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://maduraimadasamyidlipodi.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": category?.name || categoryId || "Products",
        "item": `https://maduraimadasamyidlipodi.com/category/${categoryId}`
      }
    ]
  };

  return (
    <div>
      <SEO 
        title={category?.name ? `${category.name} - Madurai Madasamy Idly Podi` : 'Madurai Madasamy Idly Podi Products'} 
        description={category?.description ? `${category.description} Madurai Madasamy Idly Podi - Authentic taste from Madurai.` : `Explore our premium collection of ${category?.name || 'spices'} by Madurai Madasamy Idly Podi.`}
        schema={breadcrumbSchema}
      />
      {/* Category Hero */}
      <div className="relative h-44 overflow-hidden">
        {category && <img loading="eager" src={getOptimizedImg(category.image_url, 1200, 300)} alt={category.name} className="w-full h-full object-cover" />}
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
            {filtered.map((product, index) => {
              const inCart = cart.find(i => i.id === product.id);
              const isLowStock = product.stock_qty > 0 && product.stock_qty <= 10;
              const isOutOfStock = product.stock_qty === 0;
              const hasDiscount = product.original_price && product.original_price > product.price;
              const discount = hasDiscount ? Math.round((1 - product.price / product.original_price) * 100) : 0;

              return (
                <div key={product.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col">
                  <div className="relative overflow-hidden flex-shrink-0">
                    <img loading={index < 4 ? "eager" : "lazy"} src={getOptimizedImg(product.image_url, 400, 300)} alt={product.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500 bg-muted" />
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
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{product.description}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-auto">
                      <div className="min-w-[70px]">
                        <div className="flex items-baseline gap-1 flex-wrap">
                          <span className="text-base font-bold text-foreground">₹{product.price}</span>
                          {hasDiscount && (
                            <span className="text-xs text-muted-foreground line-through">₹{product.original_price}</span>
                          )}
                        </div>
                        {hasDiscount && (
                          <div className="text-xs text-green-600 font-medium">{discount}% off</div>
                        )}
                      </div>
                      {!isOutOfStock && (
                        inCart ? (
                          <div className="flex items-center bg-primary/10 rounded-xl overflow-hidden flex-shrink-0">
                            <button
                              onClick={() => { if (inCart.qty === 1) removeItem(product.id); else updateQty(product.id, -1); }}
                              className="px-2 py-1.5 hover:bg-primary/20 transition-colors"
                            >
                              <Minus className="w-3 h-3 text-primary" />
                            </button>
                            <span className="text-primary font-bold text-sm w-6 text-center select-none">{inCart.qty}</span>
                            <button
                              onClick={() => updateQty(product.id, 1)}
                              disabled={inCart.qty >= product.stock_qty}
                              className="px-2 py-1.5 hover:bg-primary/20 transition-colors disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3 text-primary" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 active:scale-95 transition-all flex-shrink-0"
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
