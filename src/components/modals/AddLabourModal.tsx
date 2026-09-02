'use client';

import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AddLabourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (labour: any) => void;
}

const COMMON_WORK_TYPES = [
  'Mason (Mistri)',
  'Helper (Labour)',
  'Electrician',
  'Plumber',
  'Carpenter (Shuttering)',
  'Steel Fixer',
  'Painter',
  'Tile Mason',
  'Welder',
  'Site Supervisor',
];

export default function AddLabourModal({ isOpen, onClose, onSuccess }: AddLabourModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    mobile: '',
    workType: 'Mason (Mistri)',
    salaryType: 'DAILY',
    dailyRate: '',
    weeklyRate: '',
    startDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customWorkType, setCustomWorkType] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter labour name.');
      return;
    }

    const finalWorkType = formData.workType === 'Other' ? customWorkType.trim() : formData.workType;
    if (!finalWorkType) {
      setError('Please specify work type / trade.');
      return;
    }

    const dRate = parseFloat(formData.dailyRate) || 0;
    const wRate = parseFloat(formData.weeklyRate) || 0;

    if (formData.salaryType === 'DAILY' && dRate <= 0) {
      setError('Please enter a valid daily rate.');
      return;
    }

    if (formData.salaryType === 'WEEKLY' && wRate <= 0) {
      setError('Please enter a valid weekly rate.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/labour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          workType: finalWorkType,
          dailyRate: dRate,
          weeklyRate: wRate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create labour record.');
      }

      if (onSuccess) {
        onSuccess(data.labour);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2F6F6D]/10 text-[#2F6F6D] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add New Labour</h2>
              <p className="text-xs text-[#59718A]">Create profile & ledger account in &lt; 1 min</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-[#E07A47]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Muhammad Ali"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#2F6F6D] focus:ring-2 focus:ring-[#2F6F6D]/15 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Father Name</label>
              <input
                type="text"
                placeholder="e.g. Abdul Rahman"
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#2F6F6D] focus:ring-2 focus:ring-[#2F6F6D]/15 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                placeholder="e.g. 0300-1234567"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#2F6F6D] focus:ring-2 focus:ring-[#2F6F6D]/15 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Type / Trade <span className="text-[#E07A47]">*</span>
              </label>
              <select
                value={formData.workType}
                onChange={(e) => setFormData({ ...formData, workType: e.target.value })}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#2F6F6D] focus:ring-2 focus:ring-[#2F6F6D]/15 outline-none bg-white"
              >
                {COMMON_WORK_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value="Other">Other Trade...</option>
              </select>
            </div>
          </div>

          {formData.workType === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Trade</label>
              <input
                type="text"
                placeholder="Enter trade name..."
                value={customWorkType}
                onChange={(e) => setCustomWorkType(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none"
              />
            </div>
          )}

          {/* Salary Type Selector */}
          <div className="bg-[#F2E9D8]/40 p-4 rounded-2xl border border-[#F2E9D8]">
            <label className="block text-xs font-bold text-slate-800 mb-2">Salary Rate Agreement</label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="radio"
                  name="salaryType"
                  value="DAILY"
                  checked={formData.salaryType === 'DAILY'}
                  onChange={() => setFormData({ ...formData, salaryType: 'DAILY' })}
                  className="text-[#2F6F6D] focus:ring-[#2F6F6D]"
                />
                <span>Daily Wage (Rozana)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="radio"
                  name="salaryType"
                  value="WEEKLY"
                  checked={formData.salaryType === 'WEEKLY'}
                  onChange={() => setFormData({ ...formData, salaryType: 'WEEKLY' })}
                  className="text-[#2F6F6D] focus:ring-[#2F6F6D]"
                />
                <span>Weekly Rate (Haftawar)</span>
              </label>
            </div>

            {formData.salaryType === 'DAILY' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily Rate (Rs. / day) <span className="text-[#E07A47]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-semibold">Rs.</span>
                  <input
                    type="number"
                    placeholder="e.g. 2,000"
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                    required
                    min="0"
                    step="50"
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-[#2F6F6D] focus:ring-2 focus:ring-[#2F6F6D]/15 outline-none font-semibold text-slate-900"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Weekly Rate (Rs. / week) <span className="text-[#E07A47]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-semibold">Rs.</span>
                  <input
                    type="number"
                    placeholder="e.g. 15,000"
                    value={formData.weeklyRate}
                    onChange={(e) => setFormData({ ...formData, weeklyRate: e.target.value })}
                    required
                    min="0"
                    step="100"
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-[#2F6F6D] focus:ring-2 focus:ring-[#2F6F6D]/15 outline-none font-semibold text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Joining / Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
              <input
                type="text"
                placeholder="Optional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {loading ? 'Saving Labour...' : 'Save & Open Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
