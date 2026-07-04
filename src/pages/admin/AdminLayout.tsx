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
import logoImg from '../../assets/logo.jpg';

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
      <header className="bg-brand-green text-white border-b border-white/10 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Madurai Madasamy Idlypodi Logo" className="h-10 w-auto object-contain rounded-md bg-white p-0.5" />
            <div>
              <span className="font-bold text-white text-base sm:text-lg tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>MADURAI MADASAMY IDLYPODI</span>
              <span className="ml-2 text-[10px] bg-brand-red text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/80 hidden sm:block">+91 {user?.phone}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4 text-white" /> Sign Out
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto pb-0 border-t border-white/10 bg-brand-green">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                tab === id ? 'border-brand-gold text-brand-gold bg-white/5' : 'border-transparent text-white/80 hover:text-white hover:bg-white/5'
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
