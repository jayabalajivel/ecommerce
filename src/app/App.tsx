import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router';
import { ShoppingCart, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { CartProvider, useCart } from '../contexts/CartContext';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('../pages/LoginPage'));
const HomePage = lazy(() => import('../pages/customer/HomePage'));
const CategoryPage = lazy(() => import('../pages/customer/CategoryPage'));
const CartPage = lazy(() => import('../pages/customer/CartPage'));
const PaymentPage = lazy(() => import('../pages/customer/PaymentPage'));
const CompanyPage = lazy(() => import('../pages/customer/CompanyPage'));
const UPIRedirectPage = lazy(() => import('../pages/customer/UPIRedirectPage'));
const AdminLayout = lazy(() => import('../pages/admin/AdminLayout'));
const MyOrdersPage = lazy(() => import('../pages/customer/MyOrdersPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-3xl animate-pulse">🌶️</div>
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}

// ─── Inner App (has access to AuthContext & CartContext) ──────
function AppInner() {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();

  // Loading state
  if (isLoading) {
    return <LoadingFallback />;
  }

  // Not logged in
  if (!user) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LoginPage onSuccess={() => {}} />
      </Suspense>
    );
  }

  // Admin view
  if (isAdmin) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AdminLayout />
      </Suspense>
    );
  }

  // Customer view layout (Navbar + Routes)
  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Customer Navbar */}
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-lg">🌶️</div>
            <span className="font-bold text-foreground text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>MADURAI MADASAMY IDLYPODI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`
              }
            >
              Shop
            </NavLink>
            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`
              }
            >
              My Orders
            </NavLink>
            <NavLink
              to="/company"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`
              }
            >
              About Us
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <ShoppingCart className="w-4 h-4 text-foreground" />
              <span className="text-sm font-medium text-foreground hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={logout} className="p-2 rounded-xl hover:bg-muted/50 transition-colors" title="Sign out">
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex border-t border-border">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex-1 py-2.5 text-center text-xs font-medium transition-colors ${
                isActive ? 'text-primary bg-primary/5' : 'text-muted-foreground'
              }`
            }
          >
            Shop
          </NavLink>
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `flex-1 py-2.5 text-center text-xs font-medium transition-colors ${
                isActive ? 'text-primary bg-primary/5' : 'text-muted-foreground'
              }`
            }
          >
            Orders
          </NavLink>
          <NavLink
            to="/company"
            className={({ isActive }) =>
              `flex-1 py-2.5 text-center text-xs font-medium transition-colors ${
                isActive ? 'text-primary bg-primary/5' : 'text-muted-foreground'
              }`
            }
          >
            About
          </NavLink>
        </div>
      </header>

      {/* Pages */}
      <main>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/orders" element={<MyOrdersPage />} />
            <Route path="/company" element={<CompanyPage />} />
            <Route path="/upi-redirect" element={<UPIRedirectPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

// ─── Root App with Providers ─────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppInner />
      </CartProvider>
    </AuthProvider>
  );
}
