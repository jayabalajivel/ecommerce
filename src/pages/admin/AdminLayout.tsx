import React, { useEffect, useState } from 'react';
import { BarChart3, Package, Truck, Award, History, LogOut, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from './DashboardPage';
import AdminProducts from './ProductsPage';
import AdminOrders from './OrdersPage';
import AdminAchievements from './AchievementsPage';
import AdminReviews from './ReviewsPage';
import AdminSessionLog from './SessionLogPage';
import { SEO } from '../../components/SEO';

type AdminTab = 'dashboard' | 'products' | 'orders' | 'achievements' | 'reviews' | 'sessions';

const TABS: { id: AdminTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: BarChart3 },
  { id: 'products', label: 'Products', Icon: Package },
  { id: 'orders', label: 'Orders', Icon: Truck },
  { id: 'achievements', label: 'Achievements', Icon: Award },
  { id: 'reviews', label: 'Reviews', Icon: Star },
  { id: 'sessions', label: 'Session Log', Icon: History },
];

export default function AdminLayout() {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SEO title={`Admin ${TABS.find(t => t.id === tab)?.label}`} description="MADURAI MADASAMY IDLYPODI Admin Portal" />
      {/* Admin Navbar */}
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-lg">🌶️</div>
            <div>
              <span className="font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>MADURAI MADASAMY IDLYPODI</span>
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">+91 {user?.phone}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto pb-0">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {tab === 'dashboard' && <AdminDashboard onNavigate={setTab} />}
        {tab === 'products' && <AdminProducts />}
        {tab === 'orders' && <AdminOrders />}
        {tab === 'achievements' && <AdminAchievements />}
        {tab === 'reviews' && <AdminReviews />}
        {tab === 'sessions' && <AdminSessionLog />}
      </main>
    </div>
  );
}
