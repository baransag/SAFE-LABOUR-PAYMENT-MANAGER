'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import AddLabourModal from './modals/AddLabourModal';
import AddSalaryDueModal from './modals/AddSalaryDueModal';
import AddPaymentModal from './modals/AddPaymentModal';
import AddAdvanceModal from './modals/AddAdvanceModal';
import AddAdvanceAdjustmentModal from './modals/AddAdvanceAdjustmentModal';
import AddDeductionModal from './modals/AddDeductionModal';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Global Modals State
  const [isAddLabourOpen, setIsAddLabourOpen] = useState(false);
  const [isAddSalaryDueOpen, setIsAddSalaryDueOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isAddAdvanceOpen, setIsAddAdvanceOpen] = useState(false);
  const [isAddAdjustmentOpen, setIsAddAdjustmentOpen] = useState(false);
  const [isAddDeductionOpen, setIsAddDeductionOpen] = useState(false);

  useEffect(() => {
    // Skip auth check on login page
    if (pathname === '/login') {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!res.ok || !data.authenticated) {
          router.push('/login');
        } else {
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error('Session error', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F0E8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#2F6F6D]/30 border-t-[#2F6F6D] rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#59718A]">Loading SAFE SOLUTIONS Office...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F0E8] flex">
      {/* Floating Pill Sidebar */}
      <Sidebar userRole={currentUser?.role} userName={currentUser?.fullName} />

      {/* Main Content Area */}
      <main className="flex-1 ml-0 sm:ml-28 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto transition-all">
        <TopNavbar currentUser={currentUser} />

        {/* Child Pages */}
        {children}

        {/* Global Modals */}
        <AddLabourModal
          isOpen={isAddLabourOpen}
          onClose={() => setIsAddLabourOpen(false)}
          onSuccess={(labour) => {
            router.push(`/labour/${labour.id}`);
            router.refresh();
          }}
        />

        <AddSalaryDueModal
          isOpen={isAddSalaryDueOpen}
          onClose={() => setIsAddSalaryDueOpen(false)}
          onSuccess={() => {
            router.refresh();
          }}
        />

        <AddPaymentModal
          isOpen={isAddPaymentOpen}
          onClose={() => setIsAddPaymentOpen(false)}
          onSuccess={() => {
            router.refresh();
          }}
        />

        <AddAdvanceModal
          isOpen={isAddAdvanceOpen}
          onClose={() => setIsAddAdvanceOpen(false)}
          onSuccess={() => {
            router.refresh();
          }}
        />

        <AddAdvanceAdjustmentModal
          isOpen={isAddAdjustmentOpen}
          onClose={() => setIsAddAdjustmentOpen(false)}
          onSuccess={() => {
            router.refresh();
          }}
        />

        <AddDeductionModal
          isOpen={isAddDeductionOpen}
          onClose={() => setIsAddDeductionOpen(false)}
          onSuccess={() => {
            router.refresh();
          }}
        />
      </main>
    </div>
  );
}
