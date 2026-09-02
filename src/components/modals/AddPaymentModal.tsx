'use client';

import React, { useState, useEffect } from 'react';
import { X, CreditCard, Calculator, AlertCircle } from 'lucide-react';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedLabourId?: string;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = ['CASH', 'BANK', 'JAZZCASH', 'EASYPAISA', 'OTHER'];

export default function AddPaymentModal({
  isOpen,
  onClose,
  preSelectedLabourId,
  onSuccess,
}: AddPaymentModalProps) {
  const [labours, setLabours] = useState<any[]>([]);
  const [selectedLabourId, setSelectedLabourId] = useState(preSelectedLabourId || '');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [remarks, setRemarks] = useState('');

  // Optional Calculation Helper
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
          if (first.balances?.salaryPayable > 0) {
            setAmount(first.balances.salaryPayable.toString());
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch labour list', err);
    }
  };

  const currentLabour = labours.find((l) => l.id === selectedLabourId);

  const handleLabourChange = (labourId: string) => {
    setSelectedLabourId(labourId);
    const lab = labours.find((l) => l.id === labourId);
    if (lab) {
      const r = lab.salaryType === 'DAILY' ? lab.dailyRate : lab.weeklyRate;
      setHelperRate(r.toString());
      if (lab.balances?.salaryPayable > 0) {
        setAmount(lab.balances.salaryPayable.toString());
      } else {
        setAmount('');
      }
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
      setError('Please enter a valid payment amount greater than zero.');
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
          type: 'SALARY_PAYMENT',
          amount: numAmount,
          paymentMethod,
          transactionDate,
          reference: reference.trim() || null,
          remarks: remarks.trim() || null,
          helperUnits: parseFloat(helperUnits) || null,
          helperRate: parseFloat(helperRate) || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payment.');
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
            <div className="w-10 h-10 rounded-2xl bg-[#2F6F6D]/15 text-[#2F6F6D] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">+ Add Salary Payment</h2>
              <p className="text-xs text-[#59718A]">Record payment disbursed to labour (Reduces Salary Payable)</p>
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
                  {l.name} ({l.id}) - {l.workType} [Payable: Rs. {l.balances?.salaryPayable?.toLocaleString() || 0}]
                </option>
              ))}
            </select>
            {currentLabour && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] px-1 bg-[#F2E9D8]/40 p-2 rounded-lg border border-[#F2E9D8]">
                <span>
                  Current Salary Payable:{' '}
                  <strong className="text-[#E07A47]">Rs. {currentLabour.balances?.salaryPayable?.toLocaleString() || 0}</strong>
                </span>
                <span>
                  Outstanding Advance:{' '}
                  <strong className="text-[#D4A72C]">Rs. {currentLabour.balances?.outstandingAdvance?.toLocaleString() || 0}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none bg-white font-medium"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Calculation Helper */}
          <div className="bg-[#F2E9D8]/50 p-4 rounded-2xl border border-[#F2E9D8]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#59718A]" />
                Payment Helper (Optional)
              </span>
              <span className="text-[10px] text-slate-500 italic">Rate × Quantity</span>
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

          {/* Amount Paid */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Amount Paid (Rs.) <span className="text-[#E07A47]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">Rs.</span>
              <input
                type="number"
                placeholder="e.g. 10,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
                className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:border-[#2F6F6D] focus:ring-2 focus:ring-[#2F6F6D]/15 outline-none bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Cheque #</label>
              <input
                type="text"
                placeholder="e.g. Chq-8492 or JazzCash ID"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
              <input
                type="text"
                placeholder="e.g. Cleared at site office"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none"
              />
            </div>
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#2F6F6D] hover:bg-[#285d5b] rounded-xl shadow-md shadow-[#2F6F6D]/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
