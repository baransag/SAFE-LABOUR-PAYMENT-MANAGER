'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Lock, User, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#F4F0E8] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        {/* Company Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100/80">
          {/* Header */}
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-white p-1 flex items-center justify-center shadow-md border border-slate-100 mb-3 overflow-hidden">
              <img src="/assest/logo.jpeg" alt="SAFE SOLUTIONS Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">SAFE SOLUTIONS</h1>
            <p className="text-xs font-semibold text-[#59718A] tracking-wider uppercase mt-0.5">
              House of Construction Solutions
            </p>
            <div className="mt-2 text-xs font-medium text-slate-600 bg-[#F2E9D8]/60 px-3 py-1 rounded-full border border-[#F2E9D8]">
              Labour Payment & Ledger Management System
            </div>
          </div>

          {error && (
            <div className="mt-5 p-3.5 rounded-2xl bg-[#E07A47]/10 border border-[#E07A47]/20 text-[#E07A47] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorized Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. admin, muneeb, husnain, samaira"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full text-xs pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 focus:border-[#2F6F6D] focus:ring-2 focus:ring-[#2F6F6D]/15 outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full text-xs pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-[#2F6F6D] focus:ring-2 focus:ring-[#2F6F6D]/15 outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2F6F6D] hover:bg-[#285d5b] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#2F6F6D]/25 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <span>Sign In to Office System</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Authorized Office Staff Quick Login Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-center mb-3">
              <span className="text-[11px] font-semibold text-[#59718A] uppercase tracking-wider">
                Quick Select Authorized Staff
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin@safe123')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-[#F2E9D8] border border-slate-200 text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">Admin</div>
                  <div className="text-[10px] text-slate-500">Chief Executive</div>
                </div>
                <span className="text-[10px] font-bold text-[#5B3A62] bg-[#5B3A62]/10 px-1.5 py-0.5 rounded">Full</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('muneeb', 'muneeb@safe123')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-[#F2E9D8] border border-slate-200 text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">Muneeb</div>
                  <div className="text-[10px] text-slate-500">Accounts</div>
                </div>
                <span className="text-[10px] font-bold text-[#2F6F6D] bg-[#2F6F6D]/10 px-1.5 py-0.5 rounded">Office</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('husnain', 'husnain@safe123')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-[#F2E9D8] border border-slate-200 text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">Husnain</div>
                  <div className="text-[10px] text-slate-500">Accounts</div>
                </div>
                <span className="text-[10px] font-bold text-[#2F6F6D] bg-[#2F6F6D]/10 px-1.5 py-0.5 rounded">Office</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('samaira', 'samaira@safe123')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-[#F2E9D8] border border-slate-200 text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">Samaira</div>
                  <div className="text-[10px] text-slate-500">Accounts</div>
                </div>
                <span className="text-[10px] font-bold text-[#2F6F6D] bg-[#2F6F6D]/10 px-1.5 py-0.5 rounded">Office</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-3">
              Office-only internal software • No employee/attendance access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
