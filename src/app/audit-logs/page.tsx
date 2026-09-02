'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { History, Search, ShieldCheck, Filter, Clock } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (actionFilter) params.append('action', actionFilter);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Audit logs error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, actionFilter]);

  const formatDetails = (detailsStr: string) => {
    try {
      const obj = JSON.parse(detailsStr);
      return Object.entries(obj)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join(' | ');
    } catch {
      return detailsStr;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#59718A] tracking-wider uppercase">
              <span>Security & Compliance</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Internal Audit Trail
            </h2>
            <p className="text-xs text-[#59718A] mt-1">
              Immutable logging of all labour edits, payments, advances, rate changes & staff logins
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#2F6F6D]/10 text-[#2F6F6D] px-3.5 py-2 rounded-2xl text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Protection Active</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by staff user, action, details, or record ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:border-[#2F6F6D] outline-none font-medium"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs font-semibold text-slate-700 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white"
          >
            <option value="">All Actions</option>
            <option value="LABOUR_CREATED">Labour Created</option>
            <option value="LABOUR_UPDATED">Labour Updated</option>
            <option value="RATE_CHANGED">Wage Rate Changed</option>
            <option value="TRANSACTION_CREATED">Transaction Recorded</option>
            <option value="TRANSACTION_UPDATED">Transaction Edited</option>
            <option value="TRANSACTION_DELETED">Transaction Deleted</option>
            <option value="USER_LOGIN">Staff Login</option>
          </select>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900">
              {logs.length} Recorded Events (Last 100)
            </div>
            <div className="text-[11px] text-[#59718A]">Source of truth audit log</div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading audit history...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No audit records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/75 text-[#59718A] font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 sm:px-6">Timestamp</th>
                    <th className="py-3 px-4">Authorized User</th>
                    <th className="py-3 px-4">Action Event</th>
                    <th className="py-3 px-4">Record / Entity</th>
                    <th className="py-3 px-4 sm:px-6">Event Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F2E9D8]/30 transition">
                      <td className="py-3 px-4 sm:px-6 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-PK')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900">{log.userName}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-[#59718A]">
                        {log.entityId}
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-slate-600 text-[11px] max-w-md truncate">
                        {formatDetails(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
