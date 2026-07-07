import React, { useEffect, useState } from 'react';
import { ChevronRight, Star, Plus, X, Check, ChevronDown, HelpCircle, RefreshCw, Truck } from 'lucide-react';
import { useNavigate, Link } from 'react-router';
import { productsApi, achievementsApi, reviewsApi } from '../../lib/api';
import type { Category, Product, Achievement, StoreReview } from '../../lib/api';
import { useCart } from '../../contexts/CartContext';
import { SEO } from '../../components/SEO';

import about1 from '../../assets/about_1.jpeg';
import about2 from '../../assets/about_2.jpeg';
import about3 from '../../assets/about_3.jpeg';
import about4 from '../../assets/about_4.jpeg';
import about5 from '../../assets/about_5.jpeg';

import hero1 from '../../assets/hero_1.jpg';
import hero2 from '../../assets/hero_2.jpg';
import hero3 from '../../assets/hero_3.jpg';
import hero4 from '../../assets/hero_4.jpg';

const getOptimizedImg = (url: string, w = 400, h = 300) => {
  if (!url) return '';
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?w=${w}&h=${h}&fit=crop&q=60&auto=format`;
  }
  return url;
};

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ customer_name: '', rating: 5, description: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  const heroImages = [hero1, hero2, hero3, hero4];
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    productsApi.categories().then(r => setCategories(r.categories)).catch(console.error);
    productsApi.list().then(r => setBestsellers(r.products.filter(p => p.badge).slice(0, 4))).catch(console.error);
    achievementsApi.list().then(r => setAchievements(r.achievements)).catch(console.error);
    reviewsApi.list().then(r => setReviews(r.reviews)).catch(console.error);
  }, []);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await reviewsApi.create(reviewForm);
      setReviewSuccess(true);
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSuccess(false);
        setReviewForm({ customer_name: '', rating: 5, description: '' });
      }, 3000);
    } catch (err: any) {
      alert('Error submitting review: ' + err.message);
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div>
      <SEO 
        title="Premium Spices & Authentic Flavours" 
        description="Hand-sourced from the finest farms across India. Over 35 years of heritage in every jar. Discover our premium collection of authentic spices."
      />
      {/* Preload only the first Hero Image eagerly for faster initial page load */}
      <div className="hidden" aria-hidden="true">
        <img src={hero1} fetchPriority="high" loading="eager" alt="" />
      </div>
      {/* Hero */}
      <section className="relative overflow-hidden cursor-pointer">
        <div
          className="absolute inset-0 transition-all duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${heroImages[heroIndex]})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <p className="text-xs tracking-[0.25em] uppercase text-accent font-semibold mb-4">Taste of Tradition in Every spoon</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Authentic SouthIndian,<br />
            <span className="text-accent">Homemade Foods</span>
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-xl mb-8">
            Hand-sourced from the finest farms.Heritage in every jar.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/category/all" className="px-6 py-3 bg-accent text-accent-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-accent/20">
              Shop Now
            </Link>
            <Link to="/company" className="px-6 py-3 bg-white/15 text-white rounded-xl font-semibold text-sm hover:bg-white/25 transition-all border border-white/30">
              Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <div className="bg-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
            {[
              { icon: '🌿', label: '100% Natural', sub: 'No additives,No preservatives' },
              { icon: '🚚', label: 'Free Delivery', sub: 'Orders above ₹799' },
              { icon: '🔒', label: 'Secure Payment', sub: 'UPI ' },
              { icon: '♻️', label: 'Safe Packaging', sub: 'Hygenic' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3 px-4 sm:px-6 py-4">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <div className="text-foreground font-semibold text-sm">{f.label}</div>
                  <div className="text-muted-foreground text-xs">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Shop by Category</h2>
          <p className="text-muted-foreground text-sm mt-1">Explore our full range of premium spices</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className={`group relative overflow-hidden rounded-2xl text-left block ${i === 0 ? 'sm:col-span-2 lg:col-span-1' : ''} hover:shadow-xl transition-all duration-300`}
            >
              <div className="relative h-52 sm:h-56">
                <img loading="lazy" src={getOptimizedImg(cat.image_url, 600, 450)} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
              </div>
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{cat.name}</h3>
                    <p className="text-white/75 text-xs">{cat.description}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs font-medium group-hover:bg-primary transition-colors">
                    {cat.product_count}+ <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="bg-muted/30 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Bestsellers</h2>
              <p className="text-muted-foreground text-sm mt-1">Most loved by our customers</p>
            </div>
            <Link to="/category/all" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {bestsellers.map(product => (
              <div key={product.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col">
                <Link to={`/category/${product.category_id}`} className="relative overflow-hidden block">
                  <img loading="lazy" src={getOptimizedImg(product.image_url, 400, 300)} alt={product.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500 bg-muted" />
                  {product.badge && (
                    <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">{product.badge}</span>
                  )}
                  {product.stock_qty <= 10 && product.stock_qty > 0 && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      Only {product.stock_qty} left!
                    </span>
                  )}
                  {product.stock_qty === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">Out of Stock</span>
                    </div>
                  )}
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-semibold text-foreground text-sm mb-2 line-clamp-1">{product.name}</h4>
                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-base font-bold text-foreground">₹{product.price}</span>
                      {product.original_price > product.price && (
                        <span className="text-xs text-muted-foreground line-through ml-1">₹{product.original_price}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart(product);
                      }}
                      disabled={product.stock_qty === 0}
                      className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {achievements.map(a => (
            <div key={a.id} className="text-center p-4">
              <div className="text-3xl mb-2">{a.icon}</div>
              <div className="text-xl font-bold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>{a.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{a.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="bg-primary/5 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>What Our Customers Say</h2>
              <p className="text-muted-foreground text-sm mt-1">Real reviews from our spice-loving community</p>
            </div>
            <button 
              onClick={() => setShowReviewModal(true)}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md flex items-center gap-2"
            >
              <Star className="w-4 h-4 fill-white" /> Write a Review
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map(r => (
              <div key={r.id} className="bg-card p-6 rounded-2xl border border-border hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`} />
                  ))}
                </div>
                <p className="text-foreground italic mb-4">"{r.description}"</p>
                <div className="font-semibold text-sm text-foreground">— {r.customer_name}</div>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                Be the first to share your experience with us
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-16 bg-muted/20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              Have queries about ordering or delivery? Find your answers here.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What is the minimum order for delivery?",
                a: "There is no minimum order for delivery but we charge a nominal delivery fee."
              },
              {
                q: "Is it possible to order an item which is out of stock?",
                a: "No, you can only order products which are in stock.otherwise you can orderby whatsapp or contact number"
              },
              {
                q: "How do I check the current status of my order?",
                a: "You can track the live status of your order directly from the 'My Orders' section in the navigation bar. The status will update from pending to processing, shipped, and delivered/cancelled."
              },
              {
                q: "How do I contact customer service?",
                a: "Our customer service team is available throughout the week, all seven days from 9:30 am to 6:00 pm. They can be reached at +919843430304 or via email at maduraimadasamyidlypodi@gmail.com"
              },
              {
                q: "What are the procedure of payment?",
                a: " you can pay by clicking paynow option and also generated QRcode.After completing payment enter your Transaction ID and payment screenshot genuinely."
              }
            ].map((faq, index) => {
              const isOpen = activeFaqIndex === index;
              return (
                <div 
                  key={index} 
                  className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:border-primary/30"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaqIndex(isOpen ? null : index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-semibold text-foreground hover:bg-muted/30 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                  </button>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-40 border-t border-border/60 bg-muted/10' : 'max-h-0'
                    }`}
                  >
                    <p className="px-6 py-5 text-sm text-foreground/80 leading-relaxed font-medium">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Refund and Exchange Policy */}
      <section className="py-16 bg-background border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Refund & Exchange Policy
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              Our policy on exchanges, returns, and shipping instructions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Exchanges Card */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <RefreshCw className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>Exchanges</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We only replace items if they are defective or damaged. If you need to exchange it for the same item, send us an email at <a href="mailto:maduraimadasamyidlypodi@gmail.com" className="text-primary hover:underline font-semibold">maduraimadasamyidlypodi@gmail.com</a> or contact: <a href="tel:9843430304" className="text-primary hover:underline font-semibold">9843430304</a> and send your item to:
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-border bg-muted/20 p-3.5 rounded-xl text-xs text-foreground/80 font-medium">
                <strong>Return Address:</strong> MADURAI MADASAMY IDLYPODI, Flat no:21, Pandiyan nagar 1st Street, Kosakulam, Madurai - 625017.
              </div>
            </div>

            {/* Shipping Returns Card */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>Shipping & Returns</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  To return your product, you should mail your product to our address. You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-border bg-muted/20 p-3.5 rounded-xl text-xs text-foreground/80 font-medium">
                <strong>Shipping Address:</strong> MADURAI MADASAMY IDLYPODI, flat no:21, Pandiyan nagar 1st Street, Kosakulam, Madurai - 625017.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Write a Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <h3 className="font-bold text-foreground text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                Share Your Experience
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            
            {reviewSuccess ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">Thank you!</h4>
                <p className="text-muted-foreground text-sm">Your review has been submitted.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Your Name</label>
                  <input
                    required
                    value={reviewForm.customer_name}
                    onChange={e => setReviewForm(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Rating</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(i => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setReviewForm(prev => ({ ...prev, rating: i }))}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-8 h-8 ${i <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Review</label>
                  <textarea
                    required
                    rows={4}
                    value={reviewForm.description}
                    onChange={e => setReviewForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell us what you loved about our spices..."
                    className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none resize-none"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-70 flex items-center justify-center"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
