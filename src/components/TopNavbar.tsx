'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Shield, User, Building2, CheckCircle2 } from 'lucide-react';

interface TopNavbarProps {
  currentUser?: {
    id: string;
    username: string;
    fullName: string;
    role: string;
  } | null;
  onOpenQuickSearch?: () => void;
}

export default function TopNavbar({ currentUser, onOpenQuickSearch }: TopNavbarProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Office authorized staff team
  const officeStaff = [
    { name: 'Admin', role: 'Chief Exec / Admin', initials: 'AD', bg: '#5B3A62' },
    { name: 'Muneeb', role: 'Accounts Office', initials: 'MN', bg: '#2F6F6D' },
    { name: 'Husnain', role: 'Accounts Office', initials: 'HN', bg: '#59718A' },
    { name: 'Samaira', role: 'Accounts Office', initials: 'SM', bg: '#E07A47' },
  ];

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/labour?search=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.labours.slice(0, 5));
          setShowResults(true);
        }
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <header className="no-print w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-white p-1 flex items-center justify-center shadow-md border border-slate-200 shrink-0 overflow-hidden">
          <img src="/assest/logo.jpeg" alt="SAFE SOLUTIONS" className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">SAFE SOLUTIONS</h1>
            <span className="text-[11px] font-semibold tracking-wider uppercase bg-[#F2E9D8] text-[#59718A] px-2 py-0.5 rounded-md border border-[#59718A]/20">
              Office
            </span>
          </div>
          <p className="text-xs font-medium text-[#59718A]">House of Construction Solutions • Labour Payment Manager</p>
        </div>
      </div>

      {/* Center Search & Staff Carousel */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Global Labour Search */}
        <div className="relative w-full sm:w-72 md:w-80">
          <div className="flex items-center bg-white rounded-full px-3.5 py-2 border border-slate-200 shadow-sm focus-within:border-[#2F6F6D] focus-within:ring-2 focus-within:ring-[#2F6F6D]/15 transition">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search labour by name, ID, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
              className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent outline-none"
            />
            {isSearching && (
              <span className="text-[10px] text-slate-400 animate-pulse">...</span>
            )}
          </div>

          {/* Search Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-12 left-0 right-0 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Matching Labour
              </div>
              {searchResults.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setShowResults(false);
                    setSearchTerm('');
                    router.push(`/labour/${l.id}`);
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-[#F2E9D8]/50 flex items-center justify-between transition border-b border-slate-50 last:border-0"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{l.name}</span>
                      <span className="text-[10px] font-mono font-medium text-[#59718A] bg-slate-100 px-1.5 py-0.5 rounded">
                        {l.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {l.workType} • {l.mobile || 'No mobile'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#2F6F6D]">
                      {l.salaryType === 'DAILY' ? `Rs. ${l.dailyRate}/day` : `Rs. ${l.weeklyRate}/wk`}
                    </div>
                    <div className={`text-[10px] font-medium ${l.balances?.salaryPayable > 0 ? 'text-[#E07A47]' : 'text-[#8FA68F]'}`}>
                      {l.balances?.salaryPayable > 0 ? `Payable: Rs. ${l.balances.salaryPayable.toLocaleString()}` : 'Settled'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Authorized Office Staff Pill Carousel (Mockup Match) */}
        <div className="hidden lg:flex items-center bg-white/80 backdrop-blur-sm rounded-full p-1 border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold text-[#59718A] px-2.5">Staff:</span>
          <div className="flex items-center -space-x-1.5">
            {officeStaff.map((staff) => {
              const isCurrent = currentUser?.username?.toLowerCase().includes(staff.name.toLowerCase());
              return (
                <div
                  key={staff.name}
                  className="group relative cursor-pointer"
                  title={`${staff.name} (${staff.role})`}
                >
                  <div
                    className={`w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center ring-2 transition transform group-hover:scale-110 group-hover:z-10 ${
                      isCurrent ? 'ring-[#2F6F6D] ring-offset-1' : 'ring-white'
                    }`}
                    style={{ backgroundColor: staff.bg }}
                  >
                    {staff.initials}
                  </div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#161D26] text-white text-[10px] font-medium px-2 py-0.5 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap shadow-md z-50">
                    {staff.name} {isCurrent && '(You)'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current User Role Pill */}
        {currentUser && (
          <div className="flex items-center gap-2 bg-white rounded-full pl-2 pr-3.5 py-1.5 border border-slate-200 shadow-sm">
            <div
              className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center"
              style={{
                backgroundColor: currentUser.role === 'ADMIN' ? '#5B3A62' : '#2F6F6D',
              }}
            >
              {currentUser.fullName.slice(0, 1).toUpperCase()}
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs font-semibold text-slate-800">{currentUser.fullName}</div>
              <div className="text-[10px] font-medium text-[#59718A] uppercase tracking-wide">
                {currentUser.role}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
