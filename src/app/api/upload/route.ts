import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { productionRecords, dispatchRecords, demandRecords } from "@/db/schema";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

interface ParsedRow {
  [key: string]: string;
}

type CoalGrade = "G1"|"G2"|"G3"|"G4"|"G5"|"G6"|"G7"|"G8"|"G9"|"G10"|"G11"|"G12"|"G13"|"G14"|"G15"|"G16"|"G17";
type Sector = "Power"|"Steel"|"Cement"|"Railways"|"Others";
type Shift = "A"|"B"|"C"|"General";

const VALID_COAL_GRADES: CoalGrade[] = ["G1","G2","G3","G4","G5","G6","G7","G8","G9","G10","G11","G12","G13","G14","G15","G16","G17"];
const VALID_SECTORS: Sector[] = ["Power","Steel","Cement","Railways","Others"];
const VALID_SHIFTS: Shift[] = ["A","B","C","General"];

function isCoalGrade(v: string): v is CoalGrade {
  return (VALID_COAL_GRADES as string[]).includes(v);
}
function isSector(v: string): v is Sector {
  return (VALID_SECTORS as string[]).includes(v);
}
function isShift(v: string): v is Shift {
  return (VALID_SHIFTS as string[]).includes(v);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!hasPermission(user.role, "upload_data") && !hasPermission(user.role, "enter_production")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { type, data } = body as { type: string; data: ParsedRow[] };

    if (!type || !data || !Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid payload. Expected { type, data[] }" }, { status: 400 });
    }

    const errors: { row: number; message: string }[] = [];
    let validCount = 0;

    if (type === "production") {
      const validRows: {
        mineId: number; date: string; coalGrade: CoalGrade;
        quantity: number; shift: Shift; productionCost: number | null;
        createdBy: number;
      }[] = [];
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row.date || !row.coalGrade || !row.quantity || !row.mineId) {
          errors.push({ row: i + 1, message: "Missing required fields: date, coalGrade, quantity, mineId" });
          continue;
        }
        if (!isCoalGrade(row.coalGrade)) {
          errors.push({ row: i + 1, message: `Invalid coal grade: ${row.coalGrade}` });
          continue;
        }
        validRows.push({
          mineId: parseInt(row.mineId),
          date: row.date,
          coalGrade: row.coalGrade,
          quantity: parseFloat(row.quantity),
          shift: isShift(row.shift || "") ? (row.shift as Shift) : "General",
          productionCost: row.productionCost ? parseFloat(row.productionCost) : null,
          createdBy: user.userId,
        });
      }
      if (validRows.length > 0) {
        const chunkSize = 500;
        for (let i = 0; i < validRows.length; i += chunkSize) {
          await db.insert(productionRecords).values(validRows.slice(i, i + chunkSize));
        }
        validCount = validRows.length;
      }
    } else if (type === "dispatch") {
      const validRows: {
        mineId: number; date: string; coalGrade: CoalGrade;
        quantity: number; sector: Sector; destination: string | null;
        createdBy: number;
      }[] = [];
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row.date || !row.coalGrade || !row.quantity || !row.mineId) {
          errors.push({ row: i + 1, message: "Missing required fields" });
          continue;
        }
        if (!isCoalGrade(row.coalGrade)) {
          errors.push({ row: i + 1, message: `Invalid coal grade: ${row.coalGrade}` });
          continue;
        }
        validRows.push({
          mineId: parseInt(row.mineId),
          date: row.date,
          coalGrade: row.coalGrade,
          quantity: parseFloat(row.quantity),
          sector: isSector(row.sector || "") ? (row.sector as Sector) : "Power",
          destination: row.destination || null,
          createdBy: user.userId,
        });
      }
      if (validRows.length > 0) {
        const chunkSize = 500;
        for (let i = 0; i < validRows.length; i += chunkSize) {
          await db.insert(dispatchRecords).values(validRows.slice(i, i + chunkSize));
        }
        validCount = validRows.length;
      }
    } else if (type === "demand") {
      const validRows: {
        date: string; coalGrade: CoalGrade; sector: Sector;
        quantity: number; createdBy: number;
      }[] = [];
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row.date || !row.coalGrade || !row.quantity) {
          errors.push({ row: i + 1, message: "Missing required fields" });
          continue;
        }
        if (!isCoalGrade(row.coalGrade)) {
          errors.push({ row: i + 1, message: `Invalid coal grade: ${row.coalGrade}` });
          continue;
        }
        validRows.push({
          date: row.date,
          coalGrade: row.coalGrade,
          sector: isSector(row.sector || "") ? (row.sector as Sector) : "Power",
          quantity: parseFloat(row.quantity),
          createdBy: user.userId,
        });
      }
      if (validRows.length > 0) {
        const chunkSize = 500;
        for (let i = 0; i < validRows.length; i += chunkSize) {
          await db.insert(demandRecords).values(validRows.slice(i, i + chunkSize));
        }
        validCount = validRows.length;
      }
    } else {
      return NextResponse.json({ error: `Unknown data type: ${type}` }, { status: 400 });
    }

    await logAudit({
      userId: user.userId,
      action: "UPLOAD_DATA",
      entity: type,
      newValue: { totalRows: data.length, validRows: validCount, errorRows: errors.length },
    });

    return NextResponse.json({
      totalRows: data.length,
      validRows: validCount,
      errorRows: errors.length,
      errors: errors.slice(0, 50),
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
