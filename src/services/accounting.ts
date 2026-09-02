import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export interface LabourBalances {
  totalSalaryDue: number;
  totalSalaryPaid: number;
  totalAdvancesGiven: number;
  totalAdvanceAdjustments: number;
  totalDeductions: number;
  totalAdjustments: number;
  salaryPayable: number;
  outstandingAdvance: number;
  netPayable: number;
}

export interface LedgerEntry {
  id: string;
  transactionDate: Date;
  type: 'SALARY_DUE' | 'SALARY_PAYMENT' | 'ADVANCE_GIVEN' | 'ADVANCE_ADJUSTMENT' | 'DEDUCTION' | 'ADJUSTMENT';
  typeLabel: string;
  amount: number;
  paymentMethod: string;
  reference: string | null;
  remarks: string | null;
  helperUnits: number | null;
  helperRate: number | null;
  createdBy: string | null;
  runningSalaryPayable: number;
  runningOutstandingAdvance: number;
}

export function formatCurrency(amount: number | Prisma.Decimal | null | undefined): string {
  if (amount === null || amount === undefined) return 'Rs. 0';
  const num = typeof amount === 'number' ? amount : Number(amount);
  return 'Rs. ' + Math.round(num).toLocaleString('en-PK');
}

export function formatCurrencyExact(amount: number | Prisma.Decimal | null | undefined): string {
  if (amount === null || amount === undefined) return 'Rs. 0.00';
  const num = typeof amount === 'number' ? amount : Number(amount);
  return 'Rs. ' + num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function getLabourBalances(labourId: string): Promise<LabourBalances> {
  const transactions = await prisma.transaction.findMany({
    where: {
      labourId,
      isDeleted: false,
    },
    orderBy: {
      transactionDate: 'asc',
    },
  });

  let totalSalaryDue = 0;
  let totalSalaryPaid = 0;
  let totalAdvancesGiven = 0;
  let totalAdvanceAdjustments = 0;
  let totalDeductions = 0;
  let totalAdjustments = 0;

  for (const txn of transactions) {
    const amt = Number(txn.amount);
    switch (txn.type) {
      case 'SALARY_DUE':
        totalSalaryDue += amt;
        break;
      case 'SALARY_PAYMENT':
        totalSalaryPaid += amt;
        break;
      case 'ADVANCE_GIVEN':
        totalAdvancesGiven += amt;
        break;
      case 'ADVANCE_ADJUSTMENT':
        totalAdvanceAdjustments += amt;
        break;
      case 'DEDUCTION':
        totalDeductions += amt;
        break;
      case 'ADJUSTMENT':
        totalAdjustments += amt;
        break;
    }
  }

  // Salary Payable = Due - Paid - Advance Adjusted - Deductions + Misc Adjustments
  const salaryPayable = totalSalaryDue - totalSalaryPaid - totalAdvanceAdjustments - totalDeductions + totalAdjustments;

  // Outstanding Advance = Advances Given - Advance Adjustments
  const outstandingAdvance = totalAdvancesGiven - totalAdvanceAdjustments;

  // Net Payable position (if advance is adjusted against what is owed)
  const netPayable = salaryPayable - outstandingAdvance;

  return {
    totalSalaryDue,
    totalSalaryPaid,
    totalAdvancesGiven,
    totalAdvanceAdjustments,
    totalDeductions,
    totalAdjustments,
    salaryPayable,
    outstandingAdvance,
    netPayable,
  };
}

export async function getLabourLedger(labourId: string): Promise<LedgerEntry[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      labourId,
      isDeleted: false,
    },
    include: {
      createdBy: {
        select: { fullName: true, username: true },
      },
    },
    orderBy: [
      { transactionDate: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  let runningSalaryPayable = 0;
  let runningOutstandingAdvance = 0;

  const ledger: LedgerEntry[] = [];

  for (const txn of transactions) {
    const amt = Number(txn.amount);
    let typeLabel = '';

    switch (txn.type) {
      case 'SALARY_DUE':
        typeLabel = 'Salary Due';
        runningSalaryPayable += amt;
        break;

      case 'SALARY_PAYMENT':
        typeLabel = 'Salary Payment';
        runningSalaryPayable -= amt;
        break;

      case 'ADVANCE_GIVEN':
        typeLabel = 'Advance Given';
        runningOutstandingAdvance += amt;
        break;

      case 'ADVANCE_ADJUSTMENT':
        typeLabel = 'Advance Adjustment';
        runningSalaryPayable -= amt;
        runningOutstandingAdvance -= amt;
        break;

      case 'DEDUCTION':
        typeLabel = 'Deduction';
        runningSalaryPayable -= amt;
        break;

      case 'ADJUSTMENT':
        typeLabel = 'Adjustment';
        runningSalaryPayable += amt;
        break;

      default:
        typeLabel = txn.type;
        break;
    }

    ledger.push({
      id: txn.id,
      transactionDate: txn.transactionDate,
      type: txn.type as LedgerEntry['type'],
      typeLabel,
      amount: amt,
      paymentMethod: txn.paymentMethod,
      reference: txn.reference,
      remarks: txn.remarks,
      helperUnits: txn.helperUnits ? Number(txn.helperUnits) : null,
      helperRate: txn.helperRate ? Number(txn.helperRate) : null,
      createdBy: txn.createdBy?.fullName || txn.createdBy?.username || null,
      runningSalaryPayable,
      runningOutstandingAdvance,
    });
  }

  return ledger;
}

export async function getDashboardMetrics() {
  const [labourCounts, transactions] = await Promise.all([
    prisma.labour.groupBy({
      by: ['status'],
      where: { isDeleted: false },
      _count: { _all: true },
    }),
    prisma.transaction.findMany({
      where: { isDeleted: false },
      select: {
        type: true,
        amount: true,
      },
    }),
  ]);

  let totalLabour = 0;
  let activeLabour = 0;

  for (const group of labourCounts) {
    totalLabour += group._count._all;
    if (group.status === 'ACTIVE') {
      activeLabour += group._count._all;
    }
  }

  let totalSalaryDue = 0;
  let totalSalaryPaid = 0;
  let totalAdvancesGiven = 0;
  let totalAdvanceAdjustments = 0;
  let totalDeductions = 0;
  let totalAdjustments = 0;

  for (const txn of transactions) {
    const amt = Number(txn.amount);
    switch (txn.type) {
      case 'SALARY_DUE':
        totalSalaryDue += amt;
        break;
      case 'SALARY_PAYMENT':
        totalSalaryPaid += amt;
        break;
      case 'ADVANCE_GIVEN':
        totalAdvancesGiven += amt;
        break;
      case 'ADVANCE_ADJUSTMENT':
        totalAdvanceAdjustments += amt;
        break;
      case 'DEDUCTION':
        totalDeductions += amt;
        break;
      case 'ADJUSTMENT':
        totalAdjustments += amt;
        break;
    }
  }

  const salaryPayable = totalSalaryDue - totalSalaryPaid - totalAdvanceAdjustments - totalDeductions + totalAdjustments;
  const outstandingAdvances = totalAdvancesGiven - totalAdvanceAdjustments;

  return {
    totalLabour,
    activeLabour,
    salaryPayable,
    totalPaid: totalSalaryPaid,
    totalAdvances: totalAdvancesGiven,
    outstandingAdvances,
    totalDeductions,
    totalSalaryDue,
  };
}
