import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const isVercel = Boolean(process.env.VERCEL);

function getDatabaseUrl(): string {
  // If user provided a remote database URL (e.g. Postgres, Turso, Supabase)
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
    return process.env.DATABASE_URL;
  }

  // On Vercel, the only writable directory is /tmp
  if (isVercel) {
    const tmpDbPath = path.join('/tmp', 'safe_solutions.db');

    if (!fs.existsSync(tmpDbPath)) {
      // Look for the source database file bundled with the project
      const possibleSources = [
        path.join(process.cwd(), 'prisma', 'safe_solutions.db'),
        path.join(process.cwd(), 'safe_solutions.db'),
      ];

      let copied = false;
      for (const src of possibleSources) {
        if (fs.existsSync(/*turbopackIgnore: true*/ src)) {
          try {
            fs.copyFileSync(src, tmpDbPath);
            copied = true;
            console.log(`[Prisma] Copied database from ${src} to ${tmpDbPath}`);
            break;
          } catch (e) {
            console.error(`[Prisma] Failed to copy db from ${src}:`, e);
          }
        }
      }

      if (!copied) {
        console.log(`[Prisma] No existing db file found. New database will be created at ${tmpDbPath}`);
      }
    }

    return `file:${tmpDbPath}`;
  }

  // Local development / server
  const localDb = path.join(process.cwd(), 'prisma', 'safe_solutions.db');
  return `file:${localDb}`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Ensure default office users exist on startup or first query
export async function ensureDefaultUsers() {
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      console.log('[Prisma] Database has 0 users. Auto-seeding authorized office staff...');

      const defaultUsers = [
        {
          username: 'admin',
          fullName: 'Chief Executive / Admin',
          role: 'ADMIN',
          password: process.env.ADMIN_INITIAL_PASSWORD || 'admin@safe123',
        },
        {
          username: 'muneeb',
          fullName: 'Muneeb (Accounts)',
          role: 'ACCOUNTS',
          password: process.env.MUNEEB_INITIAL_PASSWORD || 'muneeb@safe123',
        },
        {
          username: 'husnain',
          fullName: 'Husnain (Accounts)',
          role: 'ACCOUNTS',
          password: process.env.HUSNAIN_INITIAL_PASSWORD || 'husnain@safe123',
        },
        {
          username: 'samaira',
          fullName: 'Samaira (Accounts)',
          role: 'ACCOUNTS',
          password: process.env.SAMAIRA_INITIAL_PASSWORD || 'samaira@safe123',
        },
      ];

      for (const u of defaultUsers) {
        const passwordHash = await bcrypt.hash(u.password, 10);
        await prisma.user.create({
          data: {
            username: u.username,
            fullName: u.fullName,
            role: u.role,
            passwordHash,
            isActive: true,
          },
        });
      }

      console.log('[Prisma] Successfully auto-seeded Admin, Muneeb, Husnain, Samaira.');
    }
  } catch (err) {
    console.error('[Prisma] Failed to verify/seed default users:', err);
  }
}

export default prisma;
