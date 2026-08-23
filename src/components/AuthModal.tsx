import React, { useState } from 'react';
import { X, User, Lock, Mail, Phone, AlertCircle, Shield } from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide your email and password');
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setErrorMessage('Please enter your full name');
        return;
      }
      if (!phone.trim()) {
        setErrorMessage('Please enter your Kenyan phone number');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.auth.login({
          email: email.trim(),
          password: password.trim(),
        });
        onAuthSuccess(res.profile);
        onClose();
      } else {
        const res = await api.auth.register({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password: password.trim(),
        });
        onAuthSuccess(res.profile);
        onClose();
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdminFill = () => {
    setEmail('admin@newmiamirestaurant.co.ke');
    setPassword('MiamiAdmin2026!Naivasha');
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F3F2EE] border-2 border-[#1A1A1A] rounded-3xl w-full max-w-md text-[#1A1A1A] shadow-[8px_8px_0px_0px_#1A1A1A] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b-2 border-[#1A1A1A] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] text-[#F3F2EE] border-2 border-[#1A1A1A] flex items-center justify-center font-bold shadow-[2px_2px_0px_0px_#1A1A1A]">
              <User className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1A1A1A]">
                {mode === 'login' ? 'Sign In to Your Account' : 'Create Customer Account'}
              </h3>
              <p className="text-xs text-stone-600 font-medium">
                {mode === 'login' ? 'Manage orders & table reservations' : 'Fast checkout & order tracking'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-600 hover:text-[#1A1A1A] hover:bg-stone-100 rounded-lg transition border border-transparent hover:border-[#1A1A1A]"
            aria-label="Close auth modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b-2 border-[#1A1A1A] bg-[#F3F2EE]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-extrabold text-center border-b-2 transition ${
              mode === 'login'
                ? 'border-[#1A1A1A] text-[#1A1A1A] bg-white'
                : 'border-transparent text-stone-500 hover:text-[#1A1A1A]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-extrabold text-center border-b-2 transition ${
              mode === 'register'
                ? 'border-[#1A1A1A] text-[#1A1A1A] bg-white'
                : 'border-transparent text-stone-500 hover:text-[#1A1A1A]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {mode === 'register' && (
            <>
              <div>
                <label className="text-xs font-bold text-[#1A1A1A] block mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samuel Omondi"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none shadow-[2px_2px_0px_0px_#1A1A1A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1A1A] block mb-1">Kenyan Phone *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="0741775878"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none shadow-[2px_2px_0px_0px_#1A1A1A]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-[#1A1A1A] block mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none shadow-[2px_2px_0px_0px_#1A1A1A]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1A1A1A] block mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none shadow-[2px_2px_0px_0px_#1A1A1A]"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border-2 border-rose-600 text-rose-800 text-xs flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1A1A1A] hover:bg-stone-800 disabled:opacity-50 text-[#F3F2EE] font-bold py-3 px-4 rounded-xl text-xs border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#D97706] hover:shadow-[2px_2px_0px_0px_#D97706] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
          >
            {isLoading
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In to Account'
              : 'Complete Registration'}
          </button>

          {/* Admin Staff Quick Fill Note */}
          <div className="pt-3 border-t-2 border-[#1A1A1A]/10 text-center">
            <button
              type="button"
              onClick={handleQuickAdminFill}
              className="text-[11px] text-stone-700 hover:text-[#1A1A1A] font-bold flex items-center justify-center gap-1 mx-auto"
            >
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              <span>Click to auto-fill Restaurant Admin credentials</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
