import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, ShoppingCart, Clock, Truck, CheckCircle2, 
  Search, ArrowLeft, CreditCard, Send, Plus, DollarSign,
  TrendingUp, Calendar, AlertCircle, RefreshCw, BarChart3, UserCheck, Inbox,
  Loader2, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { AdminStats, User, Order, Payment, OrderStatus } from '../types.js';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const { token, apiCall } = useAuth() as any;
  const { showToast } = useToast();
  const { darkMode, toggleDarkMode } = useTheme();

  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'users' | 'orders'>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users Directory State
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<{
    user: User;
    orders: Order[];
    payments: Payment[];
    stats: { totalOrders: number; completedOrders: number; pendingOrders: number; deliveryOrders: number };
  } | null>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Orders Management State
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);

  // Payout Drawer State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  // Load General Admin Dashboard Stats
  const loadAdminStats = async () => {
    setLoadingStats(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/admin/stats', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStats(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to retrieve admin analytics', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  // Load All Registered Users
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const url = `/api/admin/users${userSearch ? `?search=${encodeURIComponent(userSearch)}` : ''}`;
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users);
    } catch (err: any) {
      showToast(err.message || 'Failed to retrieve registered users', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load Single User Deep Details (Orders & Payout history)
  const loadUserDeepDetails = async (userId: string) => {
    setLoadingUserDetails(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`/api/admin/users/${userId}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectedUserDetails(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load user historical logs', 'error');
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Load All Systems Orders
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams();
      if (orderSearch) params.append('search', orderSearch);
      if (orderStatusFilter !== 'all') params.append('status', orderStatusFilter);
      
      const query = params.toString();
      const url = `/api/admin/orders${query ? `?${query}` : ''}`;
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(data.orders);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch global order metrics', 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadAdminStats();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'users') {
      loadUsers();
    } else if (activeSubTab === 'orders') {
      loadOrders();
    }
  }, [activeSubTab, userSearch, orderSearch, orderStatusFilter]);

  // Handle Order Status Transitions
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderStatus(true);
    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast(`Order status updated to ${nextStatus}`, 'success');
      
      // Update local orders list state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: nextStatus }));
      }
      
      // Refresh statistics counts
      loadAdminStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  // Submit User Payout Disbursment
  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid payout amount', 'error');
      return;
    }

    if (!selectedUserDetails) return;
    const { user } = selectedUserDetails;

    if (user.availableBalance < amount) {
      showToast(`Payout exceeds available user balance (Rs.${user.availableBalance})`, 'error');
      return;
    }

    setPayoutSubmitting(true);
    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const res = await fetch('/api/admin/payout', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: user.id, amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Paid Rs.${amount} to ${user.fullName}!`, 'success');
      setPayoutAmount('');
      setShowPayoutModal(false);
      
      // Reload details to refresh balances & payout tables
      loadUserDeepDetails(user.id);
      loadAdminStats();
    } catch (err: any) {
      showToast(err.message || 'Payout registration failed', 'error');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24 text-slate-900 dark:text-zinc-100">
      {/* Top Admin Branding Bar */}
      <div className="sticky top-0 z-30 bg-indigo-900 text-white shadow-md">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-zinc-950 border border-white/10">
              <img 
                src="/src/assets/images/app_logo_1784623222151.jpg" 
                alt="Plus Pro Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight">Plus Pro Admin</h1>
              <p className="text-[9px] text-indigo-200/80 font-bold uppercase tracking-wider">Secure Operations Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-all duration-200"
              title="Toggle Dark/Light Theme"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-300" /> : <Moon className="w-4.5 h-4.5 text-indigo-200" />}
            </button>
            <button
              onClick={onLogout}
              className="text-xs bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
            >
              Logout Portal
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Navigation sub-tabs */}
        <div className="flex gap-1.5 bg-gray-200/50 dark:bg-zinc-900/50 p-1 rounded-2xl border border-gray-100 dark:border-zinc-800">
          {[
            { id: 'dashboard', label: 'Analytics' },
            { id: 'users', label: 'Users' },
            { id: 'orders', label: 'Orders' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                setSelectedUser(null);
                setSelectedUserDetails(null);
                setSelectedOrder(null);
              }}
              className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SUBTAB 1: ANALYTICS DASHBOARD */}
        {activeSubTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black tracking-tight">Overview metrics</h2>
                <p className="text-xs text-gray-400 dark:text-zinc-500">Systemwide counters and telemetry</p>
              </div>
              <button 
                onClick={loadAdminStats}
                className="p-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl hover:bg-gray-50 text-gray-500 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loadingStats ? (
              <div className="space-y-4">
                <div className="h-24 bg-gray-200 dark:bg-zinc-800 rounded-3xl animate-pulse-fast" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-20 bg-gray-200 dark:bg-zinc-800 rounded-2xl animate-pulse-fast" />
                  <div className="h-20 bg-gray-200 dark:bg-zinc-800 rounded-2xl animate-pulse-fast" />
                </div>
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* Financial Summary */}
                <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-6 rounded-[2rem] space-y-4 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Total User Earnings Accumulation</span>
                  <div className="space-y-0.5">
                    <h1 className="text-3xl font-black">Rs.{stats.totalEarnings.toLocaleString()}</h1>
                    <p className="text-[11px] text-indigo-200/80">Sum of Rs.100 earned per completed delivery</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-indigo-300">Total Paid Out</span>
                      <p className="text-base font-bold mt-0.5">Rs.{stats.totalPaid.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-indigo-300">Total Unpaid Balance</span>
                      <p className="text-base font-bold mt-0.5">Rs.{(stats.totalEarnings - stats.totalPaid).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Grid: Core telemetry */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Registered Users', val: stats.totalUsers, icon: Users, color: 'indigo' },
                    { label: 'Total Placed Orders', val: stats.totalOrders, icon: ShoppingCart, color: 'indigo' },
                    { label: 'Pending Queue', val: stats.pendingOrders, icon: Clock, color: 'amber' },
                    { label: 'In Delivery', val: stats.deliveryOrders, icon: Truck, color: 'blue' },
                    { label: 'Completed Deliveries', val: stats.completedOrders, icon: CheckCircle2, color: 'emerald' },
                  ].map((cell, idx) => {
                    const Icon = cell.icon;
                    const colorMap: Record<string, string> = {
                      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100/50 dark:bg-indigo-950/40 dark:text-indigo-400',
                      amber: 'bg-amber-50 text-amber-600 border-amber-100/50 dark:bg-amber-950/40 dark:text-amber-400',
                      blue: 'bg-blue-50 text-blue-600 border-blue-100/50 dark:bg-blue-950/40 dark:text-blue-400',
                      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-950/40 dark:text-emerald-400',
                    };
                    return (
                      <div key={idx} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-3xl soft-shadow flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 block leading-tight">{cell.label}</span>
                          <h4 className="text-xl font-black">{cell.val}</h4>
                        </div>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${colorMap[cell.color]}`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Handcrafted System Efficiency Graph */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-3xl soft-shadow space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">Delivery Pipelines Ratio</h4>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">Efficiency across active delivery states</p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                  </div>

                  <div className="space-y-2 pt-2">
                    {[
                      { label: 'Completed Deliveries', val: stats.completedOrders, ratio: stats.totalOrders ? (stats.completedOrders / stats.totalOrders) * 100 : 0, color: 'bg-emerald-500' },
                      { label: 'In Delivery', val: stats.deliveryOrders, ratio: stats.totalOrders ? (stats.deliveryOrders / stats.totalOrders) * 100 : 0, color: 'bg-blue-500' },
                      { label: 'Pending Orders', val: stats.pendingOrders, ratio: stats.totalOrders ? (stats.pendingOrders / stats.totalOrders) * 100 : 0, color: 'bg-amber-500' },
                    ].map((row, rIdx) => (
                      <div key={rIdx} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-gray-500">{row.label} ({row.val})</span>
                          <span>{Math.round(row.ratio)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-50 dark:bg-zinc-950 rounded-full overflow-hidden border border-gray-100 dark:border-zinc-800">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${row.ratio}%` }}
                            transition={{ duration: 0.6 }}
                            className={`h-full ${row.color} rounded-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-gray-400">Failed to load admin telemetry data</div>
            )}
          </div>
        )}

        {/* SUBTAB 2: USERS DIRECTORY */}
        {activeSubTab === 'users' && (
          <div className="space-y-4">
            {!selectedUser ? (
              <>
                {/* Search */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider pl-1">Registered Users list</h3>
                  <div className="relative">
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users by name, phone, email..."
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl text-sm focus:outline-none dark:text-zinc-100 shadow-sm"
                    />
                    <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-gray-400" />
                  </div>
                </div>

                {/* Users List */}
                <div className="space-y-2">
                  {loadingUsers ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-gray-200 dark:bg-zinc-800 rounded-2xl animate-pulse-fast" />
                    ))
                  ) : users.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 text-center text-xs text-gray-400">
                      No matching registered users found
                    </div>
                  ) : (
                    users.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedUser(u);
                          loadUserDeepDetails(u.id);
                        }}
                        className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-3xl flex items-center justify-between hover:scale-[1.01] hover:border-indigo-100 cursor-pointer transition-all duration-150 soft-shadow"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-extrabold text-gray-900 dark:text-zinc-100">{u.fullName}</h4>
                          <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                            {u.phone} • {u.paymentMethod}
                          </p>
                          <div className="flex gap-2 pt-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            <span>Ords: {(u as any).totalOrders || 0}</span>
                            <span>•</span>
                            <span className="text-emerald-600">Earnings: Rs.{u.totalEarnings}</span>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold uppercase">
                          {u.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              /* User Deep Details View */
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setSelectedUserDetails(null);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-zinc-300"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to list
                </button>

                {loadingUserDetails || !selectedUserDetails ? (
                  <div className="p-8 text-center text-xs text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading user portfolios...
                  </div>
                ) : (
                  <div className="space-y-5 pb-20 animate-fade-in">
                    {/* User Profile Info Card */}
                    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-[2rem] space-y-4 soft-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-extrabold text-lg text-gray-900 dark:text-zinc-100">
                            {selectedUserDetails.user.fullName}
                          </h3>
                          <p className="text-[10px] text-gray-400 font-mono">{selectedUserDetails.user.id}</p>
                        </div>
                        <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase border border-indigo-100/35">
                          Active Account
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 text-xs border-t border-gray-100 dark:border-zinc-800">
                        <div>
                          <span className="text-[9px] text-gray-400 font-bold uppercase">Email</span>
                          <p className="font-semibold text-gray-700 dark:text-zinc-300">{selectedUserDetails.user.email}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 font-bold uppercase">Phone</span>
                          <p className="font-semibold text-gray-700 dark:text-zinc-300">{selectedUserDetails.user.phone}</p>
                        </div>
                      </div>

                      <div className="p-3.5 bg-gray-50 dark:bg-zinc-950/50 rounded-2xl space-y-2 border border-gray-100 dark:border-zinc-850">
                        <span className="text-[9px] text-gray-400 font-bold uppercase block tracking-wider">Payment Account</span>
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-500">Method: {selectedUserDetails.user.paymentMethod}</span>
                          <span className="font-mono text-gray-800 dark:text-zinc-200">A/C: {selectedUserDetails.user.paymentAccount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Widget & Payout trigger */}
                    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-[2rem] space-y-4 soft-shadow">
                      <div className="flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Available Balance</span>
                          <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            Rs.{selectedUserDetails.user.availableBalance.toLocaleString()}
                          </h2>
                          <p className="text-[9px] text-gray-400">Total accumulated: Rs.{selectedUserDetails.user.totalEarnings}</p>
                        </div>
                        <button
                          onClick={() => setShowPayoutModal(true)}
                          disabled={selectedUserDetails.user.availableBalance <= 0}
                          className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-4 py-2.5 rounded-2xl disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> Disburse Payment
                        </button>
                      </div>
                    </div>

                    {/* Order History */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider pl-1">Order History ({selectedUserDetails.orders.length})</h4>
                      {selectedUserDetails.orders.length === 0 ? (
                        <div className="bg-white p-6 rounded-3xl text-center text-xs text-gray-400 border border-gray-100">
                          This user has not registered any orders yet.
                        </div>
                      ) : (
                        selectedUserDetails.orders.map((o) => (
                          <div key={o.id} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-3.5 rounded-2xl flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-gray-800 dark:text-zinc-200">{o.customerName}</p>
                              <p className="text-[10px] text-gray-400">
                                {o.items.map((it: any) => `${it.name} (${it.quantity}x)`).join(', ')}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-100 bg-gray-50 dark:bg-zinc-850 dark:border-zinc-800 text-gray-600 dark:text-zinc-300">
                              {o.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Payout Logs Table */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider pl-1">Disbursement History ({selectedUserDetails.payments.length})</h4>
                      {selectedUserDetails.payments.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl text-center text-xs text-gray-400 border border-gray-100 dark:border-zinc-800">
                          No payments processed yet for this user.
                        </div>
                      ) : (
                        selectedUserDetails.payments.map((p) => (
                          <div key={p.id} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-3.5 rounded-2xl flex justify-between items-center text-xs">
                            <div className="space-y-0.5">
                              <p className="font-bold text-emerald-600">-Rs.{p.amount}</p>
                              <p className="text-[9px] text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 font-bold px-2 py-0.5 rounded-md border border-emerald-100/30">
                                Sent
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: ORDERS TELEMETRY & MANAGEMENT */}
        {activeSubTab === 'orders' && (
          <div className="space-y-4">
            {!selectedOrder ? (
              <>
                {/* Search / Filter bar */}
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Search orders..."
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl text-sm focus:outline-none dark:text-zinc-100 shadow-sm"
                    />
                    <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-gray-400" />
                  </div>

                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {['all', 'Pending', 'Delivery', 'Completed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setOrderStatusFilter(status)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer border transition-all ${
                          orderStatusFilter === status
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 border-gray-100 dark:border-zinc-800'
                        }`}
                      >
                        {status === 'all' ? 'All' : status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders list */}
                <div className="space-y-2 pb-20">
                  {loadingOrders ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-gray-200 dark:bg-zinc-800 rounded-2xl animate-pulse-fast" />
                    ))
                  ) : orders.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 text-center text-xs text-gray-400">
                      No matching system orders found
                    </div>
                  ) : (
                    orders.map((o) => {
                      let tagColor = 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/55';
                      if (o.status === 'Delivery') tagColor = 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/55';
                      if (o.status === 'Completed') tagColor = 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/55';

                      return (
                        <div
                          key={o.id}
                          onClick={() => setSelectedOrder(o)}
                          className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-3xl hover:border-indigo-100 hover:scale-[1.01] cursor-pointer transition-all duration-150 soft-shadow space-y-1"
                        >
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-extrabold text-gray-900 dark:text-zinc-100">{o.customerName}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${tagColor}`}>
                              {o.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400">
                            {o.items.map((it: any) => `${it.name} (${it.quantity})`).join(', ')}
                          </p>
                          <p className="text-[9px] text-gray-400 pt-1 font-semibold uppercase">
                            Added by: {o.user?.fullName || 'Unknown User'}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              /* Order Status Details Control View */
              <div className="space-y-4 pb-20">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-zinc-300"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to orders list
                </button>

                <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-[2rem] space-y-4 soft-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block">Customer Order Details</span>
                      <h3 className="font-extrabold text-lg text-gray-900 dark:text-zinc-100">{selectedOrder.customerName}</h3>
                      <p className="text-[9px] text-gray-400 font-mono">{selectedOrder.id}</p>
                    </div>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 font-bold px-2.5 py-1 rounded-full uppercase">
                      {selectedOrder.status}
                    </span>
                  </div>

                  {/* Products inside */}
                  <div className="p-4 bg-gray-50 dark:bg-zinc-950/40 rounded-2xl space-y-2 border border-gray-100 dark:border-zinc-850">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Products</span>
                    {selectedOrder.items.map((it: any, index: number) => (
                      <div key={index} className="flex justify-between text-xs text-gray-700 dark:text-zinc-300">
                        <span className="font-semibold text-gray-800 dark:text-zinc-200">{it.name}</span>
                        <span className="font-mono bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          Qty {it.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Registered user details (dispatched) */}
                  <div className="space-y-1 text-xs border-t border-gray-100 dark:border-zinc-800 pt-3">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Origin dispatcher</span>
                    {selectedOrder.user ? (
                      <div className="space-y-1 bg-gray-50/50 dark:bg-zinc-950/20 p-3 rounded-xl border border-gray-100/50 dark:border-zinc-850 text-gray-700 dark:text-zinc-300">
                        <p className="font-bold">{selectedOrder.user.fullName}</p>
                        <p className="text-[10px] text-gray-400">Phone: {selectedOrder.user.phone}</p>
                        <p className="text-[10px] text-gray-400">Method: {selectedOrder.user.paymentMethod} • Number: {selectedOrder.user.paymentAccount}</p>
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">No user metadata registered</p>
                    )}
                  </div>

                  {/* Action buttons to update status */}
                  <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Alter Pipeline Status</span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Pending')}
                        disabled={updatingOrderStatus || selectedOrder.status === 'Pending'}
                        className="flex-1 py-2.5 rounded-xl border text-[11px] font-bold bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/40 disabled:opacity-40 cursor-pointer"
                      >
                        Set Pending
                      </button>
                      
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Delivery')}
                        disabled={updatingOrderStatus || selectedOrder.status === 'Delivery'}
                        className="flex-1 py-2.5 rounded-xl border text-[11px] font-bold bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100/40 disabled:opacity-40 cursor-pointer"
                      >
                        Set Delivery
                      </button>

                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Completed')}
                        disabled={updatingOrderStatus || selectedOrder.status === 'Completed'}
                        className="flex-1 py-2.5 rounded-xl border text-[11px] font-bold bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/40 disabled:opacity-40 cursor-pointer"
                      >
                        Set Completed
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payout modal drawer for disbursing payments */}
      <AnimatePresence>
        {showPayoutModal && selectedUserDetails && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPayoutModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-[2rem] sm:rounded-3xl p-6 shadow-2xl z-10 space-y-4 border-t sm:border border-gray-100 dark:border-zinc-850"
            >
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-zinc-100">Disburse User Earnings</h3>
                <p className="text-[10px] text-gray-400">Cash-out payout transaction registry</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-850 rounded-xl text-xs">
                <p className="font-semibold text-gray-600 dark:text-zinc-400">Recipient: {selectedUserDetails.user.fullName}</p>
                <p className="text-gray-500 mt-1">Gateway: {selectedUserDetails.user.paymentMethod} ({selectedUserDetails.user.paymentAccount})</p>
                <p className="text-gray-800 dark:text-zinc-200 mt-1 font-bold">Max Available: Rs.{selectedUserDetails.user.availableBalance}</p>
              </div>

              <form onSubmit={handlePayoutSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Payout Amount (Rs.)</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedUserDetails.user.availableBalance}
                    placeholder="e.g. 500"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(false)}
                    className="flex-1 py-2.5 bg-gray-50 dark:bg-zinc-950 text-gray-600 dark:text-zinc-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={payoutSubmitting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    {payoutSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm Payment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
