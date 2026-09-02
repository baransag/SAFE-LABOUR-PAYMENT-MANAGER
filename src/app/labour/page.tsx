'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import {
  Users,
  Search,
  PlusCircle,
  Filter,
  CreditCard,
  Receipt,
  HandCoins,
  ChevronRight,
  UserCheck,
  UserX,
  Phone,
  ArrowUpDown
} from 'lucide-react';
import AddLabourModal from '@/components/modals/AddLabourModal';
import AddPaymentModal from '@/components/modals/AddPaymentModal';
import AddSalaryDueModal from '@/components/modals/AddSalaryDueModal';

export default function LabourDirectoryPage() {
  const [labours, setLabours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [salaryTypeFilter, setSalaryTypeFilter] = useState('');

  // Modals
  const [isAddLabourOpen, setIsAddLabourOpen] = useState(false);
  const [activePaymentLabourId, setActivePaymentLabourId] = useState<string | null>(null);
  const [activeSalaryDueLabourId, setActiveSalaryDueLabourId] = useState<string | null>(null);

  const fetchLabours = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);
      if (salaryTypeFilter) params.append('salaryType', salaryTypeFilter);

      const res = await fetch(`/api/labour?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLabours(data.labours);
      }
    } catch (err) {
      console.error('Error fetching labour:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLabours();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, statusFilter, salaryTypeFilter]);

  const handleToggleStatus = async (labourId: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/labour/${labourId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchLabours();
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#59718A] tracking-wider uppercase">
              <span>Workforce Ledger Registry</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Labour Management
            </h2>
            <p className="text-xs text-[#59718A] mt-1">
              Continuous registration, individual accounts, wage rates & real-time balances
            </p>
          </div>

          <button
            onClick={() => setIsAddLabourOpen(true)}
            className="px-4 py-2.5 bg-[#2F6F6D] hover:bg-[#285d5b] text-white text-xs font-bold rounded-2xl shadow-md shadow-[#2F6F6D]/20 transition flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add New Labour</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, father name, mobile, trade, or ID (e.g. LAB-0001)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:border-[#2F6F6D] focus:ring-2 focus:ring-[#2F6F6D]/15 outline-none font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white focus:border-[#2F6F6D] outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* Salary Type Filter */}
            <select
              value={salaryTypeFilter}
              onChange={(e) => setSalaryTypeFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white focus:border-[#2F6F6D] outline-none"
            >
              <option value="">All Rate Types</option>
              <option value="DAILY">Daily Rate (Rozana)</option>
              <option value="WEEKLY">Weekly Rate (Haftawar)</option>
            </select>
          </div>
        </div>

        {/* Labour List / Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900">
              Showing {labours.length} Registered Labour Profiles
            </div>
            <div className="text-xs text-[#59718A]">
              Click any row to inspect complete individual ledger
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading labour directory...</div>
          ) : labours.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Labour Records Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No labour matches the current search or filter. Register a new labour or reset filters.
              </p>
              <button
                onClick={() => setIsAddLabourOpen(true)}
                className="mt-4 px-4 py-2 bg-[#2F6F6D] text-white text-xs font-bold rounded-xl shadow-sm"
              >
                + Register First Labour
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/75 text-[#59718A] font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 sm:px-6">ID</th>
                    <th className="py-3.5 px-4">Labour & Trade</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Agreed Rate</th>
                    <th className="py-3.5 px-4 text-right">Salary Payable</th>
                    <th className="py-3.5 px-4 text-right">Outst. Advance</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {labours.map((l) => {
                    const payable = l.balances?.salaryPayable || 0;
                    const advance = l.balances?.outstandingAdvance || 0;

                    return (
                      <tr
                        key={l.id}
                        className="hover:bg-[#F2E9D8]/30 transition group cursor-pointer"
                        onClick={() => {
                          window.location.href = `/labour/${l.id}`;
                        }}
                      >
                        <td className="py-4 px-4 sm:px-6 font-mono font-bold text-[#59718A]">
                          {l.id}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-[#2F6F6D] transition">
                            {l.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {l.workType} {l.fatherName && `• s/o ${l.fatherName}`}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {l.mobile ? (
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {l.mobile}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No mobile</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-900">
                            Rs. {(l.salaryType === 'DAILY' ? l.dailyRate : l.weeklyRate).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-[#59718A] ml-1 uppercase">
                            /{l.salaryType.toLowerCase()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span
                            className={`font-black ${
                              payable > 0 ? 'text-[#E07A47]' : 'text-[#8FA68F]'
                            }`}
                          >
                            Rs. {payable.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span
                            className={`font-bold ${
                              advance > 0 ? 'text-[#D4A72C]' : 'text-slate-400'
                            }`}
                          >
                            Rs. {advance.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={(e) => handleToggleStatus(l.id, l.status, e)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                              l.status === 'ACTIVE'
                                ? 'bg-[#8FA68F]/20 text-[#2F6F6D] hover:bg-[#8FA68F]/30'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {l.status}
                          </button>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setActiveSalaryDueLabourId(l.id)}
                              title="Add Salary Due"
                              className="w-7 h-7 rounded-lg bg-[#E07A47]/15 text-[#E07A47] hover:bg-[#E07A47] hover:text-white transition flex items-center justify-center text-xs font-bold"
                            >
                              +Due
                            </button>
                            <button
                              onClick={() => setActivePaymentLabourId(l.id)}
                              title="Add Salary Payment"
                              className="w-7 h-7 rounded-lg bg-[#2F6F6D]/15 text-[#2F6F6D] hover:bg-[#2F6F6D] hover:text-white transition flex items-center justify-center text-xs font-bold"
                            >
                              +Pay
                            </button>
                            <Link
                              href={`/labour/${l.id}`}
                              className="p-1.5 text-slate-400 hover:text-slate-800 transition"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
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
      <AddLabourModal
        isOpen={isAddLabourOpen}
        onClose={() => setIsAddLabourOpen(false)}
        onSuccess={() => fetchLabours()}
      />
      <AddPaymentModal
        isOpen={Boolean(activePaymentLabourId)}
        onClose={() => setActivePaymentLabourId(null)}
        preSelectedLabourId={activePaymentLabourId || undefined}
        onSuccess={() => fetchLabours()}
      />
      <AddSalaryDueModal
        isOpen={Boolean(activeSalaryDueLabourId)}
        onClose={() => setActiveSalaryDueLabourId(null)}
        preSelectedLabourId={activeSalaryDueLabourId || undefined}
        onSuccess={() => fetchLabours()}
      />
    </AppShell>
  );
}
