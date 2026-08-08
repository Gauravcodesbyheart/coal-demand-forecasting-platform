import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inventoryRecords } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const records = await db
      .select({
        id: inventoryRecords.id,
        mineId: inventoryRecords.mineId,
        mineName: sql<string>`(SELECT name FROM mines WHERE id = mine_id)`,
        date: inventoryRecords.date,
        coalGrade: inventoryRecords.coalGrade,
        openingStock: inventoryRecords.openingStock,
        closingStock: inventoryRecords.closingStock,
        createdAt: inventoryRecords.createdAt,
      })
      .from(inventoryRecords)
      .orderBy(desc(inventoryRecords.date), desc(inventoryRecords.createdAt))
      .limit(200);

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Inventory GET error:", error);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!hasPermission(user.role, "update_inventory")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { mineId, date, coalGrade, openingStock, closingStock } = body;

    if (!mineId || !date || !coalGrade || openingStock == null || closingStock == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [record] = await db.insert(inventoryRecords).values({
      mineId,
      date,
      coalGrade,
      openingStock,
      closingStock,
      createdBy: user.userId,
    }).returning();

    await logAudit({
      userId: user.userId,
      action: "CREATE_INVENTORY",
      entity: "inventory_records",
      entityId: record.id,
      newValue: { mineId, date, coalGrade, openingStock, closingStock },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Inventory POST error:", error);
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
  }
}
