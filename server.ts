import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db.js';
import { User, Order, Payment, OrderItem, OrderStatus, PaymentMethod } from './src/types.js';

export const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'plus-pro-secret-key-13579';

app.use(express.json());

// Helper for generating tokens
function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Custom request interface to carry user session
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin';
  };
}

// Middleware: Authenticate User
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = decoded;
    next();
  });
}

// Middleware: Authenticate Admin ONLY
function authenticateAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  authenticateToken(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access only' });
      return;
    }
    next();
  });
}

// ==========================================
// PUBLIC AUTHENTICATION ENDPOINTS
// ==========================================

// Register User
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { fullName, phone, email, password, paymentMethod, paymentAccount } = req.body;

    // Field Valdiations
    if (!fullName || !phone || !email || !password || !paymentMethod || !paymentAccount) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    if (paymentMethod !== 'JazzCash' && paymentMethod !== 'EasyPaisa') {
      res.status(400).json({ error: 'Invalid payment method. Must be JazzCash or EasyPaisa' });
      return;
    }

    // Check duplicate
    const existing = db.getUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'Email address already registered' });
      return;
    }

    // Password hashing
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser: User = {
      id: `usr_${Date.now()}`,
      fullName,
      phone,
      email,
      passwordHash,
      paymentMethod,
      paymentAccount,
      role: 'user',
      totalEarnings: 0,
      availableBalance: 0,
      createdAt: new Date().toISOString()
    };

    db.addUser(newUser);

    // Auto-create welcome notification
    db.addNotification({
      id: `not_${Date.now()}`,
      userId: newUser.id,
      title: 'Welcome to Plus Pro! 🚀',
      message: `Dear ${fullName}, welcome aboard! Add orders to start earning Rs.100 for each completed delivery.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    // Create system log
    db.addAuditLog({
      id: `log_${Date.now()}`,
      userId: newUser.id,
      action: 'Register',
      details: `User ${fullName} registered successfully`,
      createdAt: new Date().toISOString()
    });

    const token = generateToken(newUser);
    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({ token, user: safeUser });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login User
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const match = bcrypt.compareSync(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    // Log user login
    db.addAuditLog({
      id: `log_${Date.now()}`,
      userId: user.id,
      action: 'Login',
      details: `User logged in`,
      createdAt: new Date().toISOString()
    });

    res.json({ token, user: safeUser });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Admin Login (Separate secure path)
app.post('/api/admin/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user || user.role !== 'admin' || !user.passwordHash) {
      res.status(401).json({ error: 'Access denied: Invalid credentials or not an admin' });
      return;
    }

    const match = bcrypt.compareSync(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: 'Access denied: Invalid credentials' });
      return;
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    db.addAuditLog({
      id: `log_${Date.now()}`,
      userId: user.id,
      action: 'Admin Login',
      details: 'Admin logged in from secure route',
      createdAt: new Date().toISOString()
    });

    res.json({ token, user: safeUser });
  } catch (err: any) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Server error during admin login' });
  }
});

// ==========================================
// PASSWORD RECOVERY / FORGOT PASSWORD SYSTEM
// ==========================================

interface VerificationInfo {
  code: string;
  expiresAt: number;
  attempts: number;
}
const passwordResetCodes = new Map<string, VerificationInfo>();

function generateComplexCode(): string {
  let code = '';
  while (true) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    // Ensure code is not a simple sequential pattern or purely repeating digit
    const isSequential = '1234567890'.includes(code) || '9876543210'.includes(code);
    const isRepeating = /^(\d)\1{5}$/.test(code);
    if (!isSequential && !isRepeating) {
      break;
    }
  }
  return code;
}

// 1. Request Verification Code
app.post('/api/forgot-password/request', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email address is required' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'User with this email does not exist' });
      return;
    }

    const code = generateComplexCode();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    
    passwordResetCodes.set(email.toLowerCase(), {
      code,
      expiresAt,
      attempts: 0
    });

    const senderEmail = process.env.SENDER_EMAIL || 'proplus.verify@gmail.com';
    const senderPassword = process.env.SENDER_PASSWORD;

    if (!senderPassword) {
      console.log(`[DEMO MODE WITHOUT SMTP] Verification code for ${email} is: ${code}`);
      res.json({
        success: true,
        message: 'Verification code generated! (Demo Mode: Please enter the code below)',
        demoCode: code, // Auto-provide for easy previewing without environment variables
        expiresInSeconds: 300
      });
      return;
    }

    // Send actual email using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: senderPassword
      }
    });

    const mailOptions = {
      from: `"Plus Pro Security" <${senderEmail}>`,
      to: email,
      subject: 'Plus Pro Password Reset Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
          <h2 style="color: #4f46e5; text-align: center; margin-bottom: 12px; font-weight: 800; letter-spacing: -0.5px;">Plus Pro Verification</h2>
          <p style="font-size: 14px; text-align: center; color: #64748b; margin-bottom: 24px;">Password Reset Security Protocol</p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">A request was made to reset your password on your Plus Pro account. Please use the 6-digit verification code below to verify your identity:</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
            <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e1b4b;">${code}</span>
          </div>
          
          <div style="border-left: 4px solid #ef4444; background-color: #fef2f2; padding: 12px; border-radius: 6px; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #b91c1c; font-weight: bold; margin: 0; line-height: 1.5;">
              ⚠️ IMPORTANT SAFETY DETAILS:
            </p>
            <ul style="font-size: 12px; color: #b91c1c; margin: 4px 0 0 0; padding-left: 18px; line-height: 1.5;">
              <li>This code is valid for 5 minutes only.</li>
              <li>Entering the wrong code 10 times will auto-expire the code.</li>
            </ul>
          </div>
          
          <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
            If you did not make this request, please ignore this email. Your password is safe.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Verification code sent to your email address successfully.',
      expiresInSeconds: 300
    });
  } catch (err: any) {
    console.error('Forgot password request error:', err);
    res.status(500).json({ error: 'Failed to send verification email. Verify that SENDER_PASSWORD is valid.' });
  }
});

// 2. Verify Code Only
app.post('/api/forgot-password/verify', (req: Request, res: Response) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400).json({ error: 'Email and verification code are required' });
    return;
  }

  const record = passwordResetCodes.get(email.toLowerCase());
  if (!record) {
    res.status(400).json({ error: 'No verification request active for this email' });
    return;
  }

  // Check failed attempts limit
  if (record.attempts >= 10) {
    passwordResetCodes.delete(email.toLowerCase());
    res.status(400).json({ error: 'Code expired due to too many failed attempts (10). Please request a new code.' });
    return;
  }

  // Check expiration (5 mins)
  if (Date.now() > record.expiresAt) {
    passwordResetCodes.delete(email.toLowerCase());
    res.status(400).json({ error: 'Verification code expired (5 mins limit). Please request a new code.' });
    return;
  }

  // Check match
  if (record.code !== code.trim()) {
    record.attempts += 1;
    if (record.attempts >= 10) {
      passwordResetCodes.delete(email.toLowerCase());
      res.status(400).json({ error: 'Too many failed attempts (10). This code has expired. Please request a new code.' });
      return;
    }
    res.status(400).json({ error: `Incorrect verification code. Attempts: ${record.attempts}/10` });
    return;
  }

  res.json({ success: true, message: 'Code verified successfully.' });
});

// 3. Reset and Set New Password
app.post('/api/forgot-password/reset', (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    res.status(400).json({ error: 'All fields (email, code, new password) are required' });
    return;
  }

  const record = passwordResetCodes.get(email.toLowerCase());
  if (!record) {
    res.status(400).json({ error: 'No active verification session' });
    return;
  }

  // Check attempts
  if (record.attempts >= 10) {
    passwordResetCodes.delete(email.toLowerCase());
    res.status(400).json({ error: 'Session expired due to too many failed attempts.' });
    return;
  }

  // Check expiration
  if (Date.now() > record.expiresAt) {
    passwordResetCodes.delete(email.toLowerCase());
    res.status(400).json({ error: 'Verification code expired. Please request a new code.' });
    return;
  }

  // Verify code
  if (record.code !== code.trim()) {
    record.attempts += 1;
    if (record.attempts >= 10) {
      passwordResetCodes.delete(email.toLowerCase());
      res.status(400).json({ error: 'Too many failed attempts. Code has expired.' });
      return;
    }
    res.status(400).json({ error: `Incorrect code. Attempts: ${record.attempts}/10` });
    return;
  }

  // Update password in DB
  const user = db.getUserByEmail(email);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(newPassword, salt);

  db.updateUser(user.id, { passwordHash });

  // Add system notifications & audit log
  db.addNotification({
    id: `not_${Date.now()}_reset`,
    userId: user.id,
    title: 'Password Updated 🔒',
    message: 'Your account password was successfully reset via email verification.',
    read: false,
    createdAt: new Date().toISOString()
  });

  db.addAuditLog({
    id: `log_${Date.now()}_reset`,
    userId: user.id,
    action: 'Password Reset',
    details: 'User reset password via secure email verification code flow',
    createdAt: new Date().toISOString()
  });

  // Delete verification code
  passwordResetCodes.delete(email.toLowerCase());

  res.json({ success: true, message: 'Password updated successfully! You can now log in.' });
});

// ==========================================
// PROTECTED USER ENDPOINTS
// ==========================================

// Get current user profile and detailed stats
app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = db.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Profile
app.post('/api/user/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { fullName, phone, paymentMethod, paymentAccount } = req.body;

    if (!fullName || !phone || !paymentMethod || !paymentAccount) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const updated = db.updateUser(userId, { fullName, phone, paymentMethod, paymentAccount });
    const { passwordHash: _, ...safeUser } = updated;

    db.addAuditLog({
      id: `log_${Date.now()}`,
      userId,
      action: 'Update Profile',
      details: 'User updated profile information',
      createdAt: new Date().toISOString()
    });

    res.json({ user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change Password
app.post('/api/user/change-password', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password are required' });
      return;
    }

    const user = db.getUserById(userId);
    if (!user || !user.passwordHash) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const match = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!match) {
      res.status(400).json({ error: 'Incorrect current password' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const newPasswordHash = bcrypt.hashSync(newPassword, salt);

    db.updateUser(userId, { passwordHash: newPasswordHash });

    db.addAuditLog({
      id: `log_${Date.now()}`,
      userId,
      action: 'Change Password',
      details: 'User changed password successfully',
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get User Dashboard Statistics
app.get('/api/user/stats', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = db.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const orders = db.getOrdersByUserId(userId);
    const todayStr = new Date().toISOString().split('T')[0];

    const todayOrders = orders.filter(o => o.createdAt.startsWith(todayStr)).length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const deliveryOrders = orders.filter(o => o.status === 'Delivery').length;
    const completedOrders = orders.filter(o => o.status === 'Completed').length;

    res.json({
      todayOrders,
      pendingOrders,
      deliveryOrders,
      completedOrders,
      totalEarnings: user.totalEarnings,
      availableBalance: user.availableBalance
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

// Fetch user orders with optional search / filter
app.get('/api/orders', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    let orders = db.getOrdersByUserId(userId);

    // Search query (customerName or product names)
    const search = req.query.search as string;
    if (search) {
      const q = search.toLowerCase();
      orders = orders.filter(o => 
        o.customerName.toLowerCase().includes(q) || 
        o.items.some(item => item.name.toLowerCase().includes(q))
      );
    }

    // Status filter
    const status = req.query.status as OrderStatus;
    if (status && ['Pending', 'Delivery', 'Completed'].includes(status)) {
      orders = orders.filter(o => o.status === status);
    }

    // Newest first
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

// Create Order (instantly Pending)
app.post('/api/orders', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { customerName, items } = req.body;

    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Customer name and products are required' });
      return;
    }

    // Validate structure of items
    const validatedItems: OrderItem[] = [];
    for (const item of items) {
      if (!item.name || typeof item.quantity !== 'number' || item.quantity <= 0) {
        res.status(400).json({ error: 'Invalid product quantity details' });
        return;
      }
      validatedItems.push({
        name: item.name.trim(),
        quantity: Math.floor(item.quantity)
      });
    }

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      customerName: customerName.trim(),
      userId,
      items: validatedItems,
      status: 'Pending',
      earningAdded: false,
      createdAt: new Date().toISOString()
    };

    db.addOrder(newOrder);

    // User Notification
    db.addNotification({
      id: `not_${Date.now()}`,
      userId,
      title: 'Order Created 📦',
      message: `Order for customer ${newOrder.customerName} added successfully. Status is Pending.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    // Audit log
    db.addAuditLog({
      id: `log_${Date.now()}`,
      userId,
      action: 'Create Order',
      details: `Created order ${newOrder.id} for ${newOrder.customerName}`,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ order: newOrder });
  } catch (err: any) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Notifications Endpoints
app.get('/api/notifications', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const notifications = db.getNotifications(userId);
    res.json({ notifications });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

app.post('/api/notifications/read', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    db.markNotificationsAsRead(userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});


// ==========================================
// PROTECTED ADMIN ENDPOINTS
// ==========================================

// Admin Statistics Dashboard
app.get('/api/admin/stats', authenticateAdmin, (req: AuthRequest, res: Response) => {
  try {
    const users = db.getUsers().filter(u => u.role !== 'admin');
    const orders = db.getOrders();
    const payments = db.getPayments();

    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const deliveryOrders = orders.filter(o => o.status === 'Delivery').length;
    const completedOrders = orders.filter(o => o.status === 'Completed').length;

    const totalPaid = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const totalEarnings = users.reduce((sum, u) => sum + u.totalEarnings, 0);

    res.json({
      totalUsers: users.length,
      totalOrders: orders.length,
      pendingOrders,
      deliveryOrders,
      completedOrders,
      totalPaid,
      totalEarnings
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

// Admin list users with search and metrics
app.get('/api/admin/users', authenticateAdmin, (req: AuthRequest, res: Response) => {
  try {
    let users = db.getUsers().filter(u => u.role !== 'admin');
    const search = req.query.search as string;

    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u => 
        u.fullName.toLowerCase().includes(q) || 
        u.phone.includes(q) || 
        u.email.toLowerCase().includes(q)
      );
    }

    // Enhance users list with orders count information
    const orders = db.getOrders();
    const userMetrics = users.map(user => {
      const userOrders = orders.filter(o => o.userId === user.id);
      const { passwordHash: _, ...safeUser } = user;
      return {
        ...safeUser,
        totalOrders: userOrders.length,
        completedOrders: userOrders.filter(o => o.status === 'Completed').length,
        pendingOrders: userOrders.filter(o => o.status === 'Pending').length,
        deliveryOrders: userOrders.filter(o => o.status === 'Delivery').length,
      };
    });

    res.json({ users: userMetrics });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Admin Get single user details
app.get('/api/admin/users/:id', authenticateAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = db.getUserById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const orders = db.getOrdersByUserId(id);
    const payments = db.getPaymentsByUserId(id);

    const { passwordHash: _, ...safeUser } = user;

    res.json({
      user: safeUser,
      orders,
      payments,
      stats: {
        totalOrders: orders.length,
        completedOrders: orders.filter(o => o.status === 'Completed').length,
        pendingOrders: orders.filter(o => o.status === 'Pending').length,
        deliveryOrders: orders.filter(o => o.status === 'Delivery').length,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve user details' });
  }
});

// Admin list all orders
app.get('/api/admin/orders', authenticateAdmin, (req: AuthRequest, res: Response) => {
  try {
    let orders = db.getOrders();
    const search = req.query.search as string;
    const status = req.query.status as OrderStatus;

    if (search) {
      const q = search.toLowerCase();
      orders = orders.filter(o => 
        o.customerName.toLowerCase().includes(q) || 
        o.items.some(item => item.name.toLowerCase().includes(q))
      );
    }

    if (status && ['Pending', 'Delivery', 'Completed'].includes(status)) {
      orders = orders.filter(o => o.status === status);
    }

    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Enrich with user information
    const enrichedOrders = orders.map(order => {
      const user = db.getUserById(order.userId);
      return {
        ...order,
        user: user ? {
          fullName: user.fullName,
          phone: user.phone,
          paymentMethod: user.paymentMethod,
          paymentAccount: user.paymentAccount
        } : null
      };
    });

    res.json({ orders: enrichedOrders });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

// Admin change order status
app.patch('/api/admin/orders/:id', authenticateAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Pending', 'Delivery', 'Completed'].includes(status)) {
      res.status(400).json({ error: 'Invalid status update request' });
      return;
    }

    const currentOrder = db.getOrderById(id);
    if (!currentOrder) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const previousStatus = currentOrder.status;
    const updatedOrder = db.updateOrder(id, { status: status as OrderStatus });

    // Push notification if status changed
    if (previousStatus !== status) {
      let icon = '📦';
      if (status === 'Delivery') icon = '🚚';
      if (status === 'Completed') icon = '🎉';

      db.addNotification({
        id: `not_${Date.now()}`,
        userId: updatedOrder.userId,
        title: `Order Status Updated ${icon}`,
        message: `Order for ${updatedOrder.customerName} has been updated from ${previousStatus} to ${status}.`,
        read: false,
        createdAt: new Date().toISOString()
      });

      db.addAuditLog({
        id: `log_${Date.now()}`,
        userId: req.user!.id,
        action: 'Update Status',
        details: `Updated order ${id} from ${previousStatus} to ${status}`,
        createdAt: new Date().toISOString()
      });
    }

    res.json({ order: updatedOrder });
  } catch (err: any) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Admin register payout/payment
app.post('/api/admin/payout', authenticateAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Valid user ID and amount are required' });
      return;
    }

    const user = db.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.availableBalance < amount) {
      res.status(400).json({ error: `Insufficient balance. Available: Rs.${user.availableBalance}` });
      return;
    }

    const newPayment: Payment = {
      id: `pay_${Date.now()}`,
      userId,
      amount,
      paymentMethod: user.paymentMethod,
      paymentAccount: user.paymentAccount,
      status: 'Paid',
      createdAt: new Date().toISOString()
    };

    db.addPayment(newPayment);

    // Notify user
    db.addNotification({
      id: `not_${Date.now()}`,
      userId: user.id,
      title: 'Payment Disbursed! 💸',
      message: `Your payment of Rs.${amount} has been successfully sent to your ${user.paymentMethod} account (${user.paymentAccount}).`,
      read: false,
      createdAt: new Date().toISOString()
    });

    db.addAuditLog({
      id: `log_${Date.now()}`,
      userId: req.user!.id,
      action: 'Payout',
      details: `Paid Rs.${amount} to ${user.fullName} (${user.id})`,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ payment: newPayment });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to register payout' });
  }
});

// ==========================================
// VITE DEV MIDDLEWARE & ASSET SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
