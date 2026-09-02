import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getDashboardMetrics, getLabourBalances } from '@/services/accounting';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [metrics, recentTransactions, activeLabours] = await Promise.all([
      getDashboardMetrics(),
      prisma.transaction.findMany({
        where: { isDeleted: false },
        take: 8,
        orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          labour: { select: { id: true, name: true, workType: true } },
          createdBy: { select: { fullName: true } },
        },
      }),
      prisma.labour.findMany({
        where: { isDeleted: false, status: 'ACTIVE' },
        select: { id: true, name: true, workType: true, mobile: true, salaryType: true },
      }),
    ]);

    // Calculate balances for top lists
    const labourBalances = await Promise.all(
      activeLabours.map(async (l) => {
        const bal = await getLabourBalances(l.id);
        return {
          id: l.id,
          name: l.name,
          workType: l.workType,
          mobile: l.mobile,
          salaryType: l.salaryType,
          salaryPayable: bal.salaryPayable,
          outstandingAdvance: bal.outstandingAdvance,
          totalPaid: bal.totalSalaryPaid,
        };
      })
    );

    // Top 5 highest salary payable
    const topPayableLabour = [...labourBalances]
      .filter((l) => l.salaryPayable > 0)
      .sort((a, b) => b.salaryPayable - a.salaryPayable)
      .slice(0, 5);

    // Top 5 highest outstanding advances
    const topAdvanceHolders = [...labourBalances]
      .filter((l) => l.outstandingAdvance > 0)
      .sort((a, b) => b.outstandingAdvance - a.outstandingAdvance)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      metrics,
      recentTransactions: recentTransactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
      topPayableLabour,
      topAdvanceHolders,
    });
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
