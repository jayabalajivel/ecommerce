import React, { useEffect, useState } from 'react';
import { reviewsApi } from '../../lib/api';
import type { StoreReview } from '../../lib/api';
import { Edit2, X, Check, Star, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminReviews() {
  const { adminSessionId } = useAuth();
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<StoreReview | null>(null);
  const [form, setForm] = useState<Partial<StoreReview>>({ customer_name: '', rating: 5, description: '', is_approved: false });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [adminSessionId]);

  function fetchReviews() {
    reviewsApi.list(adminSessionId || undefined)
      .then(r => setReviews(r.reviews))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  function openEdit(r: StoreReview) {
    setEditItem(r);
    setForm({ customer_name: r.customer_name, rating: r.rating, description: r.description, is_approved: r.is_approved });
  }

  async function handleToggleStatus(r: StoreReview) {
    try {
      const result = await reviewsApi.update(r.id, { is_approved: !r.is_approved });
      setReviews(prev => prev.map(rev => rev.id === r.id ? result.review : rev));
      showToast(result.review.is_approved ? 'Review approved and visible' : 'Review hidden');
    } catch (err: any) {
      showToast('Error: ' + err.message);
    }
  }

  async function handleSave() {
    if (!editItem) return;
    setSaving(true);
    try {
      const result = await reviewsApi.update(editItem.id, form);
      setReviews(prev => prev.map(r => r.id === editItem.id ? result.review : r));
      showToast('Review updated');
      setEditItem(null);
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editItem) return;
    if (!confirm('Are you sure you want to delete this review?')) return;
    setSaving(true);
    try {
      await reviewsApi.delete(editItem.id);
      setReviews(prev => prev.filter(r => r.id !== editItem.id));
      setEditItem(null);
      showToast('Review deleted');
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Customer Reviews</h2>
          <p className="text-sm text-muted-foreground">Approve or hide reviews before they appear on the homepage</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-5 flex flex-col hover:shadow-md transition-shadow relative">
              
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-foreground text-sm">{r.customer_name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`} />
                  ))}
                </div>
              </div>
              
              <p className="text-sm text-foreground mb-4 line-clamp-3 italic flex-1">"{r.description}"</p>
              
              <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                <button
                  onClick={() => handleToggleStatus(r)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    r.is_approved 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  {r.is_approved ? <><CheckCircle className="w-3.5 h-3.5" /> Approved (Visible)</> : <><Clock className="w-3.5 h-3.5" /> Pending (Hidden)</>}
                </button>
                <button
                  onClick={() => openEdit(r)}
                  className="p-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="col-span-full py-10 text-center text-muted-foreground">
              No reviews found.
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                Edit Review
              </h3>
              <button onClick={() => setEditItem(null)} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Customer Name</label>
                <input
                  value={form.customer_name || ''}
                  onChange={e => setForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Rating (1-5)</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(i => (
                    <button
                      key={i}
                      onClick={() => setForm(prev => ({ ...prev, rating: i }))}
                      className="p-1"
                    >
                      <Star className={`w-6 h-6 ${i <= (form.rating || 5) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea
                  rows={4}
                  value={form.description || ''}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="approve_check"
                  checked={form.is_approved}
                  onChange={e => setForm(prev => ({...prev, is_approved: e.target.checked}))}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="approve_check" className="text-sm font-medium text-foreground cursor-pointer">
                  Approve and show on Homepage
                </label>
              </div>

            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2.5 bg-red-100 text-red-700 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-60 flex items-center gap-1.5"
              >
                <X className="w-4 h-4" /> Delete
              </button>
              
              <div className="flex-1" />
              <button onClick={() => setEditItem(null)} className="px-6 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium shadow-xl z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
