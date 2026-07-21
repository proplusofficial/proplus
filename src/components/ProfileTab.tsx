import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Phone, Mail, CreditCard, ChevronRight, LogOut, 
  Settings, Key, AlertTriangle, ShieldCheck, Loader2, Coins 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { PaymentMethod, DashboardStats } from '../types.js';
import { ProfileSkeleton } from './Skeletons.js';

export const ProfileTab: React.FC = () => {
  const { user, logout, updateProfile, changePassword, fetchStats } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [showEditModal, setShowEditModal] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(user?.paymentMethod || 'JazzCash');
  const [paymentAccount, setPaymentAccount] = useState(user?.paymentAccount || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const loadStats = async () => {
    try {
      const statsRes = await fetchStats();
      setStats(statsRes);
    } catch (e) {
      // Slient fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !paymentAccount.trim()) {
      showToast('All fields are required', 'error');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateProfile({ fullName, phone, paymentMethod, paymentAccount });
      showToast('Profile updated successfully', 'success');
      setShowEditModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill out all fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
    } catch (err: any) {
      showToast(err.message || 'Incorrect current password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  // Get initials
  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <div className="space-y-6 pb-20">
      {/* Profile Header Block */}
      <div className="flex flex-col items-center py-6 text-center space-y-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-100 dark:shadow-none">
            {initials}
          </div>
          <span className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white dark:border-zinc-950 flex items-center justify-center">
            <ShieldCheck className="w-3 h-3 text-white" />
          </span>
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">{user?.fullName}</h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500">{user?.email}</p>
        </div>
      </div>

      {/* Numerical Stats Counters Widget */}
      <div className="grid grid-cols-3 gap-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-3xl soft-shadow text-center">
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400">Total Orders</span>
          <p className="text-lg font-black text-gray-800 dark:text-zinc-200 mt-0.5">
            {((stats?.completedOrders || 0) + (stats?.pendingOrders || 0) + (stats?.deliveryOrders || 0))}
          </p>
        </div>
        <div className="border-x border-gray-100 dark:border-zinc-800 px-2">
          <span className="text-[10px] uppercase font-bold text-gray-400">Completed</span>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {stats?.completedOrders}
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400">Pending</span>
          <p className="text-lg font-black text-amber-500 dark:text-amber-400 mt-0.5">
            {stats?.pendingOrders}
          </p>
        </div>
      </div>

      {/* Details List */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-5 space-y-4 soft-shadow">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Account</h4>
        
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Payment Gateway</p>
              <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">{user?.paymentMethod}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <Phone className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Account Number</p>
              <p className="text-sm font-mono font-bold text-gray-800 dark:text-zinc-200">{user?.paymentAccount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Options */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-3 space-y-1 soft-shadow">
        <button
          onClick={() => setShowEditModal(true)}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-850 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-4.5 h-4.5 text-gray-400" />
            <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">Edit Account Settings</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>

        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-850 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <Key className="w-4.5 h-4.5 text-gray-400" />
            <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">Change Password</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4.5 h-4.5 text-rose-500" />
            <span className="text-xs font-bold">Logout Session</span>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-300" />
        </button>
      </div>

      {/* Edit Profile Modal (Smooth popup) */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-[2rem] sm:rounded-3xl p-6 shadow-2xl z-10 space-y-4 border-t sm:border border-gray-100 dark:border-zinc-850"
            >
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-zinc-100">Edit Account Information</h3>
                <p className="text-[10px] text-gray-400">Update your profile parameters</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100"
                    >
                      <option value="JazzCash">JazzCash</option>
                      <option value="EasyPaisa">EasyPaisa</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Account #</label>
                    <input
                      type="text"
                      value={paymentAccount}
                      onChange={(e) => setPaymentAccount(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-2.5 bg-gray-50 dark:bg-zinc-950 hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-600 dark:text-zinc-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    {isUpdatingProfile ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal (Smooth popup) */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPasswordModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-[2rem] sm:rounded-3xl p-6 shadow-2xl z-10 space-y-4 border-t sm:border border-gray-100 dark:border-zinc-850"
            >
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-zinc-100">Update Credentials</h3>
                <p className="text-[10px] text-gray-400">Change your active login password</p>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-2.5 bg-gray-50 dark:bg-zinc-950 hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-600 dark:text-zinc-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    {isChangingPassword ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Update Password'}
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
