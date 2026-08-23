import React from 'react';
import {
  UtensilsCrossed,
  ShoppingBag,
  Calendar,
  Search,
  User,
  Shield,
  Phone,
  Clock,
  MapPin,
  Menu as MenuIcon,
  X,
  LogOut,
} from 'lucide-react';
import { UserProfile, CartItem } from '../types';

interface NavbarProps {
  cart: CartItem[];
  user: UserProfile | null;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenTrack: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  activeSection: string;
  onNavigate: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cart,
  user,
  onOpenCart,
  onOpenAuth,
  onOpenTrack,
  onOpenAdmin,
  onLogout,
  activeSection,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { id: 'menu', label: 'Menu & Dishes' },
    { id: 'reserve', label: 'Book a Table' },
    { id: 'about', label: 'About & Location' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#F3F2EE]/95 backdrop-blur-md border-b-2 border-[#1A1A1A] text-[#1A1A1A] transition-all">
      {/* Top Utility Bar */}
      <div className="bg-[#1A1A1A] text-[#F3F2EE] text-xs py-2 px-4 border-b border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> Naivasha, Kenya
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-stone-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Open Daily: 8:00 AM – 11:00 PM
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href="https://wa.me/254741775878?text=Hello%20New%20Miami%20Restaurant,%20I%20would%20like%20to%20inquire%20about%20ordering"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition"
            >
              <Phone className="w-3.5 h-3.5" /> Call / WhatsApp: 0741775878
            </a>
            <span className="hidden md:inline-block bg-white/10 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold text-[#F3F2EE] border border-white/20">
              M-Pesa Pochi: 0741775878
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div
            id="brand-logo"
            onClick={() => onNavigate('hero')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-lg bg-[#1A1A1A] text-[#F3F2EE] flex items-center justify-center border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
              <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A1A1A] group-hover:text-amber-700 transition-colors">
                  New Miami
                </span>
                <span className="text-[11px] bg-[#1A1A1A] text-[#F3F2EE] px-2 py-0.5 rounded font-mono font-bold">
                  Naivasha
                </span>
              </div>
              <p className="text-[11px] text-stone-600 tracking-wider uppercase font-semibold">
                Restaurant & Flame Grill
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <button
                key={link.id}
                id={`nav-link-${link.id}`}
                onClick={() => onNavigate(link.id)}
                className={`text-sm font-bold transition-colors cursor-pointer relative py-1 ${
                  activeSection === link.id
                    ? 'text-[#1A1A1A]'
                    : 'text-stone-600 hover:text-[#1A1A1A]'
                }`}
              >
                {link.label}
                {activeSection === link.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1A1A1A]" />
                )}
              </button>
            ))}

            <button
              id="nav-track-order-btn"
              onClick={onOpenTrack}
              className="flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F3F2EE] bg-white px-3.5 py-2 rounded-lg border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] hover:shadow-[1px_1px_0px_0px_#1A1A1A] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              Track Order / Booking
            </button>
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-3">
            {/* Admin Portal Button */}
            {user?.role === 'admin' ? (
              <button
                id="nav-admin-dashboard-btn"
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 text-xs font-bold bg-amber-500 text-[#1A1A1A] px-3.5 py-2 rounded-lg border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] hover:shadow-[1px_1px_0px_0px_#1A1A1A] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Portal</span>
              </button>
            ) : (
              <button
                id="nav-admin-login-link"
                onClick={onOpenAdmin}
                className="hidden lg:flex items-center gap-1 text-xs text-stone-600 hover:text-[#1A1A1A] font-semibold transition py-1.5 px-2.5 rounded border border-transparent hover:border-[#1A1A1A]"
                title="Restaurant Staff & Admin Access"
              >
                <Shield className="w-3.5 h-3.5 text-stone-600" />
                <span>Staff</span>
              </button>
            )}

            {/* User Account / Sign in */}
            {user ? (
              <div className="relative group">
                <button
                  id="nav-user-profile-btn"
                  className="flex items-center gap-2 text-xs bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] font-bold px-3 py-2 rounded-lg shadow-[2px_2px_0px_0px_#1A1A1A] transition"
                >
                  <User className="w-4 h-4 text-amber-600" />
                  <span className="max-w-[100px] truncate font-bold">{user.full_name}</span>
                </button>

                <div className="absolute right-0 top-full mt-2 w-52 bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-xl py-2 hidden group-hover:block transition-all z-50">
                  <div className="px-4 py-2 border-b-2 border-[#1A1A1A] bg-[#F3F2EE]">
                    <p className="text-xs font-bold text-[#1A1A1A] truncate">{user.full_name}</p>
                    <p className="text-[11px] text-stone-600 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 bg-[#1A1A1A] text-[#F3F2EE] rounded">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={onOpenTrack}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#1A1A1A] hover:bg-[#F3F2EE] transition"
                  >
                    My Orders & Bookings
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="nav-auth-login-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F3F2EE] bg-white px-3.5 py-2 rounded-lg border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Cart Drawer Trigger */}
            <button
              id="nav-cart-btn"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-[#1A1A1A] hover:bg-stone-800 text-[#F3F2EE] font-bold px-4 py-2 rounded-lg border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#D97706] hover:shadow-[1px_1px_0px_0px_#D97706] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span className="text-xs hidden sm:inline font-bold">Cart</span>
              {totalCartCount > 0 && (
                <span
                  id="nav-cart-badge-count"
                  className="w-5 h-5 rounded-full bg-amber-400 text-[#1A1A1A] text-[11px] font-mono font-extrabold flex items-center justify-center -ml-0.5 border border-[#1A1A1A]"
                >
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              id="nav-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#1A1A1A] hover:bg-white border-2 border-[#1A1A1A] rounded-lg transition"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b-2 border-[#1A1A1A] px-4 pt-3 pb-5 space-y-3">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 rounded-lg text-sm font-bold transition ${
                  activeSection === link.id
                    ? 'bg-[#1A1A1A] text-[#F3F2EE]'
                    : 'text-[#1A1A1A] hover:bg-[#F3F2EE]'
                }`}
              >
                {link.label}
              </button>
            ))}

            <button
              onClick={() => {
                onOpenTrack();
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 rounded-lg text-sm font-bold text-[#1A1A1A] hover:bg-[#F3F2EE] flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-amber-600" />
              Track Order / Booking
            </button>

            <button
              onClick={() => {
                onNavigate('reserve');
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 rounded-lg text-sm font-bold text-[#1A1A1A] hover:bg-[#F3F2EE] flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-amber-600" />
              Book Table
            </button>

            <button
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 rounded-lg text-sm font-bold text-amber-700 hover:bg-[#F3F2EE] flex items-center gap-2 border-t-2 border-[#1A1A1A] pt-2"
            >
              <Shield className="w-4 h-4 text-amber-600" />
              Admin Portal
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
