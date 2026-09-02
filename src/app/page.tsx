'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import {
  Users,
  CreditCard,
  HandCoins,
  Receipt,
  MinusCircle,
  PlusCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ArrowRightLeft,
  ChevronRight,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import AddLabourModal from '@/components/modals/AddLabourModal';
import AddSalaryDueModal from '@/components/modals/AddSalaryDueModal';
import AddPaymentModal from '@/components/modals/AddPaymentModal';
import AddAdvanceModal from '@/components/modals/AddAdvanceModal';
import AddDeductionModal from '@/components/modals/AddDeductionModal';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Quick Action Modals
  const [isAddLabourOpen, setIsAddLabourOpen] = useState(false);
  const [isAddSalaryDueOpen, setIsAddSalaryDueOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isAddAdvanceOpen, setIsAddAdvanceOpen] = useState(false);
  const [isAddDeductionOpen, setIsAddDeductionOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      const [dashRes, userRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/auth/me'),
      ]);

      const dashData = await dashRes.json();
      const userData = await userRes.json();

      if (dashData.success) {
        setData(dashData);
      }
      if (userData.authenticated) {
        setCurrentUser(userData.user);
      }
    } catch (err) {
      console.error('Error loading dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const metrics = data?.metrics || {
    totalLabour: 0,
    activeLabour: 0,
    salaryPayable: 0,
    totalPaid: 0,
    totalAdvances: 0,
    outstandingAdvances: 0,
    totalDeductions: 0,
    totalSalaryDue: 0,
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'SALARY_DUE':
        return { label: 'Salary Due', bg: 'bg-[#E07A47]/15 text-[#E07A47]', prefix: '+' };
      case 'SALARY_PAYMENT':
        return { label: 'Payment', bg: 'bg-[#2F6F6D]/15 text-[#2F6F6D]', prefix: '-' };
      case 'ADVANCE_GIVEN':
        return { label: 'Advance', bg: 'bg-[#D4A72C]/20 text-[#9E7310]', prefix: 'Adv' };
      case 'ADVANCE_ADJUSTMENT':
        return { label: 'Adv. Adjusted', bg: 'bg-[#59718A]/15 text-[#59718A]', prefix: 'Adj' };
      case 'DEDUCTION':
        return { label: 'Deduction', bg: 'bg-[#C47C8A]/20 text-[#9C4B5B]', prefix: '-' };
      default:
        return { label: type, bg: 'bg-slate-100 text-slate-700', prefix: '' };
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Greeting & Quick Actions Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#59718A] tracking-wider uppercase">
              <span>Office Financial Console</span>
              <span>•</span>
              <span className="text-[#2F6F6D]">Safe Solutions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Hello, {currentUser?.fullName || 'Office Staff'}
            </h2>
            <p className="text-xs text-[#59718A] mt-1">
              Record labour payments, advances, salary dues & individual ledgers
            </p>
          </div>

          {/* Quick Action Pills (Immediately accessible) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddLabourOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-[#2F6F6D] hover:bg-[#285d5b] text-white text-xs font-bold shadow-md shadow-[#2F6F6D]/25 transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Labour</span>
            </button>

            <button
              onClick={() => setIsAddSalaryDueOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-[#E07A47] hover:bg-[#c96939] text-white text-xs font-bold shadow-md shadow-[#E07A47]/25 transition flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4" />
              <span>+ Add Salary Due</span>
            </button>

            <button
              onClick={() => setIsAddPaymentOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-[#59718A] hover:bg-[#495e73] text-white text-xs font-bold shadow-md shadow-[#59718A]/25 transition flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>+ Add Payment</span>
            </button>

            <button
              onClick={() => setIsAddAdvanceOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-[#D4A72C] hover:bg-[#b89024] text-white text-xs font-bold shadow-md shadow-[#D4A72C]/25 transition flex items-center gap-1.5"
            >
              <HandCoins className="w-4 h-4" />
              <span>+ Add Advance</span>
            </button>

            <button
              onClick={() => setIsAddDeductionOpen(true)}
              className="px-3 py-2 rounded-2xl bg-[#C47C8A] hover:bg-[#b06775] text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <MinusCircle className="w-4 h-4" />
              <span>+ Deduction</span>
            </button>
          </div>
        </div>

        {/* 6 Core Financial KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {/* Card 1: TOTAL LABOUR */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#59718A] uppercase tracking-wider">Total Labour</span>
              <div className="w-8 h-8 rounded-xl bg-[#2F6F6D]/10 text-[#2F6F6D] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">{metrics.totalLabour}</div>
              <div className="text-[10px] font-semibold text-[#8FA68F] mt-0.5">
                {metrics.activeLabour} Active on sites
              </div>
            </div>
          </div>

          {/* Card 2: SALARY PAYABLE (Terracotta #E07A47) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#E07A47]/30 shadow-sm flex flex-col justify-between hover:shadow-md transition bg-gradient-to-br from-white to-[#E07A47]/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#E07A47] uppercase tracking-wider">Salary Payable</span>
              <div className="w-8 h-8 rounded-xl bg-[#E07A47]/20 text-[#E07A47] flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                Rs. {metrics.salaryPayable.toLocaleString()}
              </div>
              <div className="text-[10px] font-semibold text-[#E07A47] mt-0.5">
                Owed against salary dues
              </div>
            </div>
          </div>

          {/* Card 3: TOTAL PAID (Sage Green #8FA68F) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#59718A] uppercase tracking-wider">Total Paid</span>
              <div className="w-8 h-8 rounded-xl bg-[#8FA68F]/20 text-[#2F6F6D] flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                Rs. {metrics.totalPaid.toLocaleString()}
              </div>
              <div className="text-[10px] font-semibold text-[#8FA68F] mt-0.5">
                Salary payments cleared
              </div>
            </div>
          </div>

          {/* Card 4: TOTAL ADVANCES (Mustard #D4A72C) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#59718A] uppercase tracking-wider">Total Advances</span>
              <div className="w-8 h-8 rounded-xl bg-[#D4A72C]/20 text-[#9E7310] flex items-center justify-center">
                <HandCoins className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                Rs. {metrics.totalAdvances.toLocaleString()}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                Lifetime advances given
              </div>
            </div>
          </div>

          {/* Card 5: OUTSTANDING ADVANCES (Slate Blue #59718A) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#59718A] uppercase tracking-wider">Outst. Advance</span>
              <div className="w-8 h-8 rounded-xl bg-[#59718A]/20 text-[#59718A] flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                Rs. {metrics.outstandingAdvances.toLocaleString()}
              </div>
              <div className="text-[10px] font-semibold text-[#59718A] mt-0.5">
                Unadjusted advance balance
              </div>
            </div>
          </div>

          {/* Card 6: TOTAL DEDUCTIONS (Dusty Rose #C47C8A) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#59718A] uppercase tracking-wider">Deductions</span>
              <div className="w-8 h-8 rounded-xl bg-[#C47C8A]/20 text-[#9C4B5B] flex items-center justify-center">
                <MinusCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                Rs. {metrics.totalDeductions.toLocaleString()}
              </div>
              <div className="text-[10px] font-semibold text-[#C47C8A] mt-0.5">
                Penalties & recoveries
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Visual Rows (Matching Reference Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Balance Breakdown & Recent Transactions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Statistics Banner (Reference Match) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-[#59718A] uppercase tracking-wider">
                    Ledger Balance Statistics
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    Rs. {metrics.salaryPayable.toLocaleString()}
                  </div>
                  <div className="text-xs text-[#59718A] mt-1">
                    Total outstanding salary liability owed across all active workforce
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-[#F2E9D8]/50 p-3 rounded-2xl border border-[#F2E9D8]">
                  <div className="text-right">
                    <div className="text-[11px] font-semibold text-slate-500">Unsettled Advances</div>
                    <div className="text-base font-bold text-[#D4A72C]">
                      Rs. {metrics.outstandingAdvances.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-[#D4A72C]/20 text-[#9E7310] flex items-center justify-center">
                    <HandCoins className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Graphical Trend / Breakdown Pills */}
              <div className="pt-5 grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500">Total Salary Due</div>
                  <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                    Rs. {metrics.totalSalaryDue.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#8FA68F]/10 border border-[#8FA68F]/20">
                  <div className="text-[11px] font-semibold text-[#2F6F6D]">Disbursed Payments</div>
                  <div className="text-sm sm:text-base font-black text-[#2F6F6D] mt-0.5">
                    Rs. {metrics.totalPaid.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#C47C8A]/10 border border-[#C47C8A]/20">
                  <div className="text-[11px] font-semibold text-[#9C4B5B]">Total Deductions</div>
                  <div className="text-sm sm:text-base font-black text-[#9C4B5B] mt-0.5">
                    Rs. {metrics.totalDeductions.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions Stream */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Recent Financial Activity</h3>
                  <p className="text-xs text-[#59718A]">Latest recorded payments, dues, and advances</p>
                </div>
                <Link
                  href="/payments"
                  className="text-xs font-bold text-[#2F6F6D] hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="mt-4 divide-y divide-slate-50">
                {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                  data.recentTransactions.map((txn: any) => {
                    const badge = getTransactionBadge(txn.type);
                    return (
                      <Link
                        key={txn.id}
                        href={`/labour/${txn.labourId}`}
                        className="py-3 px-2 flex items-center justify-between hover:bg-[#F2E9D8]/30 rounded-2xl transition group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${badge.bg}`}>
                            {badge.prefix}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#2F6F6D] transition flex items-center gap-2">
                              <span>{txn.labour?.name || 'Labour'}</span>
                              <span className="text-[10px] font-normal text-slate-400">
                                ({txn.labourId})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {new Date(txn.transactionDate).toLocaleDateString('en-PK', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}{' '}
                              • {badge.label} • {txn.paymentMethod !== 'N/A' ? txn.paymentMethod : ''}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-black text-slate-900">
                            Rs. {txn.amount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {txn.remarks || 'No remarks'}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No transaction activity recorded yet. Click &apos;+ Add Labour&apos; or &apos;+ Add Salary Due&apos; to begin.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Company Credit Card + Top Payable Workforce */}
          <div className="space-y-6">
            {/* SAFE SOLUTIONS Construction Corporate Card (Mockup Match) */}
            <div className="rounded-3xl p-6 text-white shadow-xl relative overflow-hidden bg-gradient-to-br from-[#2F6F6D] via-[#59718A] to-[#161D26]">
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold tracking-widest uppercase text-[#F2E9D8]">
                    SAFE SOLUTIONS
                  </div>
                  <div className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-xs font-semibold">
                    Construction Finance
                  </div>
                </div>

                <div className="mt-8">
                  <div className="text-[10px] font-semibold text-slate-200">Current Salary Payable Liability</div>
                  <div className="text-2xl font-black tracking-tight text-[#F2E9D8] mt-0.5">
                    Rs. {metrics.salaryPayable.toLocaleString()}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-xs text-slate-200 pt-4 border-t border-white/15">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-300">Office Manager</div>
                    <div className="font-bold text-white">{currentUser?.fullName || 'Chief Executive'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-wider text-slate-300">Active Workforce</div>
                    <div className="font-bold text-white">{metrics.activeLabour} Workers</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Outstanding Salary Due Labour */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top Salary Payable</h4>
                  <p className="text-[11px] text-[#59718A]">Highest unpaid salary dues</p>
                </div>
                <Link href="/labour" className="text-[11px] font-bold text-[#2F6F6D] hover:underline">
                  All Labour
                </Link>
              </div>

              <div className="mt-3 space-y-2.5">
                {data?.topPayableLabour && data.topPayableLabour.length > 0 ? (
                  data.topPayableLabour.map((l: any) => (
                    <Link
                      key={l.id}
                      href={`/labour/${l.id}`}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-[#F2E9D8]/50 flex items-center justify-between transition group border border-slate-100"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-[#2F6F6D]">
                          {l.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {l.workType} • {l.salaryType === 'DAILY' ? 'Daily' : 'Weekly'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-[#E07A47]">
                          Rs. {l.salaryPayable.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">Payable</div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No outstanding salary liabilities currently.
                  </div>
                )}
              </div>
            </div>

            {/* Outstanding Advances Widget */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active Advances</h4>
                  <p className="text-[11px] text-[#59718A]">Workers holding advance cash</p>
                </div>
                <Link href="/reports?type=advance" className="text-[11px] font-bold text-[#D4A72C] hover:underline">
                  Advance Report
                </Link>
              </div>

              <div className="mt-3 space-y-2.5">
                {data?.topAdvanceHolders && data.topAdvanceHolders.length > 0 ? (
                  data.topAdvanceHolders.map((l: any) => (
                    <Link
                      key={l.id}
                      href={`/labour/${l.id}`}
                      className="p-3 rounded-2xl bg-[#D4A72C]/5 hover:bg-[#D4A72C]/15 flex items-center justify-between transition group border border-[#D4A72C]/20"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-[#2F6F6D]">
                          {l.name}
                        </div>
                        <div className="text-[10px] text-slate-500">{l.workType}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-[#D4A72C]">
                          Rs. {l.outstandingAdvance.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">Outstanding</div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400">
                    Zero outstanding advances currently given.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals triggered from Dashboard quick action pills */}
      <AddLabourModal
        isOpen={isAddLabourOpen}
        onClose={() => setIsAddLabourOpen(false)}
        onSuccess={() => fetchDashboard()}
      />
      <AddSalaryDueModal
        isOpen={isAddSalaryDueOpen}
        onClose={() => setIsAddSalaryDueOpen(false)}
        onSuccess={() => fetchDashboard()}
      />
      <AddPaymentModal
        isOpen={isAddPaymentOpen}
        onClose={() => setIsAddPaymentOpen(false)}
        onSuccess={() => fetchDashboard()}
      />
      <AddAdvanceModal
        isOpen={isAddAdvanceOpen}
        onClose={() => setIsAddAdvanceOpen(false)}
        onSuccess={() => fetchDashboard()}
      />
      <AddDeductionModal
        isOpen={isAddDeductionOpen}
        onClose={() => setIsAddDeductionOpen(false)}
        onSuccess={() => fetchDashboard()}
      />
    </AppShell>
  );
}
