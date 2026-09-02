'use client';

import React, { useState, useEffect } from 'react';
import { X, Receipt, Calculator, AlertCircle, Sparkles } from 'lucide-react';

interface AddSalaryDueModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedLabourId?: string;
  onSuccess?: () => void;
}

export default function AddSalaryDueModal({
  isOpen,
  onClose,
  preSelectedLabourId,
  onSuccess,
}: AddSalaryDueModalProps) {
  const [labours, setLabours] = useState<any[]>([]);
  const [selectedLabourId, setSelectedLabourId] = useState(preSelectedLabourId || '');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [reference, setReference] = useState('');

  // Payment Calculation Helper (NOT attendance tracking)
  const [helperUnits, setHelperUnits] = useState('1');
  const [helperRate, setHelperRate] = useState('0');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchLabours();
      if (preSelectedLabourId) {
        setSelectedLabourId(preSelectedLabourId);
      }
    }
  }, [isOpen, preSelectedLabourId]);

  const fetchLabours = async () => {
    try {
      const res = await fetch('/api/labour?status=ACTIVE');
      const data = await res.json();
      if (data.success) {
        setLabours(data.labours);
        if (!selectedLabourId && data.labours.length > 0) {
          const first = data.labours[0];
          setSelectedLabourId(first.id);
          const r = first.salaryType === 'DAILY' ? first.dailyRate : first.weeklyRate;
          setHelperRate(r.toString());
          setAmount(r.toString());
        }
      }
    } catch (err) {
      console.error('Failed to load labour list', err);
    }
  };

  const currentLabour = labours.find((l) => l.id === selectedLabourId);

  const handleLabourChange = (labourId: string) => {
    setSelectedLabourId(labourId);
    const lab = labours.find((l) => l.id === labourId);
    if (lab) {
      const r = lab.salaryType === 'DAILY' ? lab.dailyRate : lab.weeklyRate;
      setHelperRate(r.toString());
      const calculated = (parseFloat(helperUnits) || 1) * r;
      setAmount(calculated.toString());
    }
  };

  const handleApplyCalculation = () => {
    const units = parseFloat(helperUnits) || 0;
    const rate = parseFloat(helperRate) || 0;
    if (units > 0 && rate > 0) {
      setAmount((units * rate).toString());
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid salary due amount greater than zero.');
      return;
    }

    if (!selectedLabourId) {
      setError('Please select a labour.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labourId: selectedLabourId,
          type: 'SALARY_DUE',
          amount: numAmount,
          transactionDate,
          reference: reference.trim() || null,
          remarks: remarks.trim() || null,
          helperUnits: parseFloat(helperUnits) || null,
          helperRate: parseFloat(helperRate) || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record salary due.');
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
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E07A47]/15 text-[#E07A47] flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">+ Add Salary Due</h2>
              <p className="text-xs text-[#59718A]">Record owed salary earned by labour (Increases Salary Payable)</p>
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Labour Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Labour <span className="text-[#E07A47]">*</span>
            </label>
            <select
              value={selectedLabourId}
              onChange={(e) => handleLabourChange(e.target.value)}
              required
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none bg-white font-medium text-slate-800"
            >
              <option value="">-- Choose Labour --</option>
              {labours.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.id}) - {l.workType} [{l.salaryType === 'DAILY' ? `Rs. ${l.dailyRate}/day` : `Rs. ${l.weeklyRate}/wk`}]
                </option>
              ))}
            </select>
            {currentLabour && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#59718A] px-1">
                <span>Work: <strong>{currentLabour.workType}</strong></span>
                <span>Current Payable: <strong className="text-[#E07A47]">Rs. {currentLabour.balances?.salaryPayable?.toLocaleString() || 0}</strong></span>
              </div>
            )}
          </div>

          {/* Date & Bill Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work / Milestone Ref</label>
              <input
                type="text"
                placeholder="e.g. Week 35, 1st Floor Slab"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none"
              />
            </div>
          </div>

          {/* Optional Calculation Helper */}
          <div className="bg-[#F2E9D8]/50 p-4 rounded-2xl border border-[#F2E9D8]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#59718A]" />
                Rate Calculation Helper (Optional)
              </span>
              <span className="text-[10px] text-slate-500 italic">Not attendance tracking</span>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  {currentLabour?.salaryType === 'WEEKLY' ? 'Weeks' : 'Days'}
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={helperUnits}
                  onChange={(e) => setHelperUnits(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Rate (Rs.)</label>
                <input
                  type="number"
                  value={helperRate}
                  onChange={(e) => setHelperRate(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div className="pt-3.5">
                <button
                  type="button"
                  onClick={handleApplyCalculation}
                  className="w-full py-1.5 bg-[#59718A] hover:bg-[#4d6379] text-white text-[11px] font-semibold rounded-lg transition"
                >
                  Apply = Rs. {((parseFloat(helperUnits) || 0) * (parseFloat(helperRate) || 0)).toLocaleString()}
                </button>
              </div>
            </div>
          </div>

          {/* Final Salary Due Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Final Salary Due Amount (Rs.) <span className="text-[#E07A47]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">Rs.</span>
              <input
                type="number"
                placeholder="e.g. 15,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
                className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:border-[#2F6F6D] focus:ring-2 focus:ring-[#2F6F6D]/15 outline-none bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Details</label>
            <input
              type="text"
              placeholder="e.g. Approved by site engineer"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none"
            />
          </div>

          {/* Action Buttons */}
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#E07A47] hover:bg-[#c96939] rounded-xl shadow-md shadow-[#E07A47]/25 transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Salary Due'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
