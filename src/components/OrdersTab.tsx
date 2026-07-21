import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ShoppingBag, Calendar, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Order, OrderStatus } from '../types.js';
import { OrdersSkeleton } from './Skeletons.js';

interface OrdersTabProps {
  refreshTrigger: number;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ refreshTrigger }) => {
  const { fetchOrders } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const ordersRes = await fetchOrders(
        search.trim() || undefined,
        statusFilter === 'all' ? undefined : statusFilter
      );
      
      // Handle clientside sorting
      let sorted = [...ordersRes];
      if (sortBy === 'newest') {
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else {
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }

      setOrders(sorted);
    } catch (err: any) {
      showToast(err.message || 'Failed to retrieve orders list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [search, statusFilter, sortBy, refreshTrigger]);

  if (loading) {
    return <OrdersSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-black text-gray-900 dark:text-zinc-100 tracking-tight">Your Orders</h2>
        <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium">Search, filter, and track status pipelines</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name or product..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-zinc-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]"
        />
        <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
      </div>

      {/* Filter and Sorting Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex gap-1.5 shrink-0">
          {['all', 'Pending', 'Delivery', 'Completed'].map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer border transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-850'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            );
          })}
        </div>

        {/* Sort Trigger Button */}
        <button
          onClick={() => setSortBy(prev => prev === 'newest' ? 'oldest' : 'newest')}
          className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-850 transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{sortBy === 'newest' ? 'Newest' : 'Oldest'}</span>
        </button>
      </div>

      {/* Card Grid Layout */}
      <div className="space-y-3 pb-20">
        <AnimatePresence mode="popLayout">
          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-12 rounded-3xl text-center space-y-2"
            >
              <div className="w-12 h-12 bg-gray-50 dark:bg-zinc-950 rounded-full flex items-center justify-center text-gray-400 mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h5 className="text-sm font-bold text-gray-700 dark:text-zinc-300">No orders found</h5>
              <p className="text-xs text-gray-400 dark:text-zinc-500 max-w-xs mx-auto">
                Try widening your search keywords or filter status parameters.
              </p>
            </motion.div>
          ) : (
            orders.map((order, idx) => {
              // Status Styling
              let statusBadge = 'bg-amber-50 text-amber-600 border-amber-100/50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40';
              if (order.status === 'Delivery') {
                statusBadge = 'bg-blue-50 text-blue-600 border-blue-100/50 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40';
              } else if (order.status === 'Completed') {
                statusBadge = 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40';
              }

              return (
                <motion.div
                  key={order.id}
                  layoutId={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-3xl soft-shadow space-y-4"
                >
                  {/* Customer header */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold block uppercase tracking-wider">
                        Customer
                      </span>
                      <h4 className="font-bold text-gray-900 dark:text-zinc-100">{order.customerName}</h4>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusBadge}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Products inside */}
                  <div className="bg-gray-50/50 dark:bg-zinc-950/40 border border-gray-50 dark:border-zinc-850 p-3.5 rounded-2xl space-y-2">
                    <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-bold block uppercase tracking-wider">
                      Ordered Products
                    </span>
                    <div className="space-y-1.5">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-xs text-gray-700 dark:text-zinc-300">
                          <span className="font-medium text-gray-800 dark:text-zinc-200">{item.name}</span>
                          <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-500 dark:text-zinc-400">
                            Qty {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footing timeline and calculations */}
                  <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-zinc-500 pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    
                    {order.status === 'Completed' && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-0.5">
                        Earnings: +Rs.100
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
