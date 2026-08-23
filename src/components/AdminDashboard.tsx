import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShoppingBag,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Search,
  RefreshCw,
  Edit2,
  X,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  Order,
  Reservation,
  MenuItem,
  AdminStats,
  UserProfile,
  OrderStatus,
  PaymentStatus,
  ReservationStatus,
} from '../types';
import { api } from '../services/api';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
}

const VALID_ORDER_NEXT: Record<OrderStatus, { value: OrderStatus; label: string }[]> = {
  pending: [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirm Order' },
    { value: 'cancelled', label: 'Cancel Order' },
  ],
  confirmed: [
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Start Cooking (Preparing)' },
    { value: 'cancelled', label: 'Cancel Order' },
  ],
  preparing: [
    { value: 'preparing', label: 'Preparing (Cooking)' },
    { value: 'ready', label: 'Mark Ready (Packed)' },
    { value: 'cancelled', label: 'Cancel Order' },
  ],
  ready: [
    { value: 'ready', label: 'Ready (Packed)' },
    { value: 'out_for_delivery', label: 'Send Out for Delivery' },
    { value: 'completed', label: 'Complete Order' },
    { value: 'cancelled', label: 'Cancel Order' },
  ],
  out_for_delivery: [
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'completed', label: 'Complete Order (Delivered)' },
    { value: 'cancelled', label: 'Cancel Order' },
  ],
  completed: [{ value: 'completed', label: 'Completed (Final)' }],
  cancelled: [{ value: 'cancelled', label: 'Cancelled (Final)' }],
};

const VALID_RESERVATION_NEXT: Record<ReservationStatus, { value: ReservationStatus; label: string }[]> = {
  pending: [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirm Table' },
    { value: 'cancelled', label: 'Cancel Booking' },
  ],
  confirmed: [
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'seated', label: 'Mark Seated' },
    { value: 'cancelled', label: 'Cancel Booking' },
  ],
  seated: [
    { value: 'seated', label: 'Seated at Table' },
    { value: 'completed', label: 'Complete Booking' },
    { value: 'cancelled', label: 'Cancel Booking' },
  ],
  completed: [{ value: 'completed', label: 'Completed (Final)' }],
  cancelled: [{ value: 'cancelled', label: 'Cancelled (Final)' }],
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  user,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'reservations' | 'menu' | 'audit'>('orders');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [reservationStatusFilter, setReservationStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  const isAdmin = user?.role === 'admin';

  // Fetch all admin data
  const loadAdminData = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const [fetchedStats, fetchedOrders, fetchedRes, fetchedMenu] = await Promise.all([
        api.admin.getStats(),
        api.orders.getAdminOrders({
          order_status: orderStatusFilter !== 'all' ? orderStatusFilter : undefined,
          payment_status: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        }),
        api.reservations.getAdminReservations(reservationStatusFilter),
        api.menu.getItems(true),
      ]);

      setStats(fetchedStats);
      setOrders(fetchedOrders);
      setReservations(fetchedRes);
      setMenuItems(fetchedMenu);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadAdminData();
    }
  }, [isOpen, isAdmin, orderStatusFilter, paymentStatusFilter, reservationStatusFilter]);

  // Vercel-safe realtime replacement: poll the existing authenticated APIs.
  // A long-lived SSE connection caused 300-second function timeouts on Vercel.
  useEffect(() => {
    if (!isOpen || !isAdmin) return;

    const interval = window.setInterval(() => {
      void loadAdminData();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isOpen, isAdmin, orderStatusFilter, paymentStatusFilter, reservationStatusFilter]);

  if (!isOpen) return null;

  // Render Restricted Guard if not Admin
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-[#F3F2EE] border-2 border-[#1A1A1A] rounded-3xl w-full max-w-md p-8 text-[#1A1A1A] text-center space-y-6 shadow-[8px_8px_0px_0px_#1A1A1A]">
          <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] text-amber-400 border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#1A1A1A]">Restricted Admin Portal</h3>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed font-medium">
              This management console is restricted to authenticated managers & kitchen staff of New Miami Restaurant.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="w-full bg-[#1A1A1A] hover:bg-stone-800 text-[#F3F2EE] font-bold py-3 px-4 rounded-xl text-xs border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#D97706] hover:shadow-[2px_2px_0px_0px_#D97706] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
            >
              Sign In with Admin Account
            </button>

            <button
              onClick={onClose}
              className="w-full bg-white hover:bg-stone-100 text-[#1A1A1A] font-bold py-2.5 px-4 rounded-xl text-xs border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] transition cursor-pointer"
            >
              Back to Restaurant
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Order Status Change
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await api.orders.updateStatus(orderId, status);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };
