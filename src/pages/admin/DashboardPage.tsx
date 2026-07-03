import React, { useEffect, useState } from 'react';
import { Package, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { adminApi, ordersApi } from '../../lib/api';
import type { DashboardStats, Order } from '../../lib/api';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

interface DashboardProps {
  onNavigate: (tab: any) => void;
}

export default function AdminDashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getDashboard(),
      ordersApi.list({ limit: 5 }),
    ]).then(([dashRes, ordersRes]) => {
      setStats(dashRes.stats);
      setRecentOrders(ordersRes.orders);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Dashboard Overview</h2>
      <p className="text-muted-foreground mb-6 text-sm">Welcome back. Here is your store summary.</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: stats?.total_orders ?? 0, Icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Revenue', value: `₹${(stats?.total_revenue ?? 0).toLocaleString('en-IN')}`, Icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending Orders', value: stats?.pending_orders ?? 0, Icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Delivered', value: stats?.delivered_orders ?? 0, Icon: CheckCircle, color: 'text-primary', bg: 'bg-red-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground mb-0.5">{stat.value}</div>
            <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Low Stock Alerts */}
      {stats && stats.low_stock_products.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800">Low Stock Alert</h3>
            <span className="ml-auto text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
              {stats.low_stock_products.length} products
            </span>
          </div>
          <div className="space-y-2">
            {stats.low_stock_products.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-foreground">{p.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.stock_qty === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {p.stock_qty === 0 ? 'Out of Stock' : `${p.stock_qty} left`}
                </span>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate('products')} className="mt-3 text-xs text-amber-700 font-medium hover:underline">
            → Manage stock in Products tab
          </button>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Recent Orders</h3>
          <button onClick={() => onNavigate('orders')} className="text-xs text-primary hover:underline font-medium">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-6 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Order ID</th>
                <th className="text-left px-6 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Customer</th>
                <th className="text-left px-6 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide hidden md:table-cell">Items</th>
                <th className="text-left px-6 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Total</th>
                <th className="text-left px-6 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentOrders.map(order => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const itemsStr = Array.isArray(order.items)
                  ? order.items.map((i: any) => `${i.name} × ${i.qty}`).join(', ')
                  : '';
                return (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{order.id}</td>
                    <td className="px-6 py-4 text-foreground">{order.user_phone}</td>
                    <td className="px-6 py-4 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{itemsStr}</td>
                    <td className="px-6 py-4 font-semibold text-foreground">₹{order.total.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
