import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Phone, Mail, Key, CreditCard, ChevronRight, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { PaymentMethod } from '../types.js';

interface RegisterScreenProps {
  onLoginClick: () => void;
  onRegisterSuccess: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onLoginClick, onRegisterSuccess }) => {
  const { registerUser } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('JazzCash');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const tempErrors: Record<string, string> = {};

    if (!fullName.trim()) tempErrors.fullName = 'Full Name is required';
    if (!phone.trim()) {
      tempErrors.phone = 'Phone Number is required';
    } else if (phone.length < 10) {
      tempErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    if (!paymentAccount.trim()) {
      tempErrors.paymentAccount = 'Payment account number is required';
    } else if (paymentAccount.length < 10) {
      tempErrors.paymentAccount = 'Please enter a valid payment account number';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await registerUser({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password,
        paymentMethod,
        paymentAccount: paymentAccount.trim()
      });
      showToast('Registration successful! Welcome.', 'success');
      onRegisterSuccess();
    } catch (err: any) {
      showToast(err.message || 'Registration failed. Email might already be taken.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 dark:bg-zinc-950 px-4 py-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm mx-auto space-y-6">
        {/* Back navigation button */}
        <button
          onClick={onLoginClick}
          className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        {/* Title */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md border border-slate-100 dark:border-zinc-800 flex items-center justify-center bg-zinc-950">
            <img 
              src="/src/assets/images/app_logo_1784623222151.jpg" 
              alt="Plus Pro Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight text-center">Create Account</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 text-center">Sign up and get paid Rs.100 per finished delivery</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 p-6 rounded-[2rem] shadow-xl shadow-slate-100/50 dark:shadow-none space-y-5 max-h-[80vh] overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Muhammad Ali"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100 ${
                    errors.fullName ? 'border-rose-400' : 'border-slate-200 dark:border-zinc-800'
                  }`}
                />
                <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              </div>
              {errors.fullName && <p className="text-[10px] text-rose-500 font-medium pl-1">{errors.fullName}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 03123456789"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100 ${
                    errors.phone ? 'border-rose-400' : 'border-slate-200 dark:border-zinc-800'
                  }`}
                />
                <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              </div>
              {errors.phone && <p className="text-[10px] text-rose-500 font-medium pl-1">{errors.phone}</p>}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ali@pluspro.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100 ${
                    errors.email ? 'border-rose-400' : 'border-slate-200 dark:border-zinc-800'
                  }`}
                />
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              </div>
              {errors.email && <p className="text-[10px] text-rose-500 font-medium pl-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Create Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100 ${
                    errors.password ? 'border-rose-400' : 'border-slate-200 dark:border-zinc-800'
                  }`}
                />
                <Key className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              </div>
              {errors.password && <p className="text-[10px] text-rose-500 font-medium pl-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100 ${
                    errors.confirmPassword ? 'border-rose-400' : 'border-slate-200 dark:border-zinc-800'
                  }`}
                />
                <Key className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              </div>
              {errors.confirmPassword && (
                <p className="text-[10px] text-rose-500 font-medium pl-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Payout Options Divider */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-3">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                Payout Gateway Details
              </span>

              {/* Payment Method Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'JazzCash', name: 'JazzCash' },
                    { id: 'EasyPaisa', name: 'EasyPaisa' }
                  ].map((method) => {
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                            : 'bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-100/50'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {method.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Number */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                  Account / Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={paymentAccount}
                    onChange={(e) => setPaymentAccount(e.target.value)}
                    placeholder="e.g. 03001234567"
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100 ${
                      errors.paymentAccount ? 'border-rose-400' : 'border-slate-200 dark:border-zinc-800'
                    }`}
                  />
                  <CreditCard className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                </div>
                {errors.paymentAccount && (
                  <p className="text-[10px] text-rose-500 font-medium pl-1">{errors.paymentAccount}</p>
                )}
              </div>
            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Provisioning Account...
                </>
              ) : (
                <>
                  Register Portal Account
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
