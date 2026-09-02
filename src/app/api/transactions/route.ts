import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const labourId = searchParams.get('labourId') || '';
    const type = searchParams.get('type') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sort = searchParams.get('sort') || 'desc';

    const where: any = {
      isDeleted: false,
    };

    if (labourId) {
      where.labourId = labourId;
    }

    if (type) {
      where.type = type;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.transactionDate.lte = end;
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        labour: {
          select: { id: true, name: true, fatherName: true, workType: true, salaryType: true },
        },
        createdBy: {
          select: { fullName: true, username: true },
        },
      },
      orderBy: {
        transactionDate: sort === 'asc' ? 'asc' : 'desc',
      },
    });

    const formatted = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      helperUnits: t.helperUnits ? Number(t.helperUnits) : null,
      helperRate: t.helperRate ? Number(t.helperRate) : null,
    }));

    return NextResponse.json({ success: true, transactions: formatted });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role === 'VIEWER') {
      return NextResponse.json({ error: 'Viewers cannot create transactions.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      labourId,
      type,
      amount,
      paymentMethod = 'CASH',
      transactionDate,
      reference,
      remarks,
      helperUnits,
      helperRate,
    } = body;

    if (!labourId) {
      return NextResponse.json({ error: 'Labour is required.' }, { status: 400 });
    }

    const labour = await prisma.labour.findUnique({
      where: { id: labourId },
    });

    if (!labour || labour.isDeleted) {
      return NextResponse.json({ error: 'Labour record not found.' }, { status: 404 });
    }

    const validTypes = [
      'SALARY_DUE',
      'SALARY_PAYMENT',
      'ADVANCE_GIVEN',
      'ADVANCE_ADJUSTMENT',
      'DEDUCTION',
      'ADJUSTMENT',
    ];

    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ error: `Invalid transaction type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Transaction amount must be greater than zero.' }, { status: 400 });
    }

    // Generate Transaction ID: TXN-YYYYMMDD-XXXX
    const dateObj = transactionDate ? new Date(transactionDate) : new Date();
    const dateStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.transaction.count();
    const generatedId = `TXN-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const created = await prisma.transaction.create({
      data: {
        id: generatedId,
        labourId,
        type,
        amount: numericAmount,
        paymentMethod: ['SALARY_DUE', 'DEDUCTION', 'ADJUSTMENT'].includes(type) ? 'N/A' : (paymentMethod || 'CASH'),
        transactionDate: dateObj,
        reference: reference?.trim() || null,
        remarks: remarks?.trim() || null,
        helperUnits: helperUnits ? Number(helperUnits) : null,
        helperRate: helperRate ? Number(helperRate) : null,
        createdById: session.id,
      },
      include: {
        labour: { select: { name: true, workType: true } },
      },
    });

    await logAudit({
      userId: session.id,
      userName: session.fullName,
      action: 'TRANSACTION_CREATED',
      entityType: 'TRANSACTION',
      entityId: created.id,
      details: {
        labourId,
        labourName: labour.name,
        type,
        amount: numericAmount,
        paymentMethod,
        date: dateObj.toISOString(),
        remarks,
      },
    });

    return NextResponse.json({ success: true, transaction: created });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
  }
}
