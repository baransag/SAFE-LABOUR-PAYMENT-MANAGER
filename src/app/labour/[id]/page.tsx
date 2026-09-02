'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import {
  Users,
  CreditCard,
  Receipt,
  HandCoins,
  ArrowRightLeft,
  MinusCircle,
  TrendingUp,
  Printer,
  History,
  Phone,
  Calendar,
  Building2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  FileText
} from 'lucide-react';
import AddSalaryDueModal from '@/components/modals/AddSalaryDueModal';
import AddPaymentModal from '@/components/modals/AddPaymentModal';
import AddAdvanceModal from '@/components/modals/AddAdvanceModal';
import AddAdvanceAdjustmentModal from '@/components/modals/AddAdvanceAdjustmentModal';
import AddDeductionModal from '@/components/modals/AddDeductionModal';
import RateChangeModal from '@/components/modals/RateChangeModal';

export default function LabourProfilePage() {
  const params = useParams();
  const router = useRouter();
  const labourId = params.id as string;

  const [labour, setLabour] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isSalaryDueOpen, setIsSalaryDueOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isDeductionOpen, setIsDeductionOpen] = useState(false);
  const [isRateChangeOpen, setIsRateChangeOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/labour/${labourId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load labour profile');
      }
      setLabour(data.labour);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (labourId) fetchProfile();
  }, [labourId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-16 text-center text-xs text-slate-400">Loading labour ledger profile...</div>
      </AppShell>
    );
  }

  if (error || !labour) {
    return (
      <AppShell>
        <div className="p-8 max-w-lg mx-auto bg-white rounded-3xl border border-red-100 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">Labour Record Not Found</h3>
          <p className="text-xs text-slate-500 mt-1">{error || 'Could not locate labour ID.'}</p>
          <Link
            href="/labour"
            className="mt-4 inline-block px-4 py-2 bg-[#2F6F6D] text-white text-xs font-bold rounded-xl"
          >
            Back to Directory
          </Link>
        </div>
      </AppShell>
    );
  }

  const balances = labour.balances || {};
  const currentRate = labour.salaryType === 'DAILY' ? labour.dailyRate : labour.weeklyRate;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation & Action Bar */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/labour"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#59718A] hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Labour Directory</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsSalaryDueOpen(true)}
              className="px-3.5 py-2 bg-[#E07A47] hover:bg-[#c96939] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>+ Add Salary Due</span>
            </button>

            <button
              onClick={() => setIsPaymentOpen(true)}
              className="px-3.5 py-2 bg-[#2F6F6D] hover:bg-[#285d5b] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>+ Add Payment</span>
            </button>

            <button
              onClick={() => setIsAdvanceOpen(true)}
              className="px-3.5 py-2 bg-[#D4A72C] hover:bg-[#b89024] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <HandCoins className="w-3.5 h-3.5" />
              <span>+ Add Advance</span>
            </button>

            {balances.outstandingAdvance > 0 && (
              <button
                onClick={() => setIsAdjustmentOpen(true)}
                className="px-3.5 py-2 bg-[#59718A] hover:bg-[#475b70] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Adjust Advance</span>
              </button>
            )}

            <button
              onClick={() => setIsDeductionOpen(true)}
              className="px-3.5 py-2 bg-[#C47C8A] hover:bg-[#b06775] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>+ Deduction</span>
            </button>

            <button
              onClick={() => setIsRateChangeOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Update Rate</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-[#2F6F6D]" />
              <span>Print Statement</span>
            </button>
          </div>
        </div>

        {/* Printable Official Statement Header (Appears only on print / top of statement) */}
        <div className="hidden print:block p-6 border-b-2 border-slate-900 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">SAFE SOLUTIONS</h1>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                House of Construction Solutions
              </p>
              <p className="text-xs text-slate-500">Official Office Labour Statement & Payment Ledger</p>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-slate-900">Date: {new Date().toLocaleDateString('en-PK')}</div>
              <div className="text-slate-500 font-mono">Labour ID: {labour.id}</div>
            </div>
          </div>
        </div>

        {/* Labour Profile Card & Dual Balances */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            {/* Identity */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#2F6F6D]/15 text-[#2F6F6D] flex items-center justify-center font-black text-lg shadow-sm">
                {labour.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">{labour.name}</h2>
                  <span className="font-mono text-xs font-bold text-[#59718A] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {labour.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      labour.status === 'ACTIVE' ? 'bg-[#8FA68F]/20 text-[#2F6F6D]' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {labour.status}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  {labour.fatherName && <span>s/o {labour.fatherName}</span>}
                  <span className="font-semibold text-slate-700">Trade: {labour.workType}</span>
                  {labour.mobile && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {labour.mobile}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Joined {new Date(labour.startDate).toLocaleDateString('en-PK')}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Agreed Wage Rate */}
            <div className="p-4 rounded-2xl bg-[#F2E9D8]/50 border border-[#F2E9D8] text-right shrink-0">
              <div className="text-[11px] font-bold text-[#59718A] uppercase tracking-wider">
                Current Agreed Wage Rate
              </div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                Rs. {currentRate.toLocaleString()}{' '}
                <span className="text-xs font-bold text-[#59718A] uppercase">
                  /{labour.salaryType.toLowerCase()}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {labour.salaryType === 'DAILY' ? 'Daily Rate' : 'Weekly Rate'}
              </div>
            </div>
          </div>

          {/* Core Dual Balances Row (Crucial Accounting Feature) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-6">
            {/* 1. Salary Payable */}
            <div className="p-4 rounded-2xl bg-[#E07A47]/10 border border-[#E07A47]/30">
              <div className="text-[10px] font-bold text-[#E07A47] uppercase tracking-wider">
                Salary Payable
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                Rs. {(balances.salaryPayable || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-[#E07A47] font-semibold mt-0.5">
                {balances.salaryPayable > 0 ? 'Owed to labour' : 'Settled in full'}
              </div>
            </div>

            {/* 2. Outstanding Advance */}
            <div className="p-4 rounded-2xl bg-[#D4A72C]/10 border border-[#D4A72C]/30">
              <div className="text-[10px] font-bold text-[#9E7310] uppercase tracking-wider">
                Outstanding Advance
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                Rs. {(balances.outstandingAdvance || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                {balances.outstandingAdvance > 0 ? 'Unadjusted advance' : 'Zero advance'}
              </div>
            </div>

            {/* 3. Total Salary Due */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-[#59718A] uppercase tracking-wider">
                Total Salary Due
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                Rs. {(balances.totalSalaryDue || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">Recorded earned dues</div>
            </div>

            {/* 4. Total Paid */}
            <div className="p-4 rounded-2xl bg-[#8FA68F]/15 border border-[#8FA68F]/30">
              <div className="text-[10px] font-bold text-[#2F6F6D] uppercase tracking-wider">
                Total Salary Paid
              </div>
              <div className="text-lg sm:text-xl font-black text-[#2F6F6D] mt-1">
                Rs. {(balances.totalSalaryPaid || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-[#8FA68F] font-semibold mt-0.5">Disbursed cash/bank</div>
            </div>

            {/* 5. Total Advances Given */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-[#59718A] uppercase tracking-wider">
                Total Advances Given
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                Rs. {(balances.totalAdvancesGiven || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">Lifetime advances</div>
            </div>

            {/* 6. Total Deductions */}
            <div className="p-4 rounded-2xl bg-[#C47C8A]/10 border border-[#C47C8A]/25">
              <div className="text-[10px] font-bold text-[#9C4B5B] uppercase tracking-wider">
                Total Deductions
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                Rs. {(balances.totalDeductions || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-[#C47C8A] font-semibold mt-0.5">Penalties & offsets</div>
            </div>
          </div>
        </div>

        {/* Rate History Timeline (Preserves past salary rates) */}
        {labour.rates && labour.rates.length > 0 && (
          <div className="no-print bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#2F6F6D]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Wage Rate Agreement History
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Changing rate never modifies past payment records
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {labour.rates.map((r: any, idx: number) => (
                <div
                  key={r.id || idx}
                  className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2.5"
                >
                  <span className="font-bold text-[#2F6F6D]">
                    Rs. {r.rate.toLocaleString()} / {r.salaryType.toLowerCase()}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    From {new Date(r.effectiveFrom).toLocaleDateString('en-PK')}
                  </span>
                  {r.reason && (
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      {r.reason}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete Individual Ledger Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print-card">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Individual Financial Ledger</h3>
              <p className="text-xs text-[#59718A]">
                Complete chronological transaction history with running balances
              </p>
            </div>
            <div className="text-xs font-bold text-slate-500">
              {labour.ledger?.length || 0} Financial Events
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-[#59718A] font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 sm:px-6">Date</th>
                  <th className="py-3 px-4">Transaction Type</th>
                  <th className="py-3 px-4">Description / Reference</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount (Rs.)</th>
                  <th className="py-3 px-4 text-right">Salary Payable</th>
                  <th className="py-3 px-4 text-right">Outst. Advance</th>
                  <th className="py-3 px-4 text-slate-400">By Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {labour.ledger && labour.ledger.length > 0 ? (
                  labour.ledger.map((entry: any) => {
                    const isDue = entry.type === 'SALARY_DUE';
                    const isPayment = entry.type === 'SALARY_PAYMENT';
                    const isAdvance = entry.type === 'ADVANCE_GIVEN';
                    const isAdjustment = entry.type === 'ADVANCE_ADJUSTMENT';
                    const isDeduction = entry.type === 'DEDUCTION';

                    return (
                      <tr key={entry.id} className="hover:bg-[#F2E9D8]/30 transition">
                        <td className="py-3.5 px-4 sm:px-6 font-mono text-slate-600 whitespace-nowrap">
                          {new Date(entry.transactionDate).toLocaleDateString('en-PK', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isDue
                                ? 'bg-[#E07A47]/15 text-[#E07A47]'
                                : isPayment
                                ? 'bg-[#2F6F6D]/15 text-[#2F6F6D]'
                                : isAdvance
                                ? 'bg-[#D4A72C]/20 text-[#9E7310]'
                                : isAdjustment
                                ? 'bg-[#59718A]/15 text-[#59718A]'
                                : 'bg-[#C47C8A]/20 text-[#9C4B5B]'
                            }`}
                          >
                            {entry.typeLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <div>{entry.remarks || entry.reference || '—'}</div>
                          {entry.helperUnits && (
                            <div className="text-[10px] text-slate-400 italic">
                              Helper: {entry.helperUnits} units @ Rs. {entry.helperRate}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {entry.paymentMethod !== 'N/A' ? entry.paymentMethod : '—'}
                          {entry.reference && entry.remarks && (
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({entry.reference})
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black">
                          <span
                            className={
                              isDue
                                ? 'text-[#E07A47]'
                                : isPayment
                                ? 'text-[#2F6F6D]'
                                : isAdvance
                                ? 'text-[#D4A72C]'
                                : isDeduction
                                ? 'text-[#C47C8A]'
                                : 'text-slate-800'
                            }
                          >
                            {isDue ? '+ ' : isPayment || isDeduction ? '- ' : ''}
                            Rs. {entry.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          Rs. {entry.runningSalaryPayable.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#D4A72C]">
                          Rs. {entry.runningOutstandingAdvance.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {entry.createdBy || 'Office'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-xs text-slate-400">
                      No financial transactions recorded for this labour yet. Click one of the buttons above to record a salary due, payment, or advance.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Ledger Totals Footer */}
          <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-[#59718A]">
              Official Statement prepared by SAFE SOLUTIONS Office Console
            </div>
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-slate-500">Salary Payable:</span>{' '}
                <strong className="text-[#E07A47] font-black text-sm">
                  Rs. {(balances.salaryPayable || 0).toLocaleString()}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Outstanding Advance:</span>{' '}
                <strong className="text-[#D4A72C] font-black text-sm">
                  Rs. {(balances.outstandingAdvance || 0).toLocaleString()}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Printable Signature Line for Office Management */}
        <div className="hidden print:grid grid-cols-2 gap-12 pt-16 text-xs text-slate-600">
          <div className="border-t border-slate-400 pt-2">
            <div>Office Accountant Signature</div>
            <div className="text-[10px] text-slate-400">SAFE SOLUTIONS Office Staff</div>
          </div>
          <div className="border-t border-slate-400 pt-2 text-right">
            <div>Approved By / Chief Executive</div>
            <div className="text-[10px] text-slate-400">House of Construction Solutions</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddSalaryDueModal
        isOpen={isSalaryDueOpen}
        onClose={() => setIsSalaryDueOpen(false)}
        preSelectedLabourId={labour.id}
        onSuccess={() => fetchProfile()}
      />
      <AddPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        preSelectedLabourId={labour.id}
        onSuccess={() => fetchProfile()}
      />
      <AddAdvanceModal
        isOpen={isAdvanceOpen}
        onClose={() => setIsAdvanceOpen(false)}
        preSelectedLabourId={labour.id}
        onSuccess={() => fetchProfile()}
      />
      <AddAdvanceAdjustmentModal
        isOpen={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        preSelectedLabourId={labour.id}
        onSuccess={() => fetchProfile()}
      />
      <AddDeductionModal
        isOpen={isDeductionOpen}
        onClose={() => setIsDeductionOpen(false)}
        preSelectedLabourId={labour.id}
        onSuccess={() => fetchProfile()}
      />
      <RateChangeModal
        isOpen={isRateChangeOpen}
        onClose={() => setIsRateChangeOpen(false)}
        labour={labour}
        onSuccess={() => fetchProfile()}
      />
    </AppShell>
  );
}
