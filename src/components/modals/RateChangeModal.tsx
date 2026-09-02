'use client';

import React, { useState } from 'react';
import { X, TrendingUp, AlertCircle, ShieldAlert } from 'lucide-react';

interface RateChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  labour: {
    id: string;
    name: string;
    workType: string;
    salaryType: string;
    dailyRate: number;
    weeklyRate: number;
  } | null;
  onSuccess?: () => void;
}

export default function RateChangeModal({
  isOpen,
  onClose,
  labour,
  onSuccess,
}: RateChangeModalProps) {
  const [salaryType, setSalaryType] = useState(labour?.salaryType || 'DAILY');
  const [newRate, setNewRate] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [rateChangeReason, setRateChangeReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !labour) return null;

  const currentRate = labour.salaryType === 'DAILY' ? labour.dailyRate : labour.weeklyRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = parseFloat(newRate);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid rate greater than zero.');
      return;
    }

    if (!rateChangeReason.trim()) {
      setError('Please provide a reason for the rate change (for audit log).');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        salaryType,
        rateChangeReason: rateChangeReason.trim(),
        effectiveFrom,
      };

      if (salaryType === 'DAILY') {
        payload.dailyRate = parsed;
      } else {
        payload.weeklyRate = parsed;
      }

      const res = await fetch(`/api/labour/${labour.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update rate');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2F6F6D]/15 text-[#2F6F6D] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Update Labour Wage Rate</h2>
              <p className="text-xs text-[#59718A]">Applies to future transactions; preserves history</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-[#E07A47]/10 border border-[#E07A47]/20 text-[#E07A47] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-4 p-3.5 bg-[#F2E9D8]/50 rounded-2xl border border-[#F2E9D8] text-xs text-[#59718A] flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-[#2F6F6D] shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800">Historical Rate Integrity:</strong> Changing this rate will NOT alter any past salary records or payments. A rate history record will be preserved.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Labour:</span>
              <span className="font-bold text-slate-800">{labour.name} ({labour.id})</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-500">Current Rate:</span>
              <span className="font-bold text-[#2F6F6D]">
                Rs. {currentRate.toLocaleString()} / {labour.salaryType.toLowerCase()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Wage Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="rateSalaryType"
                  value="DAILY"
                  checked={salaryType === 'DAILY'}
                  onChange={() => setSalaryType('DAILY')}
                  className="text-[#2F6F6D]"
                />
                <span>Daily Rate</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="rateSalaryType"
                  value="WEEKLY"
                  checked={salaryType === 'WEEKLY'}
                  onChange={() => setSalaryType('WEEKLY')}
                  className="text-[#2F6F6D]"
                />
                <span>Weekly Rate</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                New Rate (Rs.) <span className="text-[#E07A47]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">Rs.</span>
                <input
                  type="number"
                  placeholder="e.g. 2,200"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  required
                  min="1"
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:border-[#2F6F6D] outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Effective From</label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Rate Adjustment <span className="text-[#E07A47]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Promotion to senior mason, annual increment, market adjustment"
              value={rateChangeReason}
              onChange={(e) => setRateChangeReason(e.target.value)}
              required
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#2F6F6D] hover:bg-[#285d5b] rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save New Rate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
