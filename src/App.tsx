import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeProvider, useTheme } from './context/ThemeContext.js';
import { ToastProvider, useToast } from './context/ToastContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LoginScreen } from './components/LoginScreen.js';
import { RegisterScreen } from './components/RegisterScreen.js';
import { BottomNav } from './components/BottomNav.js';
import { AddOrderModal } from './components/AddOrderModal.js';
import { UserDashboard } from './components/UserDashboard.js';
import { OrdersTab } from './components/OrdersTab.js';
import { ProfileTab } from './components/ProfileTab.js';
import { AdminPanel } from './components/AdminPanel.js';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, isAdmin, logout, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [refreshOrdersTrigger, setRefreshOrdersTrigger] = useState(0);

  // Global loading overlay
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest animate-pulse">
          Loading Plus Pro...
        </p>
      </div>
    );
  }

  // Auth Routing
  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        {authScreen === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.15 }}
          >
            <LoginScreen 
              onRegisterClick={() => setAuthScreen('register')} 
              onLoginSuccess={() => setRefreshOrdersTrigger(p => p + 1)} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.15 }}
          >
            <RegisterScreen 
              onLoginClick={() => setAuthScreen('login')} 
              onRegisterSuccess={() => setRefreshOrdersTrigger(p => p + 1)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Admin Portal routing (totally hidden, separate)
  if (isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <AdminPanel onLogout={logout} />
      </motion.div>
    );
  }

  // Standard User Portal routing
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24 text-slate-900 dark:text-zinc-100">
      <main className="max-w-md mx-auto px-4 pt-6">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <UserDashboard 
                onRefreshOrders={() => setRefreshOrdersTrigger(p => p + 1)} 
                setActiveTab={setActiveTab} 
              />
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <OrdersTab refreshTrigger={refreshOrdersTrigger} />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <ProfileTab />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Bottom Bar Navigation */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onAddOrderClick={() => setIsAddOrderOpen(true)} 
      />

      {/* Add Order Popup Modal */}
      <AddOrderModal 
        isOpen={isAddOrderOpen} 
        onClose={() => setIsAddOrderOpen(false)} 
        onSuccess={() => {
          setRefreshOrdersTrigger(p => p + 1);
          setActiveTab('orders'); // Auto navigate to orders list
        }} 
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
