import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role === 'VIEWER') {
      return NextResponse.json({ error: 'Unauthorized to edit financial records' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.transaction.findUnique({
      where: { id },
      include: { labour: true },
    });

    if (!existing || existing.isDeleted) {
      return NextResponse.json({ error: 'Transaction record not found' }, { status: 404 });
    }

    const body = await request.json();
    const { amount, paymentMethod, transactionDate, reference, remarks, editReason } = body;

    const newAmount = amount !== undefined ? Number(amount) : Number(existing.amount);
    if (isNaN(newAmount) || newAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero.' }, { status: 400 });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        amount: newAmount,
        paymentMethod: paymentMethod || existing.paymentMethod,
        transactionDate: transactionDate ? new Date(transactionDate) : existing.transactionDate,
        reference: reference !== undefined ? reference?.trim() : existing.reference,
        remarks: remarks !== undefined ? remarks?.trim() : existing.remarks,
      },
    });

    await logAudit({
      userId: session.id,
      userName: session.fullName,
      action: 'TRANSACTION_UPDATED',
      entityType: 'TRANSACTION',
      entityId: id,
      details: {
        labourId: existing.labourId,
        labourName: existing.labour.name,
        type: existing.type,
        previousAmount: Number(existing.amount),
        newAmount,
        editReason: editReason || 'Office record amendment',
      },
    });

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) {
    console.error('Error editing transaction:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role === 'VIEWER') {
      return NextResponse.json({ error: 'Unauthorized to delete financial transactions' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.transaction.findUnique({
      where: { id },
      include: { labour: true },
    });

    if (!existing || existing.isDeleted) {
      return NextResponse.json({ error: 'Transaction record not found' }, { status: 404 });
    }

    const { deleteReason } = await request.json().catch(() => ({ deleteReason: 'Deleted by office staff' }));

    await prisma.transaction.update({
      where: { id },
      data: { isDeleted: true },
    });

    await logAudit({
      userId: session.id,
      userName: session.fullName,
      action: 'TRANSACTION_DELETED',
      entityType: 'TRANSACTION',
      entityId: id,
      details: {
        labourId: existing.labourId,
        labourName: existing.labour.name,
        type: existing.type,
        amount: Number(existing.amount),
        reason: deleteReason,
      },
    });

    return NextResponse.json({ success: true, message: 'Transaction record soft-deleted with audit trail.' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
