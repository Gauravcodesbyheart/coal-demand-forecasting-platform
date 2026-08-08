import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dispatchRecords } from "@/db/schema";
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
        id: dispatchRecords.id,
        mineId: dispatchRecords.mineId,
        mineName: sql<string>`(SELECT name FROM mines WHERE id = mine_id)`,
        date: dispatchRecords.date,
        coalGrade: dispatchRecords.coalGrade,
        quantity: dispatchRecords.quantity,
        sector: dispatchRecords.sector,
        destination: dispatchRecords.destination,
        createdAt: dispatchRecords.createdAt,
      })
      .from(dispatchRecords)
      .orderBy(desc(dispatchRecords.date), desc(dispatchRecords.createdAt))
      .limit(200);

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Dispatch GET error:", error);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!hasPermission(user.role, "enter_dispatch")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { mineId, date, coalGrade, quantity, sector, destination } = body;

    if (!mineId || !date || !coalGrade || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [record] = await db.insert(dispatchRecords).values({
      mineId,
      date,
      coalGrade,
      quantity,
      sector: sector || "Power",
      destination: destination || null,
      createdBy: user.userId,
    }).returning();

    await logAudit({
      userId: user.userId,
      action: "CREATE_DISPATCH",
      entity: "dispatch_records",
      entityId: record.id,
      newValue: { mineId, date, coalGrade, quantity, sector, destination },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Dispatch POST error:", error);
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
  }
}
