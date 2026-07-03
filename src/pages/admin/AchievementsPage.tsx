import React, { useEffect, useState } from 'react';
import { achievementsApi } from '../../lib/api';
import type { Achievement } from '../../lib/api';
import { Edit2, X, Check } from 'lucide-react';

export default function AdminAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<Achievement | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<Partial<Achievement>>({ title: '', value: '', description: '', icon: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    achievementsApi.list().then(r => setAchievements(r.achievements)).catch(console.error).finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  function openEdit(a: Achievement) {
    setEditItem(a);
    setIsCreating(false);
    setForm({ title: a.title, value: a.value, description: a.description, icon: a.icon });
  }

  function openCreate() {
    setEditItem({} as Achievement);
    setIsCreating(true);
    setForm({ title: '', value: '', description: '', icon: '🏆', sort_order: achievements.length + 1 });
  }

  async function handleSave() {
    if (!editItem) return;
    setSaving(true);
    try {
      if (isCreating) {
        const result = await achievementsApi.create(form);
        setAchievements(prev => [...prev, result.achievement]);
        showToast('Achievement created');
      } else {
        const result = await achievementsApi.update(editItem.id, form);
        setAchievements(prev => prev.map(a => a.id === editItem.id ? result.achievement : a));
        showToast('Achievement updated');
      }
      setEditItem(null);
      setIsCreating(false);
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editItem || isCreating) return;
    if (!confirm('Are you sure you want to delete this achievement?')) return;
    setSaving(true);
    try {
      await achievementsApi.delete(editItem.id);
      setAchievements(prev => prev.filter(a => a.id !== editItem.id));
      setEditItem(null);
      showToast('Achievement deleted');
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
          <h2 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Achievements & Milestones</h2>
          <p className="text-sm text-muted-foreground">Edit the numbers and descriptions shown on the company page</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all shadow-md shadow-primary/20"
        >
          <Check className="w-4 h-4 hidden" /> {/* For alignment/import match */} 
          <span className="text-lg leading-none">+</span> Add Achievement
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{a.icon}</span>
                <button
                  onClick={() => openEdit(a)}
                  className="p-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <div className="text-2xl font-bold text-primary mb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>{a.value}</div>
              <div className="font-semibold text-foreground text-sm mb-1">{a.title}</div>
              <p className="text-xs text-muted-foreground mt-auto break-words">{a.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                {isCreating ? 'Add Achievement' : 'Edit Achievement'}
              </h3>
              <button onClick={() => { setEditItem(null); setIsCreating(false); }} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Icon (emoji)', key: 'icon' },
                { label: 'Value (e.g. 2,50,000+)', key: 'value' },
                { label: 'Title', key: 'title' },
                { label: 'Description', key: 'description' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
                  <input
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}
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
              <button onClick={() => { setEditItem(null); setIsCreating(false); }} className="px-6 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium shadow-xl z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
