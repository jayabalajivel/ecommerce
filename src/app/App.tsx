import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link, NavLink, useNavigate, useLocation, Navigate } from 'react-router';
import { ShoppingCart, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { CartProvider, useCart } from '../contexts/CartContext';
import logoImg from '../assets/logo.jpg';

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
        <img src={logoImg} alt="Logo" className="w-16 h-16 object-contain rounded-2xl animate-pulse" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}

// ─── Route Authorization Guard ──────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// ─── Inner App (has access to AuthContext & CartContext) ──────
function AppInner() {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  // Loading state
  if (isLoading) {
    return <LoadingFallback />;
  }

  // Admin view
  if (user && isAdmin) {
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
      <header className="bg-brand-green text-white border-b border-white/10 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-4">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={logoImg} alt="Madurai Madasamy Idlypodi Logo" className="h-9 w-9 sm:h-10 sm:w-10 object-cover rounded-md bg-white p-0.5" />
            <span className="font-bold text-white text-xs xs:text-sm sm:text-base md:text-lg tracking-wide whitespace-nowrap" style={{ fontFamily: "'Playfair Display', serif" }}>
              MADURAI MADASAMY IDLYPODI
            </span>
          </Link>
 
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/category/all"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/20 text-brand-gold font-bold' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`
              }
            >
              Shop
            </NavLink>
            {user && (
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/20 text-brand-gold font-bold' : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                My Orders
              </NavLink>
            )}
            <NavLink
              to="/company"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/20 text-brand-gold font-bold' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`
              }
            >
              About Us
            </NavLink>
          </nav>
 
          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ShoppingCart className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-red text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            {user ? (
              <button onClick={logout} className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors" title="Sign out">
                <LogOut className="w-4 h-4 text-white" />
              </button>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-brand-gold text-brand-green font-bold text-sm rounded-xl hover:opacity-90 transition-all"
              >
                Login
              </Link>
            )}
          </div>
        </div>
 
        {/* Mobile nav */}
        <div className="md:hidden flex border-t border-white/10 bg-brand-red">
          <NavLink
            to="/category/all"
            className={({ isActive }) =>
              `flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${
                isActive ? 'text-brand-gold bg-white/10' : 'text-white/80 hover:text-white'
              }`
            }
          >
            Shop
          </NavLink>
          {user && (
            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${
                  isActive ? 'text-brand-gold bg-white/10' : 'text-white/80 hover:text-white'
                }`
              }
            >
              Orders
            </NavLink>
          )}
          <NavLink
            to="/company"
            className={({ isActive }) =>
              `flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${
                isActive ? 'text-brand-gold bg-white/10' : 'text-white/80 hover:text-white'
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
            <Route
              path="/login"
              element={
                <LoginPage
                  onSuccess={() => {
                    const from = (location.state as any)?.from?.pathname || '/';
                    navigate(from, { replace: true });
                  }}
                />
              }
            />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/payment" element={<RequireAuth><PaymentPage /></RequireAuth>} />
            <Route path="/orders" element={<RequireAuth><MyOrdersPage /></RequireAuth>} />
            <Route path="/company" element={<CompanyPage />} />
            <Route path="/upi-redirect" element={<RequireAuth><UPIRedirectPage /></RequireAuth>} />
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
