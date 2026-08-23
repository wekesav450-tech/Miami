import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Truck,
  Store,
  Utensils,
  ArrowRight,
  ShieldCheck,
  Phone,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, OrderType, PaymentMethod, Order, UserProfile } from '../types';
import { api } from '../services/api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  user: UserProfile | null;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  user,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
}) => {
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [customerName, setCustomerName] = useState(user?.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa_pochi');
  const [mpesaCode, setMpesaCode] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [copiedPochi, setCopiedPochi] = useState(false);

  // Sync user info if user logs in
  React.useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.full_name);
      if (!customerPhone) setCustomerPhone(user.phone);
      if (!customerEmail) setCustomerEmail(user.email);
    }
  }, [user]);

  if (!isOpen) return null;

  // Pricing calculations
  const subtotal = cart.reduce((acc, item) => acc + item.menuItem.price_kes * item.quantity, 0);
  const deliveryFee = orderType === 'delivery' ? 150 : 0;
  const totalAmount = subtotal + deliveryFee;

  const handleCopyPochi = () => {
    navigator.clipboard.writeText('0741775878');
    setCopiedPochi(true);
    setTimeout(() => setCopiedPochi(false), 2500);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage('Your cart is empty');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMessage('Please enter a valid Kenyan phone number (e.g. 0741775878)');
      return;
    }

    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMessage('Please enter your delivery address/landmark in Naivasha');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        order_type: orderType,
        delivery_address: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
        notes: notes.trim() || undefined,
        payment_method: paymentMethod,
        transaction_reference: mpesaCode.trim() || undefined,
        items: cart.map((c) => ({
          menu_item_id: c.menuItem.id,
          quantity: c.quantity,
        })),
      };

      const res = await api.orders.create(payload);

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      setPlacedOrder(res.order);
      onClearCart();
      onOrderSuccess(res.order);
    } catch (err: any) {
      console.error('Order placement error:', err);
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setPlacedOrder(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-lg bg-[#F3F2EE] text-[#1A1A1A] h-full flex flex-col shadow-2xl border-l-2 border-[#1A1A1A] animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 border-b-2 border-[#1A1A1A] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] text-[#F3F2EE] flex items-center justify-center font-bold border-2 border-[#1A1A1A]">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1A1A1A]">
                {placedOrder ? 'Order Confirmation' : 'Your Order'}
              </h3>
              <p className="text-xs text-stone-600 font-medium">
                {placedOrder ? 'Order received by kitchen' : `${cart.length} unique items selected`}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-2 text-stone-600 hover:text-[#1A1A1A] hover:bg-stone-100 rounded-lg transition border border-transparent hover:border-[#1A1A1A]"
            aria-label="Close cart drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ORDER SUCCESS SCREEN */}
        {placedOrder ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="text-center py-5 bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-2xl p-5">
              <div className="w-14 h-14 bg-emerald-100 border-2 border-[#1A1A1A] text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0px_0px_#1A1A1A]">
                <Check className="w-7 h-7" />
              </div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800">Order Placed Successfully</span>
              <h2 className="text-2xl font-serif font-bold text-[#1A1A1A] mt-1">
                Order #{placedOrder.order_number}
              </h2>
              <p className="text-xs text-stone-700 mt-2">
                Thank you, <strong className="text-[#1A1A1A]">{placedOrder.customer_name}</strong>! Your order is now in the kitchen queue.
              </p>
            </div>

            {/* M-Pesa Pochi Payment Box */}
            <div className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b-2 border-[#1A1A1A]/10 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    M-Pesa Pochi Payment
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-[#1A1A1A] bg-amber-200 px-2 py-0.5 rounded border border-[#1A1A1A]">
                  KES {placedOrder.total_amount.toLocaleString()}
                </span>
              </div>

              <div className="bg-[#F3F2EE] p-3 rounded-lg flex items-center justify-between border-2 border-[#1A1A1A]">
                <div>
                  <p className="text-[11px] text-stone-600 font-semibold">Pochi la Biashara Number:</p>
                  <p className="text-base font-mono font-bold text-[#1A1A1A]">0741775878</p>
                  <p className="text-[10px] text-stone-600">Name: New Miami Restaurant</p>
                </div>
                <button
                  onClick={handleCopyPochi}
                  className="flex items-center gap-1 text-xs bg-[#1A1A1A] hover:bg-stone-800 text-[#F3F2EE] px-3 py-2 rounded-lg font-bold border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] transition cursor-pointer"
                >
                  {copiedPochi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPochi ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-[11px] text-stone-700 leading-relaxed">
                Send <strong>KES {placedOrder.total_amount.toLocaleString()}</strong> to Pochi <strong>0741775878</strong> (New Miami Restaurant). Your payment status remains <em>pending</em> until restaurant staff manually verify the transaction.
              </p>
            </div>

            {/* WhatsApp Direct Notification */}
            <div className="space-y-3">
              <a
                href={`https://wa.me/254741775878?text=Hello%20New%20Miami%20Restaurant,%20I%20have%20placed%20Order%20${placedOrder.order_number}%20for%20KES%20${placedOrder.total_amount}.%20Customer:%20${encodeURIComponent(placedOrder.customer_name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] transition"
              >
                <Phone className="w-4 h-4" />
                <span>Notify Kitchen on WhatsApp (0741775878)</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>

              <button
                onClick={handleResetAndClose}
                className="w-full bg-white hover:bg-stone-100 text-[#1A1A1A] font-bold py-3 px-4 rounded-xl text-sm border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] transition cursor-pointer"
              >
                Done & Close
              </button>
            </div>
          </div>
        ) : (
          /* CART & CHECKOUT FORM */
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Order Type Toggle */}
              <div>
                <label className="text-xs font-bold text-[#1A1A1A] block mb-2">
                  Select Order Type:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`p-2.5 rounded-xl border-2 border-[#1A1A1A] text-xs font-bold flex flex-col items-center gap-1.5 transition shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer ${
                      orderType === 'delivery'
                        ? 'bg-[#1A1A1A] text-[#F3F2EE]'
                        : 'bg-white text-[#1A1A1A] hover:bg-stone-50'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Naivasha Delivery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderType('pickup')}
                    className={`p-2.5 rounded-xl border-2 border-[#1A1A1A] text-xs font-bold flex flex-col items-center gap-1.5 transition shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer ${
                      orderType === 'pickup'
                        ? 'bg-[#1A1A1A] text-[#F3F2EE]'
                        : 'bg-white text-[#1A1A1A] hover:bg-stone-50'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>Takeaway Pickup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderType('dine_in')}
                    className={`p-2.5 rounded-xl border-2 border-[#1A1A1A] text-xs font-bold flex flex-col items-center gap-1.5 transition shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer ${
                      orderType === 'dine_in'
                        ? 'bg-[#1A1A1A] text-[#F3F2EE]'
                        : 'bg-white text-[#1A1A1A] hover:bg-stone-50'
                    }`}
                  >
                    <Utensils className="w-4 h-4" />
                    <span>Dine-In Table</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1A1A1A]">Selected Dishes</span>
                  {cart.length > 0 && (
                    <button
                      onClick={onClearCart}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="bg-white border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] rounded-xl p-8 text-center">
                    <ShoppingBag className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                    <p className="text-xs text-stone-600 font-medium">Your cart is currently empty.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.menuItem.id}
                        className="bg-white border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] rounded-xl p-3 flex items-center justify-between gap-3"
                      >
                        <img
                          src={item.menuItem.image_url}
                          alt={item.menuItem.name}
                          className="w-12 h-12 rounded-lg object-cover bg-stone-100 border border-[#1A1A1A] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#1A1A1A] truncate">
                            {item.menuItem.name}
                          </h4>
                          <p className="text-[11px] text-stone-700 font-mono font-semibold">
                            KES {item.menuItem.price_kes.toLocaleString()} x {item.quantity} = KES {(item.menuItem.price_kes * item.quantity).toLocaleString()}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 bg-[#F3F2EE] border border-[#1A1A1A] rounded-lg p-1">
                          <button
                            onClick={() => onUpdateQuantity(item.menuItem.id, -1)}
                            className="w-6 h-6 rounded bg-white hover:bg-stone-200 text-[#1A1A1A] border border-[#1A1A1A] flex items-center justify-center transition font-bold"
                            aria-label="Reduce quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold px-1 text-[#1A1A1A]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.menuItem.id, 1)}
                            className="w-6 h-6 rounded bg-[#1A1A1A] hover:bg-stone-800 text-[#F3F2EE] flex items-center justify-center font-bold transition"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3 text-amber-400" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.menuItem.id)}
                          className="p-1.5 text-stone-500 hover:text-rose-600 transition"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Details Form */}
              {cart.length > 0 && (
                <form id="order-checkout-form" onSubmit={handleSubmitOrder} className="space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1A1A1A] pt-2 border-t-2 border-[#1A1A1A]/20">
                    Customer Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#1A1A1A] block mb-1">Full Name *</label>
                      <input
                        id="order-customer-name"
                        type="text"
                        required
                        placeholder="e.g. John Kamau"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-white border-2 border-[#1A1A1A] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#1A1A1A] block mb-1">Phone Number (M-Pesa) *</label>
                      <input
                        id="order-customer-phone"
                        type="tel"
                        required
                        placeholder="0741775878"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-white border-2 border-[#1A1A1A] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#1A1A1A] block mb-1">Email Address (Optional)</label>
                    <input
                      id="order-customer-email"
                      type="email"
                      placeholder="john@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-white border-2 border-[#1A1A1A] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A] focus:outline-none"
                    />
                  </div>

                  {orderType === 'delivery' && (
                    <div>
                      <label className="text-[11px] font-bold text-[#1A1A1A] block mb-1">
                        Delivery Address / Landmark in Naivasha *
                      </label>
                      <textarea
                        id="order-delivery-address"
                        rows={2}
                        required
                        placeholder="e.g. Moi South Lake Road near Enashipai, Naivasha Town CBD, Buffalo Mall area, or Lake View Estate..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full bg-white border-2 border-[#1A1A1A] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A] focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-[#1A1A1A] block mb-1">Kitchen Notes / Preferences</label>
                    <input
                      id="order-special-notes"
                      type="text"
                      placeholder="e.g. Extra spicy kachumbari, less oil on wet fry..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-white border-2 border-[#1A1A1A] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A] focus:outline-none"
                    />
                  </div>

                  {/* Payment Method Selector */}
                  <div className="pt-2">
                    <label className="text-xs font-bold text-[#1A1A1A] block mb-2">
                      Select Payment Method:
                    </label>
                    <div className="space-y-2">
                      {/* M-Pesa Pochi Option */}
                      <label
                        className={`block p-3 rounded-xl border-2 border-[#1A1A1A] cursor-pointer transition shadow-[2px_2px_0px_0px_#1A1A1A] ${
                          paymentMethod === 'mpesa_pochi'
                            ? 'bg-amber-100/70'
                            : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="payment_method"
                              checked={paymentMethod === 'mpesa_pochi'}
                              onChange={() => setPaymentMethod('mpesa_pochi')}
                              className="text-[#1A1A1A] focus:ring-[#1A1A1A]"
                            />
                            <div>
                              <span className="text-xs font-bold text-[#1A1A1A]">
                                M-Pesa Pochi la Biashara
                              </span>
                              <p className="text-[11px] text-amber-800 font-mono font-bold">
                                Pochi: 0741775878
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-[#1A1A1A] text-[#F3F2EE] font-bold px-2 py-0.5 rounded">
                            Recommended
                          </span>
                        </div>

                        {paymentMethod === 'mpesa_pochi' && (
                          <div className="mt-3 pt-3 border-t-2 border-[#1A1A1A]/20 text-[11px] text-stone-800 space-y-2">
                            <p>
                              Send payment to Pochi <strong>0741775878</strong> (New Miami Restaurant). You can optionally paste your M-Pesa transaction code below for staff to verify:
                            </p>
                            <input
                              id="order-mpesa-code-input"
                              type="text"
                              placeholder="M-Pesa Transaction Code (e.g. QKH789XYZ)"
                              value={mpesaCode}
                              onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                              className="w-full bg-white border-2 border-[#1A1A1A] rounded px-2.5 py-1.5 text-xs text-[#1A1A1A] font-mono uppercase"
                            />
                          </div>
                        )}
                      </label>

                      {/* PayWave Express Option */}
                      <label
                        className={`block p-3 rounded-xl border-2 border-[#1A1A1A] cursor-pointer transition shadow-[2px_2px_0px_0px_#1A1A1A] ${
                          paymentMethod === 'paywave_express'
                            ? 'bg-amber-100/70'
                            : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="payment_method"
                              checked={paymentMethod === 'paywave_express'}
                              onChange={() => setPaymentMethod('paywave_express')}
                              className="text-[#1A1A1A] focus:ring-[#1A1A1A]"
                            />
                            <div>
                              <span className="text-xs font-bold text-[#1A1A1A]">
                                PayWave Express Prompt
                              </span>
                              <p className="text-[11px] text-stone-600 font-medium">Card & Instant Mobile Prompt</p>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Error Notification */}
                  {errorMessage && (
                    <div className="p-3 rounded-lg bg-rose-50 border-2 border-rose-600 text-rose-800 text-xs flex items-center gap-2 font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Price Summary Breakdown */}
                  <div className="bg-white p-4 rounded-xl border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] space-y-2">
                    <div className="flex justify-between text-xs text-stone-600 font-medium">
                      <span>Items Subtotal</span>
                      <span className="font-mono font-bold text-[#1A1A1A]">KES {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-stone-600 font-medium">
                      <span>
                        {orderType === 'delivery' ? 'Naivasha Delivery Fee' : 'Service & Packaging'}
                      </span>
                      <span className="font-mono font-bold text-[#1A1A1A]">
                        {deliveryFee > 0 ? `KES ${deliveryFee.toLocaleString()}` : 'FREE'}
                      </span>
                    </div>
                    <div className="pt-2 border-t-2 border-[#1A1A1A]/10 flex justify-between text-sm font-bold text-[#1A1A1A]">
                      <span>Total Amount</span>
                      <span className="text-[#1A1A1A] font-mono text-base font-extrabold bg-[#F3F2EE] px-2 py-0.5 rounded border border-[#1A1A1A]">
                        KES {totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button with Anti-Double-Click */}
                  <button
                    id="submit-order-checkout-btn"
                    type="submit"
                    disabled={isSubmitting || cart.length === 0}
                    className="w-full bg-[#1A1A1A] hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed text-[#F3F2EE] font-bold py-3.5 px-4 rounded-xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#D97706] hover:shadow-[2px_2px_0px_0px_#D97706] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Validating & Submitting Order...
                      </span>
                    ) : (
                      <>
                        <span>Confirm & Place Order (KES {totalAmount.toLocaleString()})</span>
                        <ArrowRight className="w-4 h-4 text-amber-400" />
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>
          </>
        )}

      </div>
    </div>
  );
};
