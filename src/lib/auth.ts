import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from './prisma';
import bcrypt from 'bcryptjs';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'safe-solutions-secret-key-32-chars-long-2026'
);

const SESSION_COOKIE_NAME = 'safe_session';

export interface UserSession {
  id: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'ACCOUNTS' | 'VIEWER';
}

export async function createSession(user: UserSession) {
  const jwt = await new SignJWT({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return jwt;
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      username: payload.username as string,
      fullName: payload.fullName as string,
      role: payload.role as 'ADMIN' | 'ACCOUNTS' | 'VIEWER',
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function authenticateUser(username: string, passwordPlain: string) {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase().trim() },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role as 'ADMIN' | 'ACCOUNTS' | 'VIEWER',
  };
}
