export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  category_name?: string;
  name: string;
  description: string;
  price_kes: number;
  image_url: string;
  is_available: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderType = 'pickup' | 'delivery' | 'dine_in';
export type PaymentMethod = 'mpesa_pochi' | 'paywave_express';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name_snapshot: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  order_type: OrderType;
  delivery_address: string | null;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  payment?: PaymentRecord;
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled';

export interface Reservation {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  reservation_date: string;
  reservation_time: string;
  number_of_guests: number;
  special_requests: string | null;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  payment_method: PaymentMethod;
  amount: number;
  currency: string;
  transaction_reference: string | null;
  provider_response: string | null;
  status: PaymentStatus;
  initiated_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface CreateOrderPayload {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  order_type: OrderType;
  delivery_address?: string;
  notes?: string;
  payment_method: PaymentMethod;
  transaction_reference?: string;
  items: {
    menu_item_id: string;
    quantity: number;
  }[];
}

export interface CreateReservationPayload {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  reservation_date: string;
  reservation_time: string;
  number_of_guests: number;
  special_requests?: string;
}

export interface AdminStats {
  totalRevenueKes: number;
  totalOrdersCount: number;
  pendingOrdersCount: number;
  completedOrdersCount: number;
  activeReservationsCount: number;
  totalMenuItemsCount: number;
  todayRevenueKes: number;
}
