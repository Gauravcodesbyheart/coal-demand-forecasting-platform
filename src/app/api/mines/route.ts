import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mines } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const allMines = await db.select().from(mines).orderBy(mines.name);
    return NextResponse.json({ mines: allMines });
  } catch (error) {
    console.error("Mines GET error:", error);
    return NextResponse.json({ error: "Failed to fetch mines" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!hasPermission(user.role, "manage_mines")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, location, capacity } = body;

    if (!name) {
      return NextResponse.json({ error: "Mine name is required" }, { status: 400 });
    }

    const [mine] = await db.insert(mines).values({
      name,
      location: location || null,
      capacity: capacity || null,
    }).returning();

    await logAudit({
      userId: user.userId,
      action: "CREATE_MINE",
      entity: "mines",
      entityId: mine.id,
      newValue: { name, location, capacity },
    });

    return NextResponse.json({ mine });
  } catch (error) {
    console.error("Mines POST error:", error);
    return NextResponse.json({ error: "Failed to create mine" }, { status: 500 });
  }
}
