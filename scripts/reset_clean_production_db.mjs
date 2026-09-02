import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanData() {
  console.log('Cleaning test labour and transaction records for production readiness...');

  // Delete transactions, rate histories, and labour
  await prisma.transaction.deleteMany({});
  await prisma.labourRateHistory.deleteMany({});
  await prisma.labour.deleteMany({});

  // Record audit event
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (admin) {
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        userName: admin.fullName,
        action: 'SYSTEM_READY',
        entityType: 'SYSTEM',
        entityId: 'SYSTEM',
        details: JSON.stringify({
          message: 'Database cleaned of test transactions and labour. Ready for SAFE SOLUTIONS office team production use.',
        }),
      },
    });
  }

  console.log('✔ All test data removed. Authorized office staff users preserved.');
  console.log('✔ SAFE SOLUTIONS LABOUR PAYMENT MANAGER is ready for production entries.');
}

cleanData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
