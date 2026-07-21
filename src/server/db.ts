import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Order, Payment, AuditLog, AppNotification, OrderStatus, PaymentMethod } from '../types.js';

const DB_FILE = path.join(process.cwd(), 'db.json');

interface DatabaseSchema {
  users: User[];
  orders: Order[];
  payments: Payment[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
}

function getInitialData(): DatabaseSchema {
  // Hash the default passwords synchronously for seeding
  const adminSalt = bcrypt.genSaltSync(10);
  const adminEmail = process.env.ADMIN_EMAIL || 'dinwearofficial@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'subhanandhassan786#';
  const adminPasswordHash = bcrypt.hashSync(adminPassword, adminSalt);

  const userSalt = bcrypt.genSaltSync(10);
  const userPasswordHash = bcrypt.hashSync('user123', userSalt);

  const defaultAdmin: User = {
    id: 'usr_admin',
    fullName: 'System Administrator',
    phone: '03001234567',
    email: adminEmail,
    passwordHash: adminPasswordHash,
    paymentMethod: 'JazzCash',
    paymentAccount: '03001234567',
    role: 'admin',
    totalEarnings: 0,
    availableBalance: 0,
    createdAt: new Date('2026-07-01T12:00:00Z').toISOString(),
  };

  const defaultUser: User = {
    id: 'usr_demo',
    fullName: 'Muhammad Ali',
    phone: '03123456789',
    email: 'ali@pluspro.com',
    passwordHash: userPasswordHash,
    paymentMethod: 'EasyPaisa',
    paymentAccount: '03123456789',
    role: 'user',
    totalEarnings: 200,
    availableBalance: 200,
    createdAt: new Date('2026-07-10T14:30:00Z').toISOString(),
  };

  const initialOrders: Order[] = [
    {
      id: 'ord_1',
      customerName: 'Kashif Khan',
      userId: 'usr_demo',
      items: [
        { name: 'Casual Shirt', quantity: 2 },
        { name: 'Slim Fit Pant', quantity: 1 }
      ],
      status: 'Completed',
      earningAdded: true,
      createdAt: new Date('2026-07-18T10:15:00Z').toISOString()
    },
    {
      id: 'ord_2',
      customerName: 'Zainab Bibi',
      userId: 'usr_demo',
      items: [
        { name: 'Leather Shoes', quantity: 1 },
        { name: 'Cotton Socks', quantity: 3 }
      ],
      status: 'Completed',
      earningAdded: true,
      createdAt: new Date('2026-07-19T11:20:00Z').toISOString()
    },
    {
      id: 'ord_3',
      customerName: 'Ahmad Saeed',
      userId: 'usr_demo',
      items: [
        { name: 'Denim Jacket', quantity: 1 }
      ],
      status: 'Delivery',
      earningAdded: false,
      createdAt: new Date('2026-07-20T09:45:00Z').toISOString()
    },
    {
      id: 'ord_4',
      customerName: 'Sara Ahmed',
      userId: 'usr_demo',
      items: [
        { name: 'Polo Shirt', quantity: 3 }
      ],
      status: 'Pending',
      earningAdded: false,
      createdAt: new Date('2026-07-20T16:00:00Z').toISOString()
    }
  ];

  const initialNotifications: AppNotification[] = [
    {
      id: 'not_1',
      userId: 'usr_demo',
      title: 'Welcome to Plus Pro!',
      message: 'Your account is ready. Start tracking your orders and earn Rs.100 per completed order.',
      read: false,
      createdAt: new Date('2026-07-10T14:31:00Z').toISOString()
    },
    {
      id: 'not_2',
      userId: 'usr_demo',
      title: 'Order Completed! 🎉',
      message: 'Order for Kashif Khan is marked Completed. Rs.100 added to your earnings.',
      read: true,
      createdAt: new Date('2026-07-18T15:00:00Z').toISOString()
    }
  ];

  return {
    users: [defaultAdmin, defaultUser],
    orders: initialOrders,
    payments: [],
    auditLogs: [],
    notifications: initialNotifications,
  };
}

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        // Ensure structure is correct
        if (parsed.users && parsed.orders && parsed.payments) {
          // Sync admin email and password from environment variables at startup
          const adminEmail = process.env.ADMIN_EMAIL || 'dinwearofficial@gmail.com';
          const adminPassword = process.env.ADMIN_PASSWORD || 'subhanandhassan786#';
          
          let adminIdx = (parsed.users as User[]).findIndex(u => u.role === 'admin');
          const salt = bcrypt.genSaltSync(10);
          const passwordHash = bcrypt.hashSync(adminPassword, salt);

          if (adminIdx !== -1) {
            // Check if credentials changed, if so update them
            const currentAdmin = parsed.users[adminIdx];
            if (currentAdmin.email !== adminEmail || !bcrypt.compareSync(adminPassword, currentAdmin.passwordHash || '')) {
              parsed.users[adminIdx] = {
                ...currentAdmin,
                email: adminEmail,
                passwordHash: passwordHash
              };
            }
          } else {
            // Re-create default admin if deleted
            const defaultAdmin: User = {
              id: 'usr_admin',
              fullName: 'System Administrator',
              phone: '03001234567',
              email: adminEmail,
              passwordHash: passwordHash,
              paymentMethod: 'JazzCash',
              paymentAccount: '03001234567',
              role: 'admin',
              totalEarnings: 0,
              availableBalance: 0,
              createdAt: new Date('2026-07-01T12:00:00Z').toISOString(),
            };
            parsed.users.push(defaultAdmin);
          }
          
          this.saveData(parsed as DatabaseSchema);
          return parsed as DatabaseSchema;
        }
      }
    } catch (e) {
      console.error('Error loading database file, re-initializing...', e);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(schema: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(schema, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing to database file:', e);
    }
  }

  private persist() {
    this.saveData(this.data);
  }

  // --- Users Operations ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: User): void {
    this.data.users.push(user);
    this.persist();
  }

  public updateUser(id: string, updates: Partial<User>): User {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      id // Prevent overwriting ID
    };
    this.persist();
    return this.data.users[idx];
  }

  // --- Orders Operations ---
  public getOrders(): Order[] {
    return this.data.orders;
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id);
  }

  public getOrdersByUserId(userId: string): Order[] {
    return this.data.orders.filter(o => o.userId === userId);
  }

  public addOrder(order: Order): void {
    this.data.orders.push(order);
    this.persist();
  }

  public updateOrder(id: string, updates: Partial<Order>): Order {
    const idx = this.data.orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Order not found');

    const oldOrder = this.data.orders[idx];
    const updatedOrder = {
      ...oldOrder,
      ...updates,
      id // Prevent overwriting ID
    };

    // Business Logic: Order status changed to Completed
    if (updatedOrder.status === 'Completed' && !oldOrder.earningAdded && !updatedOrder.earningAdded) {
      updatedOrder.earningAdded = true;
      const user = this.getUserById(updatedOrder.userId);
      if (user) {
        this.updateUser(user.id, {
          totalEarnings: user.totalEarnings + 100,
          availableBalance: user.availableBalance + 100
        });
        
        // Add earning notification
        this.addNotification({
          id: `not_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          userId: user.id,
          title: 'Earnings Added! 💰',
          message: `Order for ${updatedOrder.customerName} completed! Rs.100 added to your account.`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    this.data.orders[idx] = updatedOrder;
    this.persist();
    return updatedOrder;
  }

  // --- Payments Operations ---
  public getPayments(): Payment[] {
    return this.data.payments;
  }

  public getPaymentsByUserId(userId: string): Payment[] {
    return this.data.payments.filter(p => p.userId === userId);
  }

  public addPayment(payment: Payment): void {
    this.data.payments.push(payment);
    // Deduct available balance when paid or logged
    const user = this.getUserById(payment.userId);
    if (user && payment.status === 'Paid') {
      const newBalance = Math.max(0, user.availableBalance - payment.amount);
      this.updateUser(user.id, { availableBalance: newBalance });
    }
    this.persist();
  }

  // --- Notifications Operations ---
  public getNotifications(userId: string): AppNotification[] {
    return this.data.notifications.filter(n => n.userId === userId);
  }

  public addNotification(notification: AppNotification): void {
    this.data.notifications.unshift(notification);
    this.persist();
  }

  public markNotificationsAsRead(userId: string): void {
    this.data.notifications = this.data.notifications.map(n => 
      n.userId === userId ? { ...n, read: true } : n
    );
    this.persist();
  }

  // --- Audit Logs Operations ---
  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  public addAuditLog(log: AuditLog): void {
    this.data.auditLogs.unshift(log);
    this.persist();
  }
}

export const db = new DatabaseService();
