import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getLabourBalances, getLabourLedger } from '@/services/accounting';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'labour-payment';
    const labourId = searchParams.get('labourId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const hasDate = startDate || endDate;

    switch (reportType) {
      case 'individual-statement': {
        if (!labourId) {
          return NextResponse.json({ error: 'Labour is required for individual statement.' }, { status: 400 });
        }
        const labour = await prisma.labour.findUnique({
          where: { id: labourId },
          include: { rates: { orderBy: { effectiveFrom: 'desc' }, take: 1 } },
        });
        if (!labour) {
          return NextResponse.json({ error: 'Labour not found' }, { status: 404 });
        }
        const balances = await getLabourBalances(labourId);
        const fullLedger = await getLabourLedger(labourId);

        // Filter ledger by period if provided
        const filteredLedger = fullLedger.filter((entry) => {
          const d = new Date(entry.transactionDate).getTime();
          if (startDate && d < new Date(startDate).getTime()) return false;
          if (endDate && d > new Date(endDate).getTime() + 86400000) return false;
          return true;
        });

        return NextResponse.json({
          success: true,
          reportType,
          labour: {
            id: labour.id,
            name: labour.name,
            fatherName: labour.fatherName,
            mobile: labour.mobile,
            workType: labour.workType,
            salaryType: labour.salaryType,
            dailyRate: Number(labour.dailyRate),
            weeklyRate: Number(labour.weeklyRate),
          },
          period: { startDate, endDate },
          balances,
          ledger: filteredLedger,
        });
      }

      case 'labour-payment': {
        const where: any = { isDeleted: false, type: 'SALARY_PAYMENT' };
        if (labourId) where.labourId = labourId;
        if (hasDate) where.transactionDate = dateFilter;

        const payments = await prisma.transaction.findMany({
          where,
          include: {
            labour: { select: { id: true, name: true, workType: true } },
            createdBy: { select: { fullName: true } },
          },
          orderBy: { transactionDate: 'desc' },
        });

        const totalAmount = payments.reduce((acc, p) => acc + Number(p.amount), 0);

        return NextResponse.json({
          success: true,
          reportType,
          totalAmount,
          count: payments.length,
          data: payments.map((p) => ({
            ...p,
            amount: Number(p.amount),
          })),
        });
      }

      case 'daily-payment': {
        const where: any = { isDeleted: false, type: 'SALARY_PAYMENT' };
        if (hasDate) where.transactionDate = dateFilter;

        const payments = await prisma.transaction.findMany({
          where,
          include: { labour: { select: { name: true } } },
          orderBy: { transactionDate: 'desc' },
        });

        const grouped: Record<string, { date: string; total: number; count: number }> = {};
        for (const p of payments) {
          const d = p.transactionDate.toISOString().slice(0, 10);
          if (!grouped[d]) grouped[d] = { date: d, total: 0, count: 0 };
          grouped[d].total += Number(p.amount);
          grouped[d].count += 1;
        }

        return NextResponse.json({
          success: true,
          reportType,
          data: Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date)),
        });
      }

      case 'advance': {
        const where: any = {
          isDeleted: false,
          type: { in: ['ADVANCE_GIVEN', 'ADVANCE_ADJUSTMENT'] },
        };
        if (labourId) where.labourId = labourId;
        if (hasDate) where.transactionDate = dateFilter;

        const records = await prisma.transaction.findMany({
          where,
          include: {
            labour: { select: { id: true, name: true, workType: true } },
            createdBy: { select: { fullName: true } },
          },
          orderBy: { transactionDate: 'desc' },
        });

        let totalGiven = 0;
        let totalAdjusted = 0;

        for (const r of records) {
          if (r.type === 'ADVANCE_GIVEN') totalGiven += Number(r.amount);
          if (r.type === 'ADVANCE_ADJUSTMENT') totalAdjusted += Number(r.amount);
        }

        return NextResponse.json({
          success: true,
          reportType,
          totalGiven,
          totalAdjusted,
          outstanding: totalGiven - totalAdjusted,
          data: records.map((r) => ({ ...r, amount: Number(r.amount) })),
        });
      }

      case 'deduction': {
        const where: any = { isDeleted: false, type: 'DEDUCTION' };
        if (labourId) where.labourId = labourId;
        if (hasDate) where.transactionDate = dateFilter;

        const records = await prisma.transaction.findMany({
          where,
          include: {
            labour: { select: { id: true, name: true, workType: true } },
            createdBy: { select: { fullName: true } },
          },
          orderBy: { transactionDate: 'desc' },
        });

        const totalDeductions = records.reduce((acc, r) => acc + Number(r.amount), 0);

        return NextResponse.json({
          success: true,
          reportType,
          totalDeductions,
          data: records.map((r) => ({ ...r, amount: Number(r.amount) })),
        });
      }

      case 'outstanding-balance': {
        const labours = await prisma.labour.findMany({
          where: { isDeleted: false },
          select: { id: true, name: true, fatherName: true, mobile: true, workType: true, salaryType: true, status: true },
        });

        const balancesList = await Promise.all(
          labours.map(async (l) => {
            const bal = await getLabourBalances(l.id);
            return {
              ...l,
              ...bal,
            };
          })
        );

        const filtered = balancesList.filter((b) => b.salaryPayable !== 0 || b.outstandingAdvance !== 0);

        return NextResponse.json({
          success: true,
          reportType,
          data: filtered,
        });
      }

      case 'payment-method': {
        const where: any = {
          isDeleted: false,
          type: { in: ['SALARY_PAYMENT', 'ADVANCE_GIVEN'] },
        };
        if (hasDate) where.transactionDate = dateFilter;

        const transactions = await prisma.transaction.findMany({
          where,
          select: { paymentMethod: true, amount: true, type: true },
        });

        const breakdown: Record<string, { method: string; count: number; total: number }> = {};
        for (const t of transactions) {
          const m = t.paymentMethod || 'OTHER';
          if (!breakdown[m]) breakdown[m] = { method: m, count: 0, total: 0 };
          breakdown[m].count += 1;
          breakdown[m].total += Number(t.amount);
        }

        return NextResponse.json({
          success: true,
          reportType,
          data: Object.values(breakdown),
        });
      }

      default:
        return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
