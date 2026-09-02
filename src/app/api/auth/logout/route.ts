import { NextResponse } from 'next/server';
import { getSession, destroySession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST() {
  try {
    const session = await getSession();
    if (session) {
      await logAudit({
        userId: session.id,
        userName: session.fullName,
        action: 'USER_LOGOUT',
        entityType: 'USER',
        entityId: session.id,
        details: { username: session.username },
      });
    }

    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to log out.' }, { status: 500 });
  }
}
