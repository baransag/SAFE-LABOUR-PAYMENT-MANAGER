'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import {
  CreditCard,
  Receipt,
  HandCoins,
  ArrowRightLeft,
  MinusCircle,
  PlusCircle,
  Search,
  Filter,
  Download,
  Calendar,
  Trash2,
  Edit2,
  AlertCircle
} from 'lucide-react';
import AddSalaryDueModal from '@/components/modals/AddSalaryDueModal';
import AddPaymentModal from '@/components/modals/AddPaymentModal';
import AddAdvanceModal from '@/components/modals/AddAdvanceModal';

export default function PaymentsMasterPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isSalaryDueOpen, setIsSalaryDueOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (paymentMethodFilter) params.append('paymentMethod', paymentMethodFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, paymentMethodFilter, startDate, endDate]);

  const exportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['Transaction ID', 'Date', 'Labour ID', 'Labour Name', 'Type', 'Amount (Rs)', 'Method', 'Reference', 'Remarks', 'Recorded By'];
    const rows = transactions.map((t) => [
      t.id,
      new Date(t.transactionDate).toISOString().slice(0, 10),
      t.labourId,
      `"${t.labour?.name || ''}"`,
      t.type,
      t.amount,
      t.paymentMethod,
      `"${t.reference || ''}"`,
      `"${t.remarks || ''}"`,
      `"${t.createdBy?.fullName || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `safe_solutions_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteTransaction = async (txnId: string, labourName: string) => {
    const confirmReason = window.prompt(
      `Are you sure you want to soft-delete transaction ${txnId} for ${labourName}? Please enter deletion reason for audit log:`
    );
    if (!confirmReason) return;

    try {
      const res = await fetch(`/api/transactions/${txnId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteReason: confirmReason }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchTransactions();
      } else {
        alert(data.error || 'Failed to delete transaction');
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#59718A] tracking-wider uppercase">
              <span>Financial Ledger Ledger Book</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Payments & Transactions
            </h2>
            <p className="text-xs text-[#59718A] mt-1">
              Audit trail of all salary dues, payments, advances, adjustments & deductions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsSalaryDueOpen(true)}
              className="px-3.5 py-2.5 bg-[#E07A47] hover:bg-[#c96939] text-white text-xs font-bold rounded-2xl shadow-md shadow-[#E07A47]/20 transition flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4" />
              <span>+ Salary Due</span>
            </button>

            <button
              onClick={() => setIsPaymentOpen(true)}
              className="px-3.5 py-2.5 bg-[#2F6F6D] hover:bg-[#285d5b] text-white text-xs font-bold rounded-2xl shadow-md shadow-[#2F6F6D]/20 transition flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>+ Add Payment</span>
            </button>

            <button
              onClick={() => setIsAdvanceOpen(true)}
              className="px-3.5 py-2.5 bg-[#D4A72C] hover:bg-[#b89024] text-white text-xs font-bold rounded-2xl shadow-md shadow-[#D4A72C]/20 transition flex items-center gap-1.5"
            >
              <HandCoins className="w-4 h-4" />
              <span>+ Advance</span>
            </button>

            <button
              onClick={exportCSV}
              className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl shadow-sm transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-[#2F6F6D]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
          {/* Type Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: 'All Events', val: '' },
              { label: 'Salary Due', val: 'SALARY_DUE' },
              { label: 'Salary Payments', val: 'SALARY_PAYMENT' },
              { label: 'Advances Given', val: 'ADVANCE_GIVEN' },
              { label: 'Adv. Adjustments', val: 'ADVANCE_ADJUSTMENT' },
              { label: 'Deductions', val: 'DEDUCTION' },
            ].map((tab) => (
              <button
                key={tab.val}
                onClick={() => setTypeFilter(tab.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  typeFilter === tab.val
                    ? 'bg-[#2F6F6D] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Range & Payment Method Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 rounded-xl border border-slate-200 text-xs text-slate-700"
              />
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 rounded-xl border border-slate-200 text-xs text-slate-700"
              />
            </div>

            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">All Payment Methods</option>
              <option value="CASH">Cash</option>
              <option value="BANK">Bank</option>
              <option value="JAZZCASH">JazzCash</option>
              <option value="EASYPAISA">Easypaisa</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900">
              Found {transactions.length} Transactions
            </div>
            <div className="text-xs text-[#59718A]">
              Total Volume: Rs.{' '}
              {transactions
                .reduce((acc, t) => acc + Number(t.amount), 0)
                .toLocaleString()}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading ledger records...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No transactions match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/75 text-[#59718A] font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 sm:px-6">Txn ID</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Labour Name</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">Remarks / Ref</th>
                    <th className="py-3.5 px-4">Staff</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {transactions.map((txn) => {
                    const isDue = txn.type === 'SALARY_DUE';
                    const isPayment = txn.type === 'SALARY_PAYMENT';
                    const isAdvance = txn.type === 'ADVANCE_GIVEN';
                    const isAdjustment = txn.type === 'ADVANCE_ADJUSTMENT';
                    const isDeduction = txn.type === 'DEDUCTION';

                    return (
                      <tr key={txn.id} className="hover:bg-[#F2E9D8]/30 transition">
                        <td className="py-3.5 px-4 sm:px-6 font-mono text-[11px] text-[#59718A]">
                          {txn.id}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                          {new Date(txn.transactionDate).toLocaleDateString('en-PK')}
                        </td>
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/labour/${txn.labourId}`}
                            className="font-bold text-slate-900 hover:text-[#2F6F6D] transition"
                          >
                            {txn.labour?.name || 'Unknown'}
                          </Link>
                          <div className="text-[10px] text-slate-400">{txn.labourId}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                            {txn.type.replace('_', ' ')}
                          </span>
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
                            Rs. {txn.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {txn.paymentMethod !== 'N/A' ? txn.paymentMethod : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{txn.remarks || '—'}</div>
                          {txn.reference && (
                            <div className="text-[10px] text-slate-400">Ref: {txn.reference}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {txn.createdBy?.fullName || 'Office'}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <button
                            onClick={() => handleDeleteTransaction(txn.id, txn.labour?.name || '')}
                            title="Soft delete transaction with audit log"
                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddSalaryDueModal
        isOpen={isSalaryDueOpen}
        onClose={() => setIsSalaryDueOpen(false)}
        onSuccess={() => fetchTransactions()}
      />
      <AddPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={() => fetchTransactions()}
      />
      <AddAdvanceModal
        isOpen={isAdvanceOpen}
        onClose={() => setIsAdvanceOpen(false)}
        onSuccess={() => fetchTransactions()}
      />
    </AppShell>
  );
}
