import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function logAudit(params: {
  userId: number;
  action: string;
  entity: string;
  entityId?: number;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
}) {
  await db.insert(auditLogs).values({
    userId: params.userId,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId ?? null,
    oldValue: params.oldValue ? params.oldValue : null,
    newValue: params.newValue ? params.newValue : null,
    ipAddress: params.ipAddress ?? null,
  });
}
