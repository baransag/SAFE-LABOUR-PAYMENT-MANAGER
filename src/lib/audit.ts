import prisma from './prisma';

export async function logAudit({
  userId,
  userName,
  action,
  entityType,
  entityId,
  details,
}: {
  userId?: string | null;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown> | string;
}) {
  try {
    const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        userName,
        action,
        entityType,
        entityId,
        details: detailsStr,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
