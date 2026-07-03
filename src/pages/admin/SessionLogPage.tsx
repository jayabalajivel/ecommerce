import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import type { AdminSession, ProductEdit } from '../../lib/api';
import { LogIn, LogOut, Clock, Edit2 } from 'lucide-react';

export default function AdminSessionLog() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [edits, setEdits] = useState<ProductEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sessions' | 'edits'>('sessions');

  useEffect(() => {
    Promise.all([
      adminApi.getSessions(),
      adminApi.getProductEdits(),
    ]).then(([sessRes, editsRes]) => {
      setSessions(sessRes.sessions);
      setEdits(editsRes.edits);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  function duration(login: string, logout: string | null) {
    if (!logout) return 'Active now';
    const ms = new Date(logout).getTime() - new Date(login).getTime();
    const mins = Math.floor(ms / 60000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  }

  function fmt(dt: string) {
    return new Date(dt).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Session & Audit Log</h2>
      <p className="text-sm text-muted-foreground mb-6">Track admin logins and product change history</p>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'sessions' as const, label: `Login Sessions (${sessions.length})` },
          { id: 'edits' as const, label: `Product Edits (${edits.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : activeTab === 'sessions' ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No sessions recorded yet</div>
          ) : (
            <div className="divide-y divide-border">
              {sessions.map(s => (
                <div key={s.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${s.logout_at ? 'bg-muted' : 'bg-green-100'}`}>
                      {s.logout_at ? <LogOut className="w-4 h-4 text-muted-foreground" /> : <LogIn className="w-4 h-4 text-green-600" />}
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">+91 {s.admin_phone}</div>
                      <div className="text-xs text-muted-foreground">
                        {fmt(s.login_at)}
                        {s.ip_address && <span> · {s.ip_address}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.logout_at ? 'bg-muted text-muted-foreground' : 'bg-green-100 text-green-700'}`}>
                      {s.logout_at ? 'Ended' : '● Active'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {duration(s.login_at, s.logout_at)}
                    </div>
                    {s.actions_count > 0 && (
                      <div className="text-xs text-muted-foreground">{s.actions_count} actions</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {edits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No product edits recorded yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    {['Time', 'Admin', 'Product', 'Field', 'Old Value', 'New Value'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {edits.map(edit => (
                    <tr key={edit.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmt(edit.edited_at)}</td>
                      <td className="px-4 py-3 text-xs font-medium">+91 {edit.admin_phone}</td>
                      <td className="px-4 py-3 text-xs text-foreground">{edit.product_name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-mono">
                          <Edit2 className="w-2.5 h-2.5" />{edit.field_changed}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground line-through max-w-[120px] truncate">{edit.old_value}</td>
                      <td className="px-4 py-3 text-xs text-green-700 font-medium max-w-[120px] truncate">{edit.new_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
