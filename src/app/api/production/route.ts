import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { productionRecords, mines } from "@/db/schema";
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
        id: productionRecords.id,
        mineId: productionRecords.mineId,
        mineName: sql<string>`(SELECT name FROM mines WHERE id = mine_id)`,
        date: productionRecords.date,
        coalGrade: productionRecords.coalGrade,
        quantity: productionRecords.quantity,
        shift: productionRecords.shift,
        productionCost: productionRecords.productionCost,
        createdAt: productionRecords.createdAt,
      })
      .from(productionRecords)
      .orderBy(desc(productionRecords.date), desc(productionRecords.createdAt))
      .limit(200);

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Production GET error:", error);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!hasPermission(user.role, "enter_production")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { mineId, date, coalGrade, quantity, shift, productionCost } = body;

    if (!mineId || !date || !coalGrade || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [record] = await db.insert(productionRecords).values({
      mineId,
      date,
      coalGrade,
      quantity,
      shift: shift || "General",
      productionCost: productionCost || null,
      createdBy: user.userId,
    }).returning();

    await logAudit({
      userId: user.userId,
      action: "CREATE_PRODUCTION",
      entity: "production_records",
      entityId: record.id,
      newValue: { mineId, date, coalGrade, quantity, shift },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Production POST error:", error);
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
  }
}
