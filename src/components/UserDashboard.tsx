import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Wallet, ArrowUpRight, Clock, Truck, 
  CheckCircle2, AlertCircle, ShoppingBag, Bell, Sun, Moon 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { DashboardStats, Order, AppNotification } from '../types.js';
import { DashboardSkeleton } from './Skeletons.js';
import { useTheme } from '../context/ThemeContext.js';

interface UserDashboardProps {
  onRefreshOrders: () => void;
  setActiveTab: (tab: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onRefreshOrders, setActiveTab }) => {
  const { user, fetchStats, fetchOrders, fetchNotifications, markNotificationsAsRead } = useAuth();
  const { showToast } = useToast();
  const { darkMode, toggleDarkMode } = useTheme();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [statsRes, ordersRes, notificationsRes] = await Promise.all([
        fetchStats(),
        fetchOrders(),
        fetchNotifications()
      ]);
      setStats(statsRes);
      setRecentOrders(ordersRes.slice(0, 3)); // show top 3 recent orders
      setNotifications(notificationsRes);
    } catch (err: any) {
      showToast(err.message || 'Failed to load dashboard statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleReadNotifications = async () => {
    try {
      await markNotificationsAsRead();
      // Update notifications state to all read
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      // Slient fail
    }
  };

  const toggleNotificationsPanel = () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState) {
      handleReadNotifications();
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
            Welcome back,
          </span>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
            {user?.fullName}
          </h2>
        </div>
        
        {/* Actions Button */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-850 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 cursor-pointer transition-all duration-200"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={toggleNotificationsPanel}
              className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-850 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 cursor-pointer transition-all duration-200"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse" />
              )}
            </button>

            {/* Notifications Dropdown Panel (Smooth Slide Popup) */}
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-xl z-50 p-4 max-h-[350px] overflow-y-auto"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 dark:text-zinc-500 text-xs">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className={`p-2.5 rounded-xl border transition-all text-xs ${
                          notif.read 
                            ? 'bg-transparent border-transparent' 
                            : 'bg-indigo-50/30 border-indigo-50 dark:bg-indigo-950/10 dark:border-indigo-950/50'
                        }`}>
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-bold text-gray-800 dark:text-zinc-200">{notif.title}</span>
                            <span className="text-[9px] text-gray-400 whitespace-nowrap">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero Earnings Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 text-white rounded-[2.5rem] p-6 shadow-xl shadow-indigo-100 dark:shadow-none"
      >
        {/* Design Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">
              Total Earnings
            </span>
            <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Earning Rate: Rs.100/order
            </span>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight flex items-baseline">
              <span className="text-2xl font-bold mr-1">Rs.</span>
              {stats?.totalEarnings.toLocaleString()}
            </h1>
            <p className="text-xs text-indigo-100">Automatically calculated on completion</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 mt-2">
            <div>
              <span className="text-[10px] uppercase text-indigo-200 font-semibold tracking-wider flex items-center gap-1">
                <Wallet className="w-3 h-3" /> Available Balance
              </span>
              <p className="text-lg font-bold mt-0.5">Rs.{stats?.availableBalance.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-indigo-200 font-semibold tracking-wider">
                Payout Method
              </span>
              <p className="text-xs font-bold mt-1 text-white/90">
                {user?.paymentMethod} ({user?.paymentAccount.slice(-4).padStart(11, '*')})
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid: Secondary Mini Statistics */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Today's Orders", value: stats?.todayOrders, icon: ShoppingBag, color: 'indigo' },
          { label: "Pending Orders", value: stats?.pendingOrders, icon: Clock, color: 'amber' },
          { label: "In Delivery", value: stats?.deliveryOrders, icon: Truck, color: 'blue' },
          { label: "Completed", value: stats?.completedOrders, icon: CheckCircle2, color: 'emerald' },
        ].map((item, idx) => {
          const Icon = item.icon;
          const bgColors: Record<string, string> = {
            indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-100/20',
            amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100/20',
            blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100/20',
            emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100/20',
          };
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-3xl flex flex-col justify-between gap-4 soft-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 tracking-tight leading-tight">
                  {item.label}
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${bgColors[item.color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-zinc-100 tracking-tight">
                {item.value}
              </h3>
            </motion.div>
          );
        })}
      </div>

      {/* Analytics Handcrafted Pure SVG Chart */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-[2rem] soft-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-gray-900 dark:text-zinc-100">Earnings Projections</h4>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">Accumulating Rs.100 per completed order</p>
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-xl flex items-center gap-1">
            Rs.100/completed
          </span>
        </div>

        {/* Handcrafted Animated Responsive SVG Bar Chart */}
        <div className="relative pt-4">
          <div className="flex items-end justify-between h-36 gap-3 px-2">
            {[
              { label: '5 Ords', val: 500, height: '10%' },
              { label: '15 Ords', val: 1500, height: '30%' },
              { label: '25 Ords', val: 2500, height: '50%' },
              { label: '35 Ords', val: 3500, height: '70%' },
              { label: '50 Ords', val: 5000, height: '100%' },
            ].map((bar, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gray-50 dark:bg-zinc-950 rounded-2xl h-24 flex items-end overflow-hidden border border-gray-100/50 dark:border-zinc-800/40">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: bar.height }}
                    transition={{ delay: index * 0.1, duration: 0.8, ease: 'easeOut' }}
                    className="w-full bg-gradient-to-t from-indigo-500 to-indigo-600 rounded-b-xl"
                  />
                </div>
                <div className="text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-gray-700 dark:text-zinc-300 block">Rs.{bar.val}</span>
                  <span className="text-[8px] font-semibold text-gray-400 dark:text-zinc-500 uppercase block">{bar.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-extrabold text-gray-900 dark:text-zinc-100">Recent Activity</h4>
          <button 
            onClick={() => setActiveTab('orders')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="space-y-2">
          {recentOrders.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-8 rounded-3xl text-center text-xs text-gray-400 dark:text-zinc-500">
              No orders registered yet. Press + at bottom to add!
            </div>
          ) : (
            recentOrders.map((order) => {
              let badgeColor = 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40';
              if (order.status === 'Delivery') badgeColor = 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40';
              if (order.status === 'Completed') badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40';

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-3xl flex justify-between items-center soft-shadow hover:scale-[1.01] transition-transform duration-150"
                >
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-gray-900 dark:text-zinc-100">{order.customerName}</h5>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                      {order.items.map(item => `${item.name} (${item.quantity}x)`).join(', ')}
                    </p>
                    <span className="text-[9px] text-gray-400 dark:text-zinc-500 block">
                      {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badgeColor}`}>
                    {order.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
