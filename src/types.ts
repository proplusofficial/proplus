export type PaymentMethod = 'JazzCash' | 'EasyPaisa';
export type OrderStatus = 'Pending' | 'Delivery' | 'Completed';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  passwordHash?: string; // Kept hidden unless necessary on backend
  paymentMethod: PaymentMethod;
  paymentAccount: string;
  role: 'user' | 'admin';
  totalEarnings: number;
  availableBalance: number;
  createdAt: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  earningAdded: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentAccount: string;
  status: 'Pending' | 'Paid';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  todayOrders: number;
  pendingOrders: number;
  deliveryOrders: number;
  completedOrders: number;
  totalEarnings: number;
  availableBalance: number;
}

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  pendingOrders: number;
  deliveryOrders: number;
  completedOrders: number;
  totalPaid: number;
  totalEarnings: number;
}
