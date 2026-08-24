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

  const isAdmin = String(user?.role || '').toLowerCase().trim() === 'admin';

  const loadAdminData = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      // Load the order queue independently. A failure in stats, reservations,
      // or menu data must never hide valid Supabase orders.
      const [statsResult, ordersResult, reservationsResult, menuResult] = await Promise.allSettled([
        api.admin.getStats(),
        api.orders.getAdminOrders({
          order_status: orderStatusFilter !== 'all' ? orderStatusFilter : undefined,
          payment_status: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        }),
        api.reservations.getAdminReservations(reservationStatusFilter),
        api.menu.getItems(true),
      ]);
      if (statsResult.status === 'fulfilled') setStats(statsResult.value);
      if (ordersResult.status === 'fulfilled') {
        setOrders(ordersResult.value);
      } else {
        console.error('Failed to load orders:', ordersResult.reason);
      }
      if (reservationsResult.status === 'fulfilled') setReservations(reservationsResult.value);
      if (menuResult.status === 'fulfilled') setMenuItems(menuResult.value);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdmin) loadAdminData();
  }, [isOpen, isAdmin, orderStatusFilter, paymentStatusFilter, reservationStatusFilter]);

  // Vercel-safe realtime: refresh authenticated admin data every 5 seconds.
  // This replaces the previous long-lived SSE connection that timed out on Vercel.
  useEffect(() => {
    if (!isOpen || !isAdmin) return;
    const interval = window.setInterval(() => void loadAdminData(), 5000);
    return () => window.clearInterval(interval);
  }, [isOpen, isAdmin, orderStatusFilter, paymentStatusFilter, reservationStatusFilter]);

  if (!isOpen) return null;

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-[#F3F2EE] border-2 border-[#1A1A1A] rounded-3xl w-full max-w-md p-8 text-[#1A1A1A] text-center space-y-6 shadow-[8px_8px_0px_0px_#1A1A1A]">
          <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] text-amber-400 border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#1A1A1A]">Restricted Admin Portal</h3>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed font-medium">This management console is restricted to authenticated managers & kitchen staff of New Miami Restaurant.</p>
          </div>
          <div className="space-y-3">
            <button onClick={() => { onClose(); onOpenAuth(); }} className="w-full bg-[#1A1A1A] hover:bg-stone-800 text-[#F3F2EE] font-bold py-3 px-4 rounded-xl text-xs border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#D97706] hover:shadow-[2px_2px_0px_0px_#D97706] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer">Sign In with Admin Account</button>
            <button onClick={onClose} className="w-full bg-white hover:bg-stone-100 text-[#1A1A1A] font-bold py-2.5 px-4 rounded-xl text-xs border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] transition cursor-pointer">Back to Restaurant</button>
          </div>
        </div>
      </div>
    );
  }

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try { await api.orders.updateStatus(orderId, status); loadAdminData(); }
    catch (err: any) { alert(err.message || 'Failed to update order status'); }
    finally { setUpdatingId(null); }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: PaymentStatus) => {
    setUpdatingId(orderId);
    try { await api.orders.updatePayment(orderId, status); loadAdminData(); }
    catch (err: any) { alert(err.message || 'Failed to update payment status'); }
    finally { setUpdatingId(null); }
  };

  const handleUpdateReservationStatus = async (resId: string, status: ReservationStatus) => {
    setUpdatingId(resId);
    try { await api.reservations.updateStatus(resId, status); loadAdminData(); }
    catch (err: any) { alert(err.message || 'Failed to update reservation status'); }
    finally { setUpdatingId(null); }
  };

  const handleToggleMenuAvailability = async (item: MenuItem) => {
    setUpdatingId(item.id);
    try { await api.menu.updateItem(item.id, { is_available: !item.is_available }); loadAdminData(); }
    catch (err: any) { alert(err.message || 'Failed to update menu item'); }
    finally { setUpdatingId(null); }
  };

  const handleSavePrice = async (itemId: string) => {
    const priceNum = parseFloat(tempPrice);
    if (isNaN(priceNum) || priceNum <= 0) { alert('Please enter a valid price'); return; }
    setUpdatingId(itemId);
    try { await api.menu.updateItem(itemId, { price_kes: priceNum }); setEditingPriceId(null); loadAdminData(); }
    catch (err: any) { alert(err.message || 'Failed to update price'); }
    finally { setUpdatingId(null); }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex flex-col animate-in fade-in duration-200">
      <div className="bg-white border-b-2 border-[#1A1A1A] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-[#F3F2EE] border-2 border-[#1A1A1A] flex items-center justify-center font-bold shadow-[2px_2px_0px_0px_#1A1A1A]"><Shield className="w-5 h-5 text-amber-400" /></div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#1A1A1A]">New Miami Admin Console</h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border-2 border-[#1A1A1A] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />Live Auto-Refresh</span>
            </div>
            <p className="text-xs text-stone-600 font-medium">Naivasha, Kenya • Pochi: 0741775878</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadAdminData} disabled={isLoading} className="flex items-center gap-1.5 text-xs text-[#1A1A1A] hover:bg-stone-100 bg-[#F3F2EE] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] px-3 py-2 rounded-xl font-bold transition cursor-pointer"><RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Refresh Data</span></button>
          <button onClick={onClose} className="p-2 text-stone-600 hover:text-[#1A1A1A] hover:bg-stone-100 rounded-xl border border-transparent hover:border-[#1A1A1A] transition cursor-pointer" aria-label="Close admin dashboard"><X className="w-5 h-5" /></button>
        </div>
      </div>

      {stats && (
        <div className="bg-[#F3F2EE] border-b-2 border-[#1A1A1A] px-6 py-4 overflow-x-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 min-w-[650px]">
            {[
              ["Today's Revenue", `KES ${stats.todayRevenueKes.toLocaleString()}`, 'text-emerald-800'],
              ['Total Revenue (Paid)', `KES ${stats.totalRevenueKes.toLocaleString()}`, 'text-[#1A1A1A]'],
              ['Pending Orders', stats.pendingOrdersCount, 'text-amber-700'],
              ['Total Orders', stats.totalOrdersCount, 'text-[#1A1A1A]'],
              ['Active Bookings', stats.activeReservationsCount, 'text-[#1A1A1A]'],
              ['Active Menu Dishes', stats.totalMenuItemsCount, 'text-[#1A1A1A]'],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="bg-white p-3 rounded-xl border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A]"><span className="text-[10px] text-stone-600 uppercase font-bold">{label}</span><p className={`text-base font-extrabold font-mono mt-0.5 ${color}`}>{value}</p></div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white px-6 border-b-2 border-[#1A1A1A] flex items-center gap-4">
        {[
          { id: 'orders', label: `Orders (${orders.length})`, icon: <ShoppingBag className="w-4 h-4" /> },
          { id: 'reservations', label: `Reservations (${reservations.length})`, icon: <Calendar className="w-4 h-4" /> },
          { id: 'menu', label: `Menu & Stock (${menuItems.length})`, icon: <Layers className="w-4 h-4" /> },
          { id: 'audit', label: 'Security & Database', icon: <Shield className="w-4 h-4" /> },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 py-3.5 px-3 text-xs font-extrabold border-b-2 transition cursor-pointer ${activeTab === tab.id ? 'border-[#1A1A1A] text-[#1A1A1A] bg-[#F3F2EE]' : 'border-transparent text-stone-500 hover:text-[#1A1A1A]'}`}>{tab.icon}<span>{tab.label}</span></button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F3F2EE]">
        {activeTab === 'orders' && (
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A]">
              <div className="flex flex-wrap items-center gap-3">
                <div><label className="text-[10px] text-stone-700 font-bold block mb-1">Order Status:</label><select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)} className="bg-[#F3F2EE] border-2 border-[#1A1A1A] rounded-lg px-2.5 py-1.5 text-xs text-[#1A1A1A] font-bold focus:outline-none"><option value="all">All Order Statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="preparing">Preparing</option><option value="ready">Ready</option><option value="out_for_delivery">Out for Delivery</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
                <div><label className="text-[10px] text-stone-700 font-bold block mb-1">Payment Status:</label><select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} className="bg-[#F3F2EE] border-2 border-[#1A1A1A] rounded-lg px-2.5 py-1.5 text-xs text-[#1A1A1A] font-bold focus:outline-none"><option value="all">All Payment Statuses</option><option value="pending">Pending (Unpaid)</option><option value="paid">Paid (Verified)</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option></select></div>
              </div>
              <span className="text-xs text-stone-700 font-mono font-bold bg-[#F3F2EE] px-3 py-1 rounded border border-[#1A1A1A]">Showing {orders.length} real orders</span>
            </div>
            {orders.length === 0 ? <div className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-2xl p-12 text-center text-stone-600 font-medium text-xs">No orders match current filter criteria.</div> : <div className="space-y-3">{orders.map((ord) => (
              <div key={ord.id} className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-5 shadow-[4px_4px_0px_0px_#1A1A1A] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1A1A1A]/10 pb-3"><div><div className="flex items-center gap-2"><span className="font-mono font-bold text-[#1A1A1A] text-base">{ord.order_number}</span><span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-[#F3F2EE] text-[#1A1A1A] border border-[#1A1A1A]">{ord.order_type}</span><span className="text-[11px] text-stone-500 font-medium">{new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><p className="text-xs text-stone-700 font-medium mt-1">Customer: <strong className="text-[#1A1A1A]">{ord.customer_name}</strong> • Phone: <a href={`tel:${ord.customer_phone}`} className="text-[#1A1A1A] font-bold hover:underline font-mono">{ord.customer_phone}</a></p></div><div className="flex items-center gap-3"><div className="text-right"><span className="text-base font-mono font-bold text-[#1A1A1A] block">KES {ord.total_amount.toLocaleString()}</span><span className="text-[10px] text-stone-500 font-medium">(Subtotal: {ord.subtotal} + Delivery: {ord.delivery_fee})</span></div><div className="flex flex-col items-end gap-1"><span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border-2 border-[#1A1A1A] ${ord.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{ord.payment_status}</span>{ord.payment?.transaction_reference && <span className="text-[10px] font-mono text-stone-700 bg-[#F3F2EE] px-1.5 py-0.5 rounded border border-[#1A1A1A]">Ref: {ord.payment.transaction_reference}</span>}</div></div></div>
                {ord.items && ord.items.length > 0 && <div className="bg-[#F3F2EE] p-3 rounded-xl border border-[#1A1A1A]"><p className="text-[11px] text-stone-700 uppercase font-bold mb-1">Items Ordered ({ord.items.length}):</p><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">{ord.items.map((it) => <div key={it.id} className="text-xs text-[#1A1A1A] font-medium">• <strong className="text-[#1A1A1A]">{it.quantity}x</strong> {it.item_name_snapshot} <span className="text-stone-600 font-mono text-[11px]">(KES {it.subtotal.toLocaleString()})</span></div>)}</div></div>}
                {(ord.delivery_address || ord.notes) && <div className="text-xs text-stone-700 space-y-1 font-medium">{ord.delivery_address && <p><strong className="text-[#1A1A1A]">Delivery Address:</strong> {ord.delivery_address}</p>}{ord.notes && <p><strong className="text-[#1A1A1A]">Special Notes:</strong> {ord.notes}</p>}</div>}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t-2 border-[#1A1A1A]/10"><div className="flex items-center gap-2"><span className="text-xs text-stone-700 font-bold">Update Status:</span>{ord.order_status === 'completed' || ord.order_status === 'cancelled' ? <span className={`text-xs px-2.5 py-1 rounded-lg font-bold uppercase border-2 border-[#1A1A1A] ${ord.order_status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{ord.order_status} (Final)</span> : <select disabled={updatingId === ord.id} value={ord.order_status} onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)} className="bg-white border-2 border-[#1A1A1A] rounded-lg px-3 py-1.5 text-xs text-[#1A1A1A] font-bold focus:outline-none shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer">{(VALID_ORDER_NEXT[ord.order_status] || []).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>}</div><div className="flex items-center gap-2">{ord.payment_status !== 'paid' ? <button disabled={updatingId === ord.id} onClick={() => handleUpdatePaymentStatus(ord.id, 'paid')} className="text-xs bg-[#1A1A1A] hover:bg-stone-800 text-[#F3F2EE] font-bold px-3 py-1.5 rounded-lg border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#10B981] transition cursor-pointer">Mark M-Pesa Verified (Paid)</button> : <button disabled={updatingId === ord.id} onClick={() => handleUpdatePaymentStatus(ord.id, 'pending')} className="text-xs bg-[#F3F2EE] hover:bg-white text-stone-700 font-bold px-3 py-1.5 rounded-lg border border-[#1A1A1A] transition cursor-pointer">Reset to Pending</button>}<a href={`https://wa.me/254${ord.customer_phone.replace(/^0/, '')}?text=Hello%20${encodeURIComponent(ord.customer_name)},%20this%20is%20New%20Miami%20Restaurant%20regarding%20Order%20${ord.order_number}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-emerald-800 hover:text-emerald-900 bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] px-3 py-1.5 rounded-lg font-bold"><Phone className="w-3.5 h-3.5" /><span>WhatsApp Customer</span></a></div></div>
              </div>
            ))}</div>}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A]"><div className="flex items-center gap-3"><label className="text-xs text-stone-700 font-bold">Filter Status:</label><select value={reservationStatusFilter} onChange={(e) => setReservationStatusFilter(e.target.value)} className="bg-[#F3F2EE] border-2 border-[#1A1A1A] rounded-lg px-3 py-1.5 text-xs text-[#1A1A1A] font-bold"><option value="all">All Bookings</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="seated">Seated</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div><span className="text-xs text-stone-700 font-mono font-bold bg-[#F3F2EE] px-3 py-1 rounded border border-[#1A1A1A]">{reservations.length} table bookings</span></div>
            {reservations.length === 0 ? <div className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-2xl p-12 text-center text-stone-600 font-medium text-xs">No table bookings found.</div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{reservations.map((res) => <div key={res.id} className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-5 space-y-3 shadow-[4px_4px_0px_0px_#1A1A1A]"><div className="flex items-center justify-between border-b-2 border-[#1A1A1A]/10 pb-2.5"><div><h4 className="text-sm font-bold text-[#1A1A1A]">{res.customer_name}</h4><p className="text-xs text-stone-600 font-mono font-medium">{res.customer_phone}</p></div><span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border-2 border-[#1A1A1A] ${res.status === 'confirmed' || res.status === 'seated' ? 'bg-emerald-100 text-emerald-800' : 'bg-[#F3F2EE] text-[#1A1A1A]'}`}>{res.status}</span></div><div className="grid grid-cols-3 gap-2 bg-[#F3F2EE] p-2.5 rounded-xl border border-[#1A1A1A] text-xs"><div><span className="text-[10px] text-stone-600 font-bold block">Date:</span><span className="font-bold text-[#1A1A1A]">{res.reservation_date}</span></div><div><span className="text-[10px] text-stone-600 font-bold block">Time:</span><span className="font-bold text-[#1A1A1A]">{res.reservation_time}</span></div><div><span className="text-[10px] text-stone-600 font-bold block">Guests:</span><span className="font-bold text-[#1A1A1A]">{res.number_of_guests} people</span></div></div>{res.special_requests && <p className="text-xs text-stone-600 italic font-medium">"{res.special_requests}"</p>}<div className="flex items-center justify-between pt-2 border-t-2 border-[#1A1A1A]/10">{res.status === 'completed' || res.status === 'cancelled' ? <span className={`text-xs px-2.5 py-1 rounded-lg font-bold uppercase border-2 border-[#1A1A1A] ${res.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{res.status} (Final)</span> : <select disabled={updatingId === res.id} value={res.status} onChange={(e) => handleUpdateReservationStatus(res.id, e.target.value as ReservationStatus)} className="bg-[#F3F2EE] border-2 border-[#1A1A1A] rounded-lg px-3 py-1.5 text-xs text-[#1A1A1A] font-bold shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer">{(VALID_RESERVATION_NEXT[res.status] || []).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>}<a href={`https://wa.me/254${res.customer_phone.replace(/^0/, '')}?text=Hello%20${encodeURIComponent(res.customer_name)},%20confirming%20your%20table%20reservation%20at%20New%20Miami%20Restaurant%20for%20${res.reservation_date}%20at%20${res.reservation_time}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-800 hover:text-emerald-900 bg-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] px-3 py-1 rounded-lg flex items-center gap-1 font-bold"><Phone className="w-3.5 h-3.5" /><span>Confirm via WhatsApp</span></a></div></div>)}</div>}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="bg-white p-4 rounded-2xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] flex items-center justify-between"><span className="text-xs text-stone-700 font-medium">Toggle dish availability or adjust price in KES</span><span className="text-xs text-[#1A1A1A] font-mono font-extrabold bg-[#F3F2EE] px-3 py-1 rounded border border-[#1A1A1A]">{menuItems.length} Dishes</span></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{menuItems.map((item) => <div key={item.id} className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-4 flex gap-3 items-center justify-between shadow-[4px_4px_0px_0px_#1A1A1A]"><img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover border-2 border-[#1A1A1A] bg-[#F3F2EE] shrink-0" referrerPolicy="no-referrer" /><div className="flex-1 min-w-0"><h4 className="text-xs font-bold text-[#1A1A1A] truncate">{item.name}</h4><span className="text-[10px] text-stone-600 font-medium block">{item.category_name}</span>{editingPriceId === item.id ? <div className="flex items-center gap-1 mt-1"><input type="number" value={tempPrice} onChange={(e) => setTempPrice(e.target.value)} className="w-20 bg-[#F3F2EE] border-2 border-[#1A1A1A] rounded px-2 py-0.5 text-xs text-[#1A1A1A] font-mono font-bold" /><button onClick={() => handleSavePrice(item.id)} className="text-[10px] bg-[#1A1A1A] text-[#F3F2EE] font-bold px-2 py-1 rounded border border-[#1A1A1A]">Save</button><button onClick={() => setEditingPriceId(null)} className="text-[10px] text-stone-600 hover:text-[#1A1A1A] font-bold">Cancel</button></div> : <div className="flex items-center gap-2 mt-1"><span className="text-xs font-mono font-extrabold text-[#1A1A1A]">KES {item.price_kes.toLocaleString()}</span><button onClick={() => { setEditingPriceId(item.id); setTempPrice(item.price_kes.toString()); }} className="text-stone-500 hover:text-[#1A1A1A] p-0.5 cursor-pointer" title="Edit Price"><Edit2 className="w-3 h-3" /></button></div>}</div><button disabled={updatingId === item.id} onClick={() => handleToggleMenuAvailability(item)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] transition cursor-pointer ${item.is_available ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'}`}>{item.is_available ? 'In Stock' : 'Sold Out'}</button></div>)}</div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="max-w-4xl mx-auto space-y-4"><div className="bg-white border-2 border-[#1A1A1A] rounded-3xl p-6 space-y-4 shadow-[4px_4px_0px_0px_#1A1A1A]"><div className="flex items-center gap-3 border-b-2 border-[#1A1A1A]/10 pb-3"><Shield className="w-6 h-6 text-amber-600" /><div><h3 className="font-bold text-base text-[#1A1A1A]">Production Security & Relational Schema</h3><p className="text-xs text-stone-600 font-medium">Verified backend parameters & business compliance</p></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"><div className="bg-[#F3F2EE] p-3.5 rounded-xl border border-[#1A1A1A] space-y-1.5"><span className="text-[10px] text-stone-600 uppercase font-bold">Restaurant Location</span><p className="text-[#1A1A1A] font-bold">Naivasha, Kenya (Moi South Lake Rd / CBD)</p></div><div className="bg-[#F3F2EE] p-3.5 rounded-xl border border-[#1A1A1A] space-y-1.5"><span className="text-[10px] text-stone-600 uppercase font-bold">M-Pesa Pochi Verification</span><p className="text-[#1A1A1A] font-mono font-bold">0741775878 (New Miami Restaurant)</p></div><div className="bg-[#F3F2EE] p-3.5 rounded-xl border border-[#1A1A1A] space-y-1.5"><span className="text-[10px] text-stone-600 uppercase font-bold">Database Tables Active</span><p className="text-stone-700 font-medium">profiles, menu_categories, menu_items, orders, order_items, reservations, payments</p></div><div className="bg-[#F3F2EE] p-3.5 rounded-xl border border-[#1A1A1A] space-y-1.5"><span className="text-[10px] text-stone-600 uppercase font-bold">Role Enforcement (RBAC)</span><p className="text-emerald-800 font-bold">Strict Customer / Admin Server Guards Active</p></div></div><div className="p-4 bg-[#F3F2EE] rounded-xl border border-[#1A1A1A] text-xs text-stone-700 leading-relaxed font-medium"><strong className="text-[#1A1A1A] font-bold">Server-Side Calculation Guarantee:</strong> All order totals and pricing are computed exclusively from database records upon receipt. No client-manipulated prices or totals are trusted. Admin data refreshes automatically every 5 seconds.</div></div></div>
        )}
      </div>
    </div>
  );
};
