import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Key, ChevronRight, Loader2, Eye, EyeOff, Sparkles, HelpCircle, Shield, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

interface LoginScreenProps {
  onRegisterClick: () => void;
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onRegisterClick, onLoginSuccess }) => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password flow state variables
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: Email Request, 2: OTP Verification & Reset
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300 seconds)
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Password reset countdown timer effect
  useEffect(() => {
    let interval: any = null;
    if (showForgotModal && forgotStep === 2 && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && forgotStep === 2) {
      showToast('Verification code expired! Please request a new code.', 'error');
      setForgotStep(1);
      setDemoCode(null);
    }
    return () => clearInterval(interval);
  }, [showForgotModal, forgotStep, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast('Please enter your email address', 'error');
      return;
    }

    setIsRequestingCode(true);
    try {
      const response = await fetch('/api/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to request verification code');
      }

      showToast(data.message, 'success');
      setForgotStep(2);
      setTimeLeft(300);
      setVerificationCode('');
      setNewPassword('');
      if (data.demoCode) {
        setDemoCode(data.demoCode);
      } else {
        setDemoCode(null);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) {
      showToast('Please enter the 6-digit verification code', 'error');
      return;
    }
    if (verificationCode.length !== 6) {
      showToast('Verification code must be exactly 6 digits', 'error');
      return;
    }
    if (!newPassword) {
      showToast('Please enter your new password', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setIsResettingPassword(true);
    try {
      const response = await fetch('/api/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          code: verificationCode,
          newPassword
        })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      showToast(data.message, 'success');
      setShowForgotModal(false);
      // Auto pre-fill credentials on main login screen for delightful UX
      setEmail(forgotEmail);
      setPassword(newPassword);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      showToast('Logged in successfully! Welcome to Plus Pro.', 'success');
      onLoginSuccess();
    } catch (err: any) {
      showToast(err.message || 'Invalid email address or password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 dark:bg-zinc-950 px-4 py-8 relative overflow-hidden">
      {/* Background ambient radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm mx-auto space-y-6">
        {/* Header Block */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 select-none">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
              Plus Pro
            </span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </div>
          
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
            Add orders, complete deliveries, earn Rs.100
          </p>
        </div>

        {/* Portal form wrapper */}
        <motion.div
          layout
          className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 p-6 rounded-[2rem] shadow-xl shadow-slate-100/50 dark:shadow-none space-y-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Sign In
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@pluspro.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-zinc-100"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Secret Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotStep(1);
                    setDemoCode(null);
                    setShowForgotModal(true);
                  }}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-zinc-100"
                />
                <Key className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setShowPassword(true); }}
                  onMouseUp={() => setShowPassword(false)}
                  onMouseLeave={() => setShowPassword(false)}
                  onTouchStart={(e) => { e.preventDefault(); setShowPassword(true); }}
                  onTouchEnd={() => setShowPassword(false)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 text-white font-bold rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 dark:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Login Account
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration link toggle */}
          <div className="text-center pt-3 border-t border-slate-100 dark:border-zinc-800 text-xs">
            <span className="text-slate-400">Don't have an account? </span>
            <button
              onClick={onRegisterClick}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Register Now
            </button>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Interactive Flow Popup */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
            {/* Backdrop click dismisses or keeps modal open */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                if (!isRequestingCode && !isResettingPassword) {
                  setShowForgotModal(false);
                }
              }} 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm" 
            />
            
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-[2.5rem] sm:rounded-[2rem] p-6 shadow-2xl z-10 space-y-5 border border-slate-100 dark:border-zinc-850"
            >
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">Secure Password Recovery</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email OTP Verification</p>
                </div>
              </div>

              {/* Step 1: Request OTP */}
              {forgotStep === 1 && (
                <form onSubmit={handleRequestCode} className="space-y-4">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Enter the email address registered with your account. We will send a <strong>6-digit verification code</strong> to verify your identity.
                  </p>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. user@pluspro.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-zinc-100"
                        required
                      />
                      <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 py-3 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-900 font-bold rounded-2xl text-xs transition-colors cursor-pointer text-slate-700 dark:text-zinc-300 border border-slate-100 dark:border-zinc-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isRequestingCode}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isRequestingCode ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          Send OTP Code
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Verify Code and Set Password */}
              {forgotStep === 2 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Verifying: <strong className="text-slate-700 dark:text-zinc-300 font-bold">{forgotEmail}</strong></span>
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" /> Change
                    </button>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-slate-200/50 dark:border-zinc-850 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold">Code expires in:</span>
                    </div>
                    <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-xl">
                      {formatTime(timeLeft)}
                    </span>
                  </div>

                  {/* 6-digit Code input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      pattern="\d{6}"
                      value={verificationCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setVerificationCode(val);
                      }}
                      placeholder="Enter 6-digit code"
                      className="w-full py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-center text-lg font-mono font-bold tracking-[8px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-zinc-100"
                      required
                    />
                  </div>

                  {/* New Password input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                      Create New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-zinc-100"
                        required
                        minLength={6}
                      />
                      <Key className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setShowNewPassword(true); }}
                        onMouseUp={() => setShowNewPassword(false)}
                        onMouseLeave={() => setShowNewPassword(false)}
                        onTouchStart={(e) => { e.preventDefault(); setShowNewPassword(true); }}
                        onTouchEnd={() => setShowNewPassword(false)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Warning regarding 10 failure limits */}
                  <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-[10px] text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                    <div>
                      <p className="font-bold">Security Lockout Protocol</p>
                      <p className="mt-0.5 leading-relaxed text-[9px] opacity-90">
                        Entering an invalid verification code 10 times will auto-expire the code. In that case, you will have to request a new code.
                      </p>
                    </div>
                  </div>

                  {/* Demo prefilled support box to ensure immediate testing functionality */}
                  {demoCode && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl space-y-1">
                      <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                        ⚡ Demo Mode (No SMTP Configured)
                      </p>
                      <p className="text-[9px] text-amber-700 dark:text-amber-300 leading-relaxed">
                        To test, please enter this code: <strong className="font-mono bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-200 text-xs font-bold">{demoCode}</strong>.
                      </p>
                      <button
                        type="button"
                        onClick={() => setVerificationCode(demoCode)}
                        className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 underline block"
                      >
                        Autofill Verification Code
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="flex-1 py-3 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-900 font-bold rounded-2xl text-xs transition-colors cursor-pointer text-slate-700 dark:text-zinc-300 border border-slate-100 dark:border-zinc-800"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isResettingPassword}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isResettingPassword ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Resetting...
                        </>
                      ) : (
                        <>
                          Reset Password
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
