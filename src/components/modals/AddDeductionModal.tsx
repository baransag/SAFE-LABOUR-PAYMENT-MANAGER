'use client';

import React, { useState, useEffect } from 'react';
import { X, MinusCircle, AlertCircle } from 'lucide-react';

interface AddDeductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedLabourId?: string;
  onSuccess?: () => void;
}

const DEDUCTION_REASONS = [
  'Material Damage / Wastage',
  'Tools / Safety Gear Lost',
  'Site Penalty / Disciplinary',
  'Loan Recovery',
  'Advance Excess Recovery',
  'Other Office Deduction',
];

export default function AddDeductionModal({
  isOpen,
  onClose,
  preSelectedLabourId,
  onSuccess,
}: AddDeductionModalProps) {
  const [labours, setLabours] = useState<any[]>([]);
  const [selectedLabourId, setSelectedLabourId] = useState(preSelectedLabourId || '');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState(DEDUCTION_REASONS[0]);
  const [remarks, setRemarks] = useState('');

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
          setSelectedLabourId(data.labours[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load labour list', err);
    }
  };

  const currentLabour = labours.find((l) => l.id === selectedLabourId);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid deduction amount greater than zero.');
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
          type: 'DEDUCTION',
          amount: numAmount,
          transactionDate,
          reference: reason,
          remarks: remarks.trim() ? `${reason}: ${remarks.trim()}` : reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record deduction.');
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
            <div className="w-10 h-10 rounded-2xl bg-[#C47C8A]/15 text-[#C47C8A] flex items-center justify-center">
              <MinusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">+ Add Deduction</h2>
              <p className="text-xs text-[#59718A]">Apply penalty or expense deduction (Reduces Salary Payable)</p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Labour <span className="text-[#E07A47]">*</span>
            </label>
            <select
              value={selectedLabourId}
              onChange={(e) => setSelectedLabourId(e.target.value)}
              required
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none bg-white font-medium text-slate-800"
            >
              <option value="">-- Choose Labour --</option>
              {labours.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.id}) - Payable: Rs. {l.balances?.salaryPayable?.toLocaleString() || 0}
                </option>
              ))}
            </select>
          </div>

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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason Category</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none bg-white"
              >
                {DEDUCTION_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Deduction Amount (Rs.) <span className="text-[#E07A47]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">Rs.</span>
              <input
                type="number"
                placeholder="e.g. 1,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
                className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:border-[#2F6F6D] outline-none bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Explanation</label>
            <input
              type="text"
              placeholder="e.g. Broken water pipe fitting at site"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#C47C8A] hover:bg-[#b06775] rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Applying...' : 'Apply Deduction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
