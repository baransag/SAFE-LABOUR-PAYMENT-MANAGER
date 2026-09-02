import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SAFE SOLUTIONS office staff users...');

  const users = [
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

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const existing = await prisma.user.findUnique({ where: { username: u.username } });
    if (!existing) {
      await prisma.user.create({
        data: {
          username: u.username,
          fullName: u.fullName,
          role: u.role,
          passwordHash,
          isActive: true,
        },
      });
      console.log(`Created user: ${u.username} (${u.role})`);
    } else {
      console.log(`User already exists: ${u.username}`);
    }
  }

  // Create initial audit log
  const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (adminUser) {
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        userName: adminUser.fullName,
        action: 'SYSTEM_INITIALIZED',
        entityType: 'SYSTEM',
        entityId: 'SYSTEM',
        details: JSON.stringify({ message: 'SAFE LABOUR PAYMENT MANAGER system initialized with authorized office staff.' }),
      },
    });
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
