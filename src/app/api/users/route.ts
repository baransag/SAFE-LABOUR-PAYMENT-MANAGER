import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 403 });
    }

    const { username, fullName, role, password } = await request.json();
    if (!username || !fullName || !password) {
      return NextResponse.json({ error: 'Username, full name, and password are required.' }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (existing) {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
        username: cleanUsername,
        fullName: fullName.trim(),
        role: role || 'ACCOUNTS',
        passwordHash,
        isActive: true,
      },
      select: { id: true, username: true, fullName: true, role: true, isActive: true },
    });

    await logAudit({
      userId: session.id,
      userName: session.fullName,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: created.id,
      details: { username: created.username, role: created.role },
    });

    return NextResponse.json({ success: true, user: created });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
