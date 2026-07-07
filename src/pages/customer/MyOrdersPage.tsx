import React, { useEffect, useState } from 'react';
import { ordersApi } from '../../lib/api';
import type { Order, OrderStatus } from '../../lib/api';
import logoImg from '../../assets/logo.jpg';
import { SEO } from '../../components/SEO';
import { Clock, RefreshCw, Truck, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const STATUS_STEPS: Array<{ key: OrderStatus; label: string; Icon: any }> = [
  { key: 'pending', label: 'Order Placed', Icon: Clock },
  { key: 'processing', label: 'Processing', Icon: RefreshCw },
  { key: 'shipped', label: 'Shipped', Icon: Truck },
  { key: 'delivered', label: 'Delivered', Icon: CheckCircle2 },
];

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.list({ limit: 50 })
      .then(res => {
        setOrders(res.orders || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function getStepIndex(status: OrderStatus): number {
    if (status === 'cancelled') return -1;
    return STATUS_STEPS.findIndex(s => s.key === status);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <SEO title="My Orders" description="Track and view your spice orders history." />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>My Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time status of your authentic spice purchases</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl shadow-sm">
          <img src={logoImg} alt="Logo" className="w-16 h-16 object-contain rounded-2xl mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-foreground mb-1">No Orders Found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">You haven't placed any orders yet. Head back to the store to taste our premium spices!</p>
          <a href="/" className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            Start Shopping
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const isCancelled = order.status === 'cancelled';
            const activeStepIndex = getStepIndex(order.status);

            return (
              <div key={order.id} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                
                {/* Order Top Banner */}
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground text-base">{order.id}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {order.email && <span className="text-xs text-muted-foreground">Receipt sent to: {order.email}</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Grand Total</span>
                    <span className="font-bold text-primary text-lg">₹{order.total}</span>
                  </div>
                </div>

                {/* Main Order Content */}
                <div className="p-6 grid md:grid-cols-5 gap-6">
                  
                  {/* Left Side: Items & Details */}
                  <div className="md:col-span-2 space-y-4 border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Items</h4>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-foreground font-medium">
                              {item.name} <span className="text-xs text-muted-foreground">({item.weight})</span>
                              <span className="text-primary font-bold ml-1.5">x{item.qty}</span>
                            </span>
                            <span className="text-muted-foreground">₹{item.subtotal}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Shipping Address</h4>
                      <p className="text-xs text-foreground/80 leading-relaxed font-medium">{order.address}</p>
                    </div>

                    <div className="pt-2 text-xs text-muted-foreground">
                      <div><strong className="text-foreground/80 font-medium">UPI Txn:</strong> {order.payment_ref}</div>
                      {order.screenshot_url && (
                        <div className="mt-1">
                          <a 
                            href={order.screenshot_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline font-semibold"
                          >
                            View Payment Screenshot
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Tracking Timeline */}
                  <div className="md:col-span-3 flex flex-col justify-center">
                    {isCancelled ? (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-5 flex items-center gap-4 text-red-700">
                        <XCircle className="w-10 h-10 text-red-500 shrink-0" />
                        <div>
                          <h5 className="font-bold text-sm">Order Cancelled</h5>
                          <p className="text-xs text-red-600 mt-0.5">This order has been cancelled. For refunds or inquiries, please contact our customer support.</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">Delivery Tracking</h4>
                        
                        {/* Horizontal Steps Bar */}
                        <div className="relative flex justify-between items-center">
                          {/* Progress Line */}
                          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-muted -z-10" />
                          <div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-500 -z-10" 
                            style={{ 
                              width: `${activeStepIndex === 0 ? 0 : activeStepIndex === 1 ? 33 : activeStepIndex === 2 ? 66 : 100}%` 
                            }} 
                          />

                          {STATUS_STEPS.map((step, idx) => {
                            const isDone = idx <= activeStepIndex;
                            const isCurrent = idx === activeStepIndex;
                            const StepIcon = step.Icon;

                            return (
                              <div key={step.key} className="flex flex-col items-center">
                                <div 
                                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                    isDone 
                                      ? 'bg-primary border-primary text-white shadow-md' 
                                      : 'bg-background border-muted text-muted-foreground'
                                  } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}
                                >
                                  <StepIcon className="w-4.5 h-4.5" />
                                </div>
                                <span className={`text-[11px] font-bold mt-2 text-center absolute -bottom-6 w-20 transition-all ${
                                  isDone ? 'text-foreground' : 'text-muted-foreground'
                                }`}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="h-6" /> {/* Spacer for absolute labels */}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
