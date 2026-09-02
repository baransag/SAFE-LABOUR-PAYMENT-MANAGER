import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getLabourBalances, getLabourLedger } from '@/services/accounting';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const labour = await prisma.labour.findUnique({
      where: { id },
      include: {
        rates: {
          orderBy: { effectiveFrom: 'desc' },
        },
      },
    });

    if (!labour || labour.isDeleted) {
      return NextResponse.json({ error: 'Labour record not found' }, { status: 404 });
    }

    const balances = await getLabourBalances(id);
    const ledger = await getLabourLedger(id);

    return NextResponse.json({
      success: true,
      labour: {
        ...labour,
        dailyRate: Number(labour.dailyRate),
        weeklyRate: Number(labour.weeklyRate),
        rates: labour.rates.map((r) => ({
          ...r,
          rate: Number(r.rate),
        })),
        balances,
        ledger,
      },
    });
  } catch (error) {
    console.error('Error fetching labour profile:', error);
    return NextResponse.json({ error: 'Failed to fetch labour profile' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role === 'VIEWER') {
      return NextResponse.json({ error: 'Viewers cannot update labour records.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.labour.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      return NextResponse.json({ error: 'Labour record not found' }, { status: 404 });
    }

    const {
      name,
      fatherName,
      mobile,
      workType,
      salaryType,
      dailyRate,
      weeklyRate,
      status,
      notes,
      rateChangeReason,
      effectiveFrom,
    } = body;

    const newDailyRate = dailyRate !== undefined ? Number(dailyRate) : Number(existing.dailyRate);
    const newWeeklyRate = weeklyRate !== undefined ? Number(weeklyRate) : Number(existing.weeklyRate);

    const oldRate = existing.salaryType === 'DAILY' ? Number(existing.dailyRate) : Number(existing.weeklyRate);
    const newRate = salaryType === 'DAILY' ? newDailyRate : newWeeklyRate;

    const hasRateChanged = oldRate !== newRate || existing.salaryType !== salaryType;

    const updated = await prisma.$transaction(async (tx) => {
      // If rate has changed, create rate history record with effective date
      if (hasRateChanged) {
        const effectiveDate = effectiveFrom ? new Date(effectiveFrom) : new Date();

        // Close out previous rate history record's effectiveTo if needed
        await tx.labourRateHistory.create({
          data: {
            labourId: id,
            salaryType: salaryType || existing.salaryType,
            rate: newRate,
            effectiveFrom: effectiveDate,
            reason: rateChangeReason?.trim() || 'Rate update from office',
            changedBy: session.fullName,
          },
        });
      }

      return tx.labour.update({
        where: { id },
        data: {
          name: name ? name.trim() : existing.name,
          fatherName: fatherName !== undefined ? fatherName?.trim() : existing.fatherName,
          mobile: mobile !== undefined ? mobile?.trim() : existing.mobile,
          workType: workType ? workType.trim() : existing.workType,
          salaryType: salaryType || existing.salaryType,
          dailyRate: newDailyRate,
          weeklyRate: newWeeklyRate,
          status: status || existing.status,
          notes: notes !== undefined ? notes?.trim() : existing.notes,
        },
      });
    });

    await logAudit({
      userId: session.id,
      userName: session.fullName,
      action: hasRateChanged ? 'RATE_CHANGED' : 'LABOUR_UPDATED',
      entityType: 'LABOUR',
      entityId: id,
      details: {
        previous: {
          name: existing.name,
          dailyRate: Number(existing.dailyRate),
          weeklyRate: Number(existing.weeklyRate),
          status: existing.status,
        },
        updated: {
          name: updated.name,
          dailyRate: newDailyRate,
          weeklyRate: newWeeklyRate,
          status: updated.status,
          hasRateChanged,
          reason: rateChangeReason,
        },
      },
    });

    return NextResponse.json({ success: true, labour: updated });
  } catch (error) {
    console.error('Error updating labour:', error);
    return NextResponse.json({ error: 'Failed to update labour record' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only administrators can delete labour records.' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.labour.findUnique({ where: { id } });

    if (!existing || existing.isDeleted) {
      return NextResponse.json({ error: 'Labour record not found' }, { status: 404 });
    }

    await prisma.labour.update({
      where: { id },
      data: { isDeleted: true },
    });

    await logAudit({
      userId: session.id,
      userName: session.fullName,
      action: 'LABOUR_DELETED',
      entityType: 'LABOUR',
      entityId: id,
      details: { name: existing.name, reason: 'Soft deleted by admin' },
    });

    return NextResponse.json({ success: true, message: 'Labour record deleted.' });
  } catch (error) {
    console.error('Error deleting labour:', error);
    return NextResponse.json({ error: 'Failed to delete labour record' }, { status: 500 });
  }
}
