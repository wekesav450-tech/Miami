import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MenuSection } from './components/MenuSection';
import { CartDrawer } from './components/CartDrawer';
import { ReservationSection } from './components/ReservationSection';
import { TrackModal } from './components/TrackModal';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AboutLocation } from './components/AboutLocation';
import { Footer } from './components/Footer';
import {
  MenuCategory,
  MenuItem,
  CartItem,
  UserProfile,
  Order,
  Reservation,
} from './types';
import { api, authStorage } from './services/api';
import { Bell, CheckCircle2 } from 'lucide-react';

const CART_STORAGE_KEY = 'nmr_cart_items';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => authStorage.getProfile());
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(true);

  // Cart state with persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Navigation & Modals
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isTrackOpen, setIsTrackOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [trackOrderNumber, setTrackOrderNumber] = useState<string>('');

  // Live Toast Notification
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' } | null>(null);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Load User Profile verification on mount & check URL for direct staff route
  useEffect(() => {
    if (authStorage.getToken()) {
      api.auth
        .getMe()
        .then((profile) => {
          if (profile) setUser(profile);
        })
        .catch(() => {
          setUser(null);
        });
    }

    const checkStaffRoute = () => {
      const pathname = window.location.pathname.toLowerCase();
      if (pathname === '/staff' || pathname === '/staff/') {
        setIsAdminOpen(true);
      }
    };

    checkStaffRoute();
    window.addEventListener('popstate', checkStaffRoute);
    return () => {
      window.removeEventListener('popstate', checkStaffRoute);
    };
  }, []);

  // Fetch Menu Categories and Items
  const loadMenu = async () => {
    setIsLoadingMenu(true);
    try {
      const [cats, items] = await Promise.all([
        api.menu.getCategories(),
        api.menu.getItems(),
      ]);
      setCategories(cats);
      setMenuItems(items);
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  // Connect Realtime SSE Stream
  useEffect(() => {
    const unsubscribe = api.realtime.connect((event) => {
      if (event.type === 'menu_updated') {
        // Refresh menu items
        api.menu.getItems().then((items) => setMenuItems(items)).catch(() => {});
      } else if (event.type === 'new_order' && user?.role === 'admin') {
        setToast({
          message: `🔔 New Order Received: #${event.data.order.order_number} (KES ${event.data.order.total_amount.toLocaleString()})`,
          type: 'info',
        });
      } else if (event.type === 'new_reservation' && user?.role === 'admin') {
        setToast({
          message: `📅 New Table Reservation: ${event.data.customer_name} (${event.data.number_of_guests} guests)`,
          type: 'info',
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Auto-dismiss toast after 6s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Cart operations
  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.menuItem.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Handlers for Orders and Bookings
  const handleOrderSuccess = (order: Order) => {
    setTrackOrderNumber(order.order_number);
    setToast({
      message: `Order #${order.order_number} placed successfully!`,
      type: 'success',
    });
  };

  const handleReservationCreated = (reservation: Reservation) => {
    setToast({
      message: `Table booked for ${reservation.customer_name} on ${reservation.reservation_date}!`,
      type: 'success',
    });
  };

  const handleAuthSuccess = (profile: UserProfile) => {
    const normalizedProfile: UserProfile = {
      ...profile,
      role: String(profile.role || '').toLowerCase() === 'admin' ? 'admin' : profile.role,
    };
    setUser(normalizedProfile);

    if (normalizedProfile.role === 'admin') {
      setIsAdminOpen(true);
      window.history.replaceState({}, '', '/staff');
      setToast({
        message: 'Welcome back, ' + normalizedProfile.full_name + '! Opening Admin Dashboard...',
        type: 'success',
      });
      return;
    }

    setToast({
      message: 'Welcome, ' + normalizedProfile.full_name + '!',
      type: 'success',
    });
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    setToast({
      message: 'Signed out successfully',
      type: 'info',
    });
  };

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F2EE] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#1A1A1A] selection:text-[#F3F2EE]">
      
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] p-4 rounded-xl text-xs text-[#1A1A1A] flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] text-[#F3F2EE] flex items-center justify-center shrink-0">
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Bell className="w-4 h-4 text-amber-400" />}
          </div>
          <div className="flex-1 pr-2">
            <p className="font-bold text-[#1A1A1A] leading-snug">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-stone-500 hover:text-[#1A1A1A] text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        cart={cart}
        user={user}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenTrack={() => setIsTrackOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onLogout={handleLogout}
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      {/* Main Page Layout */}
      <main className="flex-1">
        <Hero
          onExploreMenu={() => handleNavigate('menu')}
          onBookTable={() => handleNavigate('reserve')}
        />

        <MenuSection
          categories={categories}
          menuItems={menuItems}
          cart={cart}
          onAddToCart={handleAddToCart}
          onUpdateCartQuantity={handleUpdateCartQuantity}
        />

        <ReservationSection
          user={user}
          onReservationCreated={handleReservationCreated}
        />

        <AboutLocation />
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenTrack={() => setIsTrackOpen(true)}
      />

      {/* Modals & Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        user={user}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOrderSuccess={handleOrderSuccess}
      />

      <TrackModal
        isOpen={isTrackOpen}
        onClose={() => {
          setIsTrackOpen(false);
          setTrackOrderNumber('');
        }}
        initialOrderNumber={trackOrderNumber}
        user={user}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => {
          setIsAdminOpen(false);
          if (window.location.pathname.toLowerCase() === '/staff') {
            window.history.replaceState({}, '', '/');
          }
        }}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

    </div>
  );
}
