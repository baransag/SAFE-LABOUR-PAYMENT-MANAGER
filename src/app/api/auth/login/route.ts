import { NextResponse } from 'next/server';
import { authenticateUser, createSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Please provide both username and password.' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(username, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password, or account is deactivated.' },
        { status: 401 }
      );
    }

    await createSession(user);

    await logAudit({
      userId: user.id,
      userName: user.fullName,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      details: { username: user.username, role: user.role },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}
