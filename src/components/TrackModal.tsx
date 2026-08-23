import React, { useState } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  ChefHat,
  Bike,
  Check,
  AlertCircle,
  Phone,
  CreditCard,
  Send,
  ShoppingBag,
} from 'lucide-react';
import { Order, OrderStatus, UserProfile } from '../types';
import { api } from '../services/api';

interface TrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string;
  user: UserProfile | null;
}

export const TrackModal: React.FC<TrackModalProps> = ({
  isOpen,
  onClose,
  initialOrderNumber = '',
  user,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialOrderNumber);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [mpesaCodeInput, setMpesaCodeInput] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [codeSuccessMessage, setCodeSuccessMessage] = useState<string | null>(null);

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);

  // Load customer orders if user is authenticated
  React.useEffect(() => {
    if (isOpen && user) {
      setLoadingMyOrders(true);
      api.orders
        .getMyOrders()
        .then((orders) => setMyOrders(orders))
        .catch(() => {})
        .finally(() => setLoadingMyOrders(false));
    }
  }, [isOpen, user]);

  // If initialOrderNumber provided, search immediately
  React.useEffect(() => {
    if (initialOrderNumber && isOpen) {
      handleSearch(initialOrderNumber);
    }
  }, [initialOrderNumber, isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (queryToUse?: string) => {
    const q = (queryToUse || searchQuery).trim();
    if (!q) {
      setErrorMessage('Please enter an order number (e.g. NMR-2026-1234)');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setCodeSuccessMessage(null);

    try {
      const order = await api.orders.track(q);
      setCurrentOrder(order);
    } catch (err: any) {
      console.error('Track order error:', err);
      setErrorMessage(err.message || 'Order not found. Please verify the order number.');
      setCurrentOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMpesaCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder || !mpesaCodeInput.trim()) return;

    setIsSubmittingCode(true);
    setCodeSuccessMessage(null);

    try {
      const res = await api.payments.submitMpesaCode(currentOrder.id, mpesaCodeInput.trim());
      setCodeSuccessMessage(res.message);
      // Refresh order details
      const refreshed = await api.orders.track(currentOrder.order_number);
      setCurrentOrder(refreshed);
      setMpesaCodeInput('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit M-Pesa transaction code');
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const steps: { key: OrderStatus; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      key: 'pending',
      label: 'Order Placed',
      icon: <Clock className="w-4 h-4" />,
      desc: 'Received by New Miami system',
    },
    {
      key: 'confirmed',
      label: 'Accepted',
      icon: <CheckCircle2 className="w-4 h-4" />,
      desc: 'Kitchen verified order details',
    },
    {
      key: 'preparing',
      label: 'Cooking',
      icon: <ChefHat className="w-4 h-4" />,
      desc: 'Sizzling on the grill & flame',
    },
    {
      key: 'ready',
      label: 'Ready / Dispatch',
      icon: <Bike className="w-4 h-4" />,
      desc: 'Packed hot & ready for pickup/rider',
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: <Check className="w-4 h-4" />,
      desc: 'Delivered / Served at table',
    },
  ];

  const getStepIndex = (status: OrderStatus): number => {
    if (status === 'cancelled') return -1;
    const map: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 1,
      preparing: 2,
      ready: 3,
      out_for_delivery: 3,
      completed: 4,
      cancelled: -1,
    };
    return map[status] ?? 0;
  };

  const currentStepIdx = currentOrder ? getStepIndex(currentOrder.order_status) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F3F2EE] border-2 border-[#1A1A1A] rounded-3xl w-full max-w-2xl text-[#1A1A1A] shadow-[8px_8px_0px_0px_#1A1A1A] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b-2 border-[#1A1A1A] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-[#F3F2EE] border-2 border-[#1A1A1A] flex items-center justify-center font-bold shadow-[2px_2px_0px_0px_#1A1A1A]">
              <Search className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#1A1A1A]">Live Order Tracking</h3>
              <p className="text-xs text-stone-600 font-medium">Track kitchen preparation & delivery in Naivasha</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-600 hover:text-[#1A1A1A] hover:bg-stone-100 rounded-lg transition border border-transparent hover:border-[#1A1A1A]"
            aria-label="Close track modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Order # (e.g. NMR-2026-4821)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none shadow-[2px_2px_0px_0px_#1A1A1A]"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#1A1A1A] hover:bg-stone-800 text-[#F3F2EE] font-bold px-5 py-2.5 rounded-xl text-xs border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#D97706] hover:shadow-[1px_1px_0px_0px_#D97706] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
            >
              {isLoading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-600 text-rose-800 text-xs flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ACTIVE ORDER RESULT VIEW */}
          {currentOrder && (
            <div className="space-y-6">
              
              {/* Order Info Card */}
              <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-5 space-y-3 shadow-[4px_4px_0px_0px_#1A1A1A]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#1A1A1A]/10 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
                      Order Reference
                    </span>
                    <h4 className="text-xl font-bold font-mono text-[#1A1A1A]">
                      {currentOrder.order_number}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-[#F3F2EE] text-[#1A1A1A] border-2 border-[#1A1A1A]">
                      Type: {currentOrder.order_type}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border-2 border-[#1A1A1A] ${
                        currentOrder.payment_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      Payment: {currentOrder.payment_status}
                    </span>
                  </div>
                </div>

                {/* Progress Steps */}
                {currentOrder.order_status === 'cancelled' ? (
                  <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-600 text-rose-800 text-xs text-center font-semibold">
                    This order was cancelled. Please contact restaurant host at <strong>0741775878</strong>.
                  </div>
                ) : (
                  <div className="py-3">
                    <div className="relative flex items-center justify-between">
                      {steps.map((step, idx) => {
                        const isDone = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;

                        return (
                          <div key={step.key} className="flex flex-col items-center z-10 text-center flex-1">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] ${
                                isDone
                                  ? 'bg-[#1A1A1A] text-amber-400 font-bold'
                                  : 'bg-[#F3F2EE] text-stone-400'
                              } ${isCurrent ? 'ring-4 ring-amber-400/40 animate-pulse' : ''}`}
                            >
                              {step.icon}
                            </div>
                            <span
                              className={`text-[11px] font-bold mt-1.5 ${
                                isDone ? 'text-[#1A1A1A]' : 'text-stone-400'
                              }`}
                            >
                              {step.label}
                            </span>
                            <span className="text-[9px] text-stone-500 hidden sm:block max-w-[80px] leading-tight mt-0.5 font-medium">
                              {step.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Items & Delivery Details */}
                <div className="pt-3 border-t-2 border-[#1A1A1A]/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-stone-600 font-bold mb-1">Customer & Destination:</p>
                    <p className="text-[#1A1A1A] font-bold">{currentOrder.customer_name}</p>
                    <p className="text-stone-700 font-mono font-semibold">{currentOrder.customer_phone}</p>
                    {currentOrder.delivery_address && (
                      <p className="text-stone-600 mt-1">{currentOrder.delivery_address}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-stone-600 font-bold mb-1">Financial Summary:</p>
                    <p className="text-stone-700 font-medium">Subtotal: KES {currentOrder.subtotal.toLocaleString()}</p>
                    <p className="text-stone-700 font-medium">Delivery: KES {currentOrder.delivery_fee.toLocaleString()}</p>
                    <p className="text-[#1A1A1A] font-extrabold font-mono text-sm mt-1 bg-[#F3F2EE] px-2 py-0.5 rounded border border-[#1A1A1A] inline-block">
                      Total: KES {currentOrder.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Ordered Items List */}
                {currentOrder.items && currentOrder.items.length > 0 && (
                  <div className="pt-3 border-t-2 border-[#1A1A1A]/10">
                    <p className="text-[11px] text-stone-600 font-bold mb-1.5">Order Items:</p>
                    <div className="space-y-1">
                      {currentOrder.items.map((it) => (
                        <div key={it.id} className="flex justify-between text-xs text-[#1A1A1A]">
                          <span className="font-semibold">
                            {it.quantity}x {it.item_name_snapshot}
                          </span>
                          <span className="font-mono text-stone-700 font-bold">
                            KES {it.subtotal.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Verification Box (if pending) */}
              {currentOrder.payment_status === 'pending' && (
                <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-5 space-y-3 shadow-[4px_4px_0px_0px_#1A1A1A]">
                  <div className="flex items-center gap-2 text-[#1A1A1A] font-extrabold text-xs">
                    <CreditCard className="w-4 h-4 text-amber-700" />
                    <span>Complete M-Pesa Pochi Payment</span>
                  </div>

                  <p className="text-xs text-stone-700">
                    Send <strong>KES {currentOrder.total_amount.toLocaleString()}</strong> to Pochi{' '}
                    <strong className="text-[#1A1A1A] bg-amber-100 px-1.5 py-0.5 rounded border border-[#1A1A1A]">0741775878</strong> (New Miami Restaurant).
                  </p>

                  <form onSubmit={handleMpesaCodeSubmit} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Paste M-Pesa Code (e.g. QKH789XYZ)"
                      value={mpesaCodeInput}
                      onChange={(e) => setMpesaCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-[#F3F2EE] border-2 border-[#1A1A1A] rounded-xl px-3 py-2 text-xs font-mono text-[#1A1A1A] uppercase focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingCode}
                      className="bg-[#1A1A1A] hover:bg-stone-800 text-[#F3F2EE] font-bold px-4 py-2 rounded-xl text-xs border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isSubmittingCode ? 'Submitting...' : 'Submit Code'}</span>
                    </button>
                  </form>

                  {codeSuccessMessage && (
                    <p className="text-xs text-emerald-800 font-bold">{codeSuccessMessage}</p>
                  )}
                </div>
              )}

              {/* Contact Kitchen Button */}
              <div className="text-center pt-2">
                <a
                  href={`https://wa.me/254741775878?text=Hello%20New%20Miami%20Restaurant,%20inquiring%20about%20Order%20${currentOrder.order_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-emerald-800 hover:text-emerald-900 font-bold bg-white px-4 py-2 rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call or WhatsApp Kitchen Dispatch at 0741775878</span>
                </a>
              </div>
            </div>
          )}

          {/* Customer Past Orders Quick Selector */}
          {user && myOrders.length > 0 && !currentOrder && (
            <div className="space-y-3 pt-4 border-t-2 border-[#1A1A1A]/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                <span>Your Recent Orders</span>
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {myOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => {
                      setCurrentOrder(ord);
                      setSearchQuery(ord.order_number);
                    }}
                    className="p-3 bg-white hover:bg-[#F3F2EE] rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#1A1A1A]">{ord.order_number}</span>
                      <span className="text-stone-600 block text-[11px] font-medium">
                        {new Date(ord.created_at).toLocaleDateString()} • KES {ord.total_amount.toLocaleString()}
                      </span>
                    </div>
                    <span className="capitalize text-[11px] font-bold px-2 py-0.5 rounded bg-[#F3F2EE] border border-[#1A1A1A] text-[#1A1A1A]">
                      {ord.order_status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
