'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { ShieldCheck, UserPlus, Users, Key, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('ACCOUNTS');
  const [password, setPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!username.trim() || !fullName.trim() || !password) {
      setFormError('All fields are required.');
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          fullName: fullName.trim(),
          role,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setUsername('');
      setFullName('');
      setPassword('');
      setIsAddOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#59718A] tracking-wider uppercase">
              <span>Admin Control Center</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Authorized Office Staff
            </h2>
            <p className="text-xs text-[#59718A] mt-1">
              Manage office credentials, roles, and administrative access for SAFE SOLUTIONS team
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 bg-[#2F6F6D] hover:bg-[#285d5b] text-white text-xs font-bold rounded-2xl shadow-md shadow-[#2F6F6D]/20 transition flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Office User</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Add User Modal */}
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <h3 className="text-base font-bold text-slate-900 mb-1">Create Authorized User</h3>
              <p className="text-xs text-[#59718A] mb-4">Add new staff account for office management</p>

              {formError && (
                <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-600 text-xs">{formError}</div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    placeholder="e.g. ali_accounts"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ali Ahmed"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Permission</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="ACCOUNTS">ACCOUNTS (Labour + Payments + Reports)</option>
                    <option value="ADMIN">ADMIN (Full Control + Staff Management)</option>
                    <option value="VIEWER">VIEWER (Read-Only Statements)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-[#2F6F6D] outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-[#2F6F6D] text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    {formLoading ? 'Creating...' : 'Save User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900">
              Active Authorized Office Staff ({users.length})
            </div>
            <div className="text-xs text-[#59718A]">
              Role-based access control enabled
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/75 text-[#59718A] font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 sm:px-6">Staff Member</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Role Access</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 sm:px-6">Created On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F2E9D8]/30 transition">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center"
                          style={{ backgroundColor: u.role === 'ADMIN' ? '#5B3A62' : '#2F6F6D' }}
                        >
                          {u.fullName.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.fullName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-600">@{u.username}</td>
                    <td className="py-4 px-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: u.role === 'ADMIN' ? '#5B3A6218' : '#2F6F6D18',
                          color: u.role === 'ADMIN' ? '#5B3A62' : '#2F6F6D',
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#8FA68F] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-slate-500 font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString('en-PK')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
