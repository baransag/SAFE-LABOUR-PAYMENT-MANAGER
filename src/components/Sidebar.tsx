'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileSpreadsheet,
  History,
  ShieldCheck,
  LogOut,
  Building2,
  Receipt,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  userRole?: string;
  userName?: string;
}

export default function Sidebar({ userRole = 'ACCOUNTS' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Labour Directory', href: '/labour', icon: Users },
    { label: 'Payments & Ledgers', href: '/payments', icon: CreditCard },
    { label: 'Reports & Statements', href: '/reports', icon: FileSpreadsheet },
    { label: 'Audit Trail', href: '/audit-logs', icon: History },
  ];

  if (userRole === 'ADMIN') {
    navItems.push({ label: 'Staff Management', href: '/admin/users', icon: ShieldCheck });
  }

  return (
    <aside className="no-print fixed left-4 top-4 bottom-4 w-20 bg-[#161D26] text-white rounded-3xl flex flex-col items-center py-6 shadow-2xl z-40 transition-all duration-300">
      {/* Brand Icon */}
      <Link
        href="/"
        className="w-12 h-12 rounded-2xl bg-[#2F6F6D] hover:bg-[#285d5b] flex items-center justify-center mb-8 shadow-lg shadow-[#2F6F6D]/30 transition group relative"
        title="SAFE SOLUTIONS - Labour Payment Manager"
      >
        <Building2 className="w-6 h-6 text-[#F2E9D8]" />
        <span className="absolute left-16 bg-[#161D26] text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition whitespace-nowrap shadow-md border border-slate-700">
          SAFE SOLUTIONS
        </span>
      </Link>

      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col gap-3 w-full px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full aspect-square rounded-2xl flex items-center justify-center transition group relative ${
                isActive
                  ? 'bg-[#2F6F6D] text-white shadow-md shadow-[#2F6F6D]/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="absolute left-16 bg-[#161D26] text-white text-xs font-medium px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition whitespace-nowrap shadow-md border border-slate-700 z-50">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-3 w-full px-3 pt-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full aspect-square rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#E07A47] hover:bg-slate-800/60 transition group relative"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
          <span className="absolute left-16 bg-[#161D26] text-[#E07A47] text-xs font-medium px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition whitespace-nowrap shadow-md border border-slate-700 z-50">
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
