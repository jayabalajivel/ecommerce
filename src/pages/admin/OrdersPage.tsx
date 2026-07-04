import React, { useEffect, useState } from 'react';
import { ordersApi } from '../../lib/api';
import type { Order, OrderStatus } from '../../lib/api';
import { Clock, RefreshCw, Truck, CheckCircle, XCircle, Printer } from 'lucide-react';
import logoImg from '../../assets/logo.jpg';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', Icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', Icon: RefreshCw },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', Icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', Icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', Icon: XCircle },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    ordersApi.list({ limit: 100 }).then(r => setOrders(r.orders)).catch(console.error).finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    try {
      const result = await ordersApi.updateStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? result.order : o));
      showToast('Order status updated');
    } catch (err: any) {
      showToast('Error: ' + err.message);
    }
  }

  function printCourierSlip(order: Order) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = Array.isArray(order.items) ? order.items.map((item: any) => `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #ddd;"><strong>${item.name}</strong><br/><span style="color:#666; font-size: 12px;">${item.weight}</span></td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.qty}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #ddd; text-align: right;">Rs. ${item.subtotal}</td>
      </tr>
    `).join('') : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Courier Slip - ${order.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.5; color: #222; max-width: 800px; margin: 0 auto; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #000; }
            .logo { font-size: 28px; font-weight: 800; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .col { flex: 1; background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 0 10px; }
            .col:first-child { margin-left: 0; }
            .col:last-child { margin-right: 0; }
            h3 { margin-top: 0; color: #555; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 8px; letter-spacing: 1px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #000; color: #333; text-transform: uppercase; font-size: 13px; }
            .totals { width: 350px; margin-left: auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
            .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
            .totals .grand { font-size: 20px; font-weight: bold; border-top: 2px solid #000; padding-top: 15px; margin-top: 10px; }
            .footer { text-align: center; font-size: 12px; color: #777; margin-top: 60px; border-top: 1px solid #ddd; padding-top: 20px; }
            @media print { 
              body { padding: 0; }
              .col { border: 1px solid #eee; }
            }
          </style>
        </head>
        <body onload="window.print();">
          <div class="header">
            <img src="${logoImg}" alt="Madurai Madasamy Idlypodi Logo" style="height: 70px; width: auto; object-fit: contain; margin-bottom: 10px; border-radius: 6px;" />
            <div class="logo">MADURAI MADASAMY IDLYPODI</div>
            <div style="font-size: 12px; color: #555; line-height: 1.5; margin-bottom: 10px;">
              <strong>GST:</strong> 33DQVPM8304R1ZV | <strong>FSSAI:</strong> 22423579000351 <br/>
              <strong>Phone:</strong> 9843430304 | <strong>WhatsApp:</strong> 9843430304
            </div>
            <div style="font-size: 14px; font-weight: bold; border-top: 1px dashed #ccc; padding-top: 8px;">Official Packing Slip</div>
            <div style="margin-top: 6px; font-size: 14px;">Order ID: <strong>${order.id}</strong> &nbsp;|&nbsp; Date: <strong>${new Date(order.created_at).toLocaleDateString()}</strong></div>
          </div>
          
          <div class="row">
            <div class="col">
              <h3>Ship To / Customer Details</h3>
              <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${order.customer_name || 'Customer'}</div>
              <div style="margin-bottom: 5px;"><strong>Phone:</strong> +91 ${order.user_phone}</div>
              <div style="line-height: 1.4;"><strong>Address:</strong><br/>${order.address ? order.address.replace(/\\n/g, '<br/>') : 'No address provided'}</div>
            </div>
            <div class="col" style="flex: 0.7;">
              <h3>Payment Details</h3>
              <div style="font-size: 16px; font-weight: bold; color: #059669; margin-bottom: 5px;">PAID VIA UPI</div>
              <div><strong>Txn ID:</strong> ${order.payment_ref || 'N/A'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product Details</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div><span>Subtotal:</span> <span>Rs. ${order.subtotal}</span></div>
            <div><span>Delivery Fee:</span> <span>${order.delivery_fee === 0 ? 'FREE' : `Rs. ${order.delivery_fee}`}</span></div>
            <div class="grand"><span>Grand Total:</span> <span>Rs. ${order.total}</span></div>
          </div>

          <div class="footer">
            <strong>Thank you for shopping with MADURAI MADASAMY IDLYPODI!</strong><br/>
            This is a system generated document. For support, contact us with your Order ID.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Order Management</h2>
      <p className="text-sm text-muted-foreground mb-6">{orders.length} total orders · Update status from the buttons</p>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="grid gap-4">
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const itemsStr = Array.isArray(order.items)
              ? order.items.map((i: any) => `${i.name} × ${i.qty}`).join(', ')
              : '';
            return (
              <div key={order.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-foreground">{order.id}</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        <cfg.Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-foreground font-medium">+91 {order.user_phone}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {order.payment_ref && <span> · UPI Txn: {order.payment_ref}</span>}
                      {order.screenshot_url && (
                        <span>
                          {' · '}
                          <a href={order.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            View Screenshot
                          </a>
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">₹{Number(order.total).toLocaleString('en-IN')}</div>
                    <div className="text-xs text-muted-foreground">{order.delivery_fee > 0 ? `+₹${order.delivery_fee} delivery` : 'Free delivery'}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 mb-3 line-clamp-2">{itemsStr}</p>
                <div className="flex items-center justify-between gap-4 flex-wrap border-t border-border pt-3 mt-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground font-medium">Update status:</span>
                    {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(order.id, s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          order.status === s
                            ? STATUS_CONFIG[s].color + ' ring-1 ring-current'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => printCourierSlip(order)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print Courier Slip
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium shadow-xl z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
