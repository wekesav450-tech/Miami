import crypto from 'crypto';

interface MenuItemRow { id: string; name: string; price_kes: number; is_available: boolean; }

function config() {
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl) throw new Error('Missing SUPABASE_URL environment variable');
  if (!key) throw new Error('Missing Supabase server key environment variable');
  const normalizedKey = key.trim();
  return { url: rawUrl.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, ''), key: normalizedKey, isNewSecretKey: normalizedKey.startsWith('sb_secret_') };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key, isNewSecretKey } = config();
  const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers as Record<string, string> || {}) };
  if (!isNewSecretKey) headers.Authorization = `Bearer ${key}`;
  const response = await fetch(`${url}/rest/v1/${path}`, { ...init, headers });
  const text = await response.text();
  if (!response.ok) {
    let detail = text;
    try { const parsed = JSON.parse(text); detail = parsed.message || parsed.error_description || parsed.error || parsed.hint || text; } catch {}
    throw new Error(`Supabase request failed (${response.status}): ${detail}`);
  }
  return text ? JSON.parse(text) : (null as T);
}

export async function createSupabaseOrder(payload: { customer_id: string | null; customer_name: string; customer_phone: string; customer_email: string | null; order_type: 'pickup' | 'delivery' | 'dine_in'; delivery_address: string | null; notes: string | null; payment_method: 'mpesa_pochi' | 'paywave_express'; transaction_reference?: string; items: { menu_item_id: string; quantity: number }[]; }) {
  const ids = [...new Set(payload.items.map((item) => item.menu_item_id))];
  const menuItems = await request<MenuItemRow[]>(`menu_items?id=in.(${ids.map(encodeURIComponent).join(',')})&select=id,name,price_kes,is_available`);
  const menuMap = new Map(menuItems.map((item) => [item.id, item]));
  const now = new Date().toISOString();
  const orderId = `ord_${crypto.randomUUID()}`;
  const orderNumber = `NMR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  let subtotal = 0;
  const orderItems: Array<Record<string, unknown>> = [];
  for (const requested of payload.items) {
    const menuItem = menuMap.get(requested.menu_item_id);
    if (!menuItem) throw new Error(`Menu item not found: ${requested.menu_item_id}`);
    if (!menuItem.is_available) throw new Error(`Item "${menuItem.name}" is currently unavailable`);
    if (!Number.isInteger(requested.quantity) || requested.quantity < 1) throw new Error(`Invalid quantity for ${menuItem.name}`);
    const lineTotal = Number(menuItem.price_kes) * requested.quantity;
    subtotal += lineTotal;
    orderItems.push({ id: `oit_${crypto.randomUUID()}`, order_id: orderId, menu_item_id: menuItem.id, item_name_snapshot: menuItem.name, quantity: requested.quantity, unit_price: Number(menuItem.price_kes), subtotal: lineTotal, created_at: now });
  }
  let deliveryFee = 0;
  try {
    const settings = await request<Array<{ delivery_fee_kes: number }>>('settings?select=delivery_fee_kes&limit=1');
    deliveryFee = payload.order_type === 'delivery' ? Number(settings[0]?.delivery_fee_kes ?? 150) : 0;
  } catch { deliveryFee = payload.order_type === 'delivery' ? 150 : 0; }
  const totalAmount = subtotal + deliveryFee;
  const order = { id: orderId, order_number: orderNumber, customer_id: payload.customer_id, customer_name: payload.customer_name.trim(), customer_phone: payload.customer_phone.trim(), customer_email: payload.customer_email?.trim().toLowerCase() || null, order_type: payload.order_type, delivery_address: payload.order_type === 'delivery' ? payload.delivery_address?.trim() || null : null, subtotal, delivery_fee: deliveryFee, total_amount: totalAmount, payment_method: payload.payment_method, payment_status: 'pending', order_status: 'pending', notes: payload.notes?.trim() || null, created_at: now, updated_at: now };
  const payment = { id: `pay_${crypto.randomUUID()}`, order_id: orderId, payment_method: payload.payment_method, amount: totalAmount, currency: 'KES', transaction_reference: payload.transaction_reference?.trim() || null, provider_response: null, status: 'pending', initiated_at: now, completed_at: null, created_at: now };
  await request('orders', { method: 'POST', body: JSON.stringify(order) });
  try {
    await request('order_items', { method: 'POST', body: JSON.stringify(orderItems) });
    await request('payments', { method: 'POST', body: JSON.stringify(payment) });
  } catch (error) {
    try { await request(`orders?id=eq.${encodeURIComponent(orderId)}`, { method: 'DELETE' }); } catch {}
    throw error;
  }
  return { order, items: orderItems, payment };
}
