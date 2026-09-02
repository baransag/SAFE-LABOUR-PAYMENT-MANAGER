import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getLabourBalances } from '@/services/accounting';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const salaryType = searchParams.get('salaryType') || '';
    const workType = searchParams.get('workType') || '';

    const where: any = {
      isDeleted: false,
    };

    if (status) {
      where.status = status;
    }

    if (salaryType) {
      where.salaryType = salaryType;
    }

    if (workType) {
      where.workType = workType;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { id: { contains: q } },
        { name: { contains: q } },
        { fatherName: { contains: q } },
        { mobile: { contains: q } },
        { workType: { contains: q } },
      ];
    }

    const labours = await prisma.labour.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Compute live accounting balances for each labour
    const results = await Promise.all(
      labours.map(async (l) => {
        const balances = await getLabourBalances(l.id);
        return {
          ...l,
          dailyRate: Number(l.dailyRate),
          weeklyRate: Number(l.weeklyRate),
          balances,
        };
      })
    );

    return NextResponse.json({ success: true, labours: results });
  } catch (error) {
    console.error('Error fetching labour:', error);
    return NextResponse.json({ error: 'Failed to fetch labour list' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role === 'VIEWER') {
      return NextResponse.json({ error: 'Viewers cannot create labour records.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      fatherName,
      mobile,
      workType,
      salaryType,
      dailyRate = 0,
      weeklyRate = 0,
      startDate,
      notes,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Labour name is required.' }, { status: 400 });
    }

    if (!workType || !workType.trim()) {
      return NextResponse.json({ error: 'Work type / trade is required.' }, { status: 400 });
    }

    if (!salaryType || !['DAILY', 'WEEKLY'].includes(salaryType)) {
      return NextResponse.json({ error: 'Valid salary type (Daily or Weekly) is required.' }, { status: 400 });
    }

    const parsedDailyRate = Number(dailyRate) || 0;
    const parsedWeeklyRate = Number(weeklyRate) || 0;

    if (parsedDailyRate < 0 || parsedWeeklyRate < 0) {
      return NextResponse.json({ error: 'Rates cannot be negative.' }, { status: 400 });
    }

    // Generate unique sequential Labour ID: LAB-0001, LAB-0002...
    const count = await prisma.labour.count();
    let nextNum = count + 1;
    let generatedId = `LAB-${String(nextNum).padStart(4, '0')}`;

    // Verify collision safety
    let exists = await prisma.labour.findUnique({ where: { id: generatedId } });
    while (exists) {
      nextNum += 1;
      generatedId = `LAB-${String(nextNum).padStart(4, '0')}`;
      exists = await prisma.labour.findUnique({ where: { id: generatedId } });
    }

    const startDateTime = startDate ? new Date(startDate) : new Date();

    const createdLabour = await prisma.labour.create({
      data: {
        id: generatedId,
        name: name.trim(),
        fatherName: fatherName?.trim() || null,
        mobile: mobile?.trim() || null,
        workType: workType.trim(),
        salaryType,
        dailyRate: parsedDailyRate,
        weeklyRate: parsedWeeklyRate,
        startDate: startDateTime,
        status: 'ACTIVE',
        notes: notes?.trim() || null,
        rates: {
          create: {
            salaryType,
            rate: salaryType === 'DAILY' ? parsedDailyRate : parsedWeeklyRate,
            effectiveFrom: startDateTime,
            reason: 'Initial Rate on Registration',
            changedBy: session.fullName,
          },
        },
      },
    });

    await logAudit({
      userId: session.id,
      userName: session.fullName,
      action: 'LABOUR_CREATED',
      entityType: 'LABOUR',
      entityId: createdLabour.id,
      details: {
        name: createdLabour.name,
        workType: createdLabour.workType,
        salaryType: createdLabour.salaryType,
        dailyRate: parsedDailyRate,
        weeklyRate: parsedWeeklyRate,
      },
    });

    return NextResponse.json({ success: true, labour: createdLabour });
  } catch (error) {
    console.error('Error creating labour:', error);
    return NextResponse.json({ error: 'Failed to create labour record.' }, { status: 500 });
  }
}
