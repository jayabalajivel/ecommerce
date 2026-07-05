import React from 'react';
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCart } from '../../contexts/CartContext';
import { SEO } from '../../components/SEO';

export default function CartPage() {
  const { cart, cartTotal, cartCount, updateQty, removeItem } = useCart();
  const navigate = useNavigate();
  const grandTotal = cartTotal;

  if (cart.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <SEO title="Your Cart" description="View and manage the items in your cart." />
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Your Cart</h1>
        </div>
        <div className="text-center py-20">
          <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Your cart is empty</h3>
          <p className="text-muted-foreground mb-6">Add some delicious spices to get started!</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all">
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <SEO title={`Your Cart (${cartCount})`} description="View and manage the items in your cart." />
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Your Cart <span className="text-muted-foreground text-base font-normal">({cartCount} items)</span>
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-muted" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground text-sm mb-0.5 truncate">{item.name}</h4>
                <p className="text-xs text-muted-foreground">{item.weight_label}</p>
                {item.stock_qty <= 10 && (
                  <p className="text-xs text-amber-600 font-medium mt-0.5">Only {item.stock_qty} in stock</p>
                )}
                <p className="text-sm font-bold text-foreground mt-1">
                  ₹{item.price} × {item.qty} = <span className="text-primary">₹{item.price * item.qty}</span>
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-1 bg-muted rounded-xl overflow-hidden">
                  <button
                    onClick={() => { if (item.qty === 1) removeItem(item.id); else updateQty(item.id, -1); }}
                    className="px-2.5 py-2 hover:bg-muted/80 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5 text-foreground" />
                  </button>
                  <span className="font-bold text-sm min-w-[1.5rem] text-center text-foreground">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    disabled={item.qty >= item.stock_qty}
                    className="px-2.5 py-2 hover:bg-muted/80 transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5 text-foreground" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors text-muted-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Order Summary</h3>
            <div className="space-y-2 mb-4 text-sm">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-muted-foreground">
                  <span className="truncate max-w-[160px]">{item.name} × {item.qty}</span>
                  <span>₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 mb-1">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Subtotal</span><span>₹{cartTotal}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Delivery</span>
                <span className="text-muted-foreground text-xs font-medium">Calculated at checkout</span>
              </div>
              {cartTotal < 799 && (
                <p className="text-xs text-accent mt-1">Add ₹{799 - cartTotal} more for free delivery!</p>
              )}
            </div>
            <div className="border-t border-border pt-3 mb-5">
              <div className="flex justify-between font-bold text-foreground">
                <span>Total</span>
                <span className="text-lg">₹{grandTotal}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/payment')}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-md shadow-primary/20"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
