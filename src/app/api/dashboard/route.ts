import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  productionRecords, dispatchRecords, inventoryRecords,
  demandRecords, forecastRuns, forecasts,
} from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Total production (all time, in MT)
    const prodResult = await db
      .select({ total: sql<number>`COALESCE(SUM(quantity), 0)` })
      .from(productionRecords);
    const totalProduction = Math.round((prodResult[0]?.total || 0) / 1000 * 100) / 100;

    // Total dispatch
    const dispResult = await db
      .select({ total: sql<number>`COALESCE(SUM(quantity), 0)` })
      .from(dispatchRecords);
    const totalDispatch = Math.round((dispResult[0]?.total || 0) / 1000 * 100) / 100;

    // Current inventory (latest month)
    const invResult = await db
      .select({ total: sql<number>`COALESCE(SUM(closing_stock), 0)` })
      .from(inventoryRecords)
      .where(sql`date = (SELECT MAX(date) FROM inventory_records)`);
    const currentInventory = Math.round((invResult[0]?.total || 0) * 100) / 100;

    // Total demand
    const demResult = await db
      .select({ total: sql<number>`COALESCE(SUM(quantity), 0)` })
      .from(demandRecords);
    const totalDemand = Math.round((demResult[0]?.total || 0) / 1000 * 100) / 100;

    // Monthly production trend (last 12 months)
    const monthlyProduction = await db
      .select({
        month: sql<string>`TO_CHAR(date::date, 'YYYY-MM')`,
        total: sql<number>`COALESCE(SUM(quantity), 0)`,
      })
      .from(productionRecords)
      .groupBy(sql`TO_CHAR(date::date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(date::date, 'YYYY-MM')`)
      .limit(24);

    // Monthly demand trend
    const monthlyDemand = await db
      .select({
        month: sql<string>`TO_CHAR(date::date, 'YYYY-MM')`,
        total: sql<number>`COALESCE(SUM(quantity), 0)`,
      })
      .from(demandRecords)
      .groupBy(sql`TO_CHAR(date::date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(date::date, 'YYYY-MM')`)
      .limit(24);

    // Monthly dispatch trend
    const monthlyDispatch = await db
      .select({
        month: sql<string>`TO_CHAR(date::date, 'YYYY-MM')`,
        total: sql<number>`COALESCE(SUM(quantity), 0)`,
      })
      .from(dispatchRecords)
      .groupBy(sql`TO_CHAR(date::date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(date::date, 'YYYY-MM')`)
      .limit(24);

    // Grade-wise demand breakdown (latest month)
    const gradeWiseDemand = await db
      .select({
        grade: demandRecords.coalGrade,
        total: sql<number>`COALESCE(SUM(quantity), 0)`,
      })
      .from(demandRecords)
      .where(sql`date = (SELECT MAX(date) FROM demand_records)`)
      .groupBy(demandRecords.coalGrade)
      .orderBy(demandRecords.coalGrade);

    // Sector-wise demand breakdown (latest month)
    const sectorWiseDemand = await db
      .select({
        sector: demandRecords.sector,
        total: sql<number>`COALESCE(SUM(quantity), 0)`,
      })
      .from(demandRecords)
      .where(sql`date = (SELECT MAX(date) FROM demand_records)`)
      .groupBy(demandRecords.sector)
      .orderBy(sql`SUM(quantity) DESC`);

    // Mine performance (total production per mine)
    const minePerformance = await db
      .select({
        mineName: sql<string>`(SELECT name FROM mines WHERE id = mine_id)`,
        total: sql<number>`COALESCE(SUM(quantity), 0)`,
      })
      .from(productionRecords)
      .where(sql`date = (SELECT MAX(date) FROM production_records)`)
      .groupBy(productionRecords.mineId)
      .orderBy(sql`SUM(quantity) DESC`);

    // Latest forecast
    const latestRun = await db
      .select()
      .from(forecastRuns)
      .orderBy(desc(forecastRuns.createdAt))
      .limit(1);

    let latestForecasts: { forecastDate: string; predictedQuantity: number; confidenceLower: number | null; confidenceUpper: number | null }[] = [];
    if (latestRun.length > 0) {
      latestForecasts = await db
        .select({
          forecastDate: forecasts.forecastDate,
          predictedQuantity: forecasts.predictedQuantity,
          confidenceLower: forecasts.confidenceLower,
          confidenceUpper: forecasts.confidenceUpper,
        })
        .from(forecasts)
        .where(sql`run_id = ${latestRun[0].id}`)
        .orderBy(forecasts.forecastDate);
    }

    return NextResponse.json({
      kpis: {
        totalProduction,
        totalDispatch,
        currentInventory,
        totalDemand,
      },
      monthlyProduction: monthlyProduction.map((r) => ({
        month: r.month,
        value: Math.round(r.total / 1000 * 100) / 100,
      })),
      monthlyDemand: monthlyDemand.map((r) => ({
        month: r.month,
        value: Math.round(r.total * 100) / 100,
      })),
      monthlyDispatch: monthlyDispatch.map((r) => ({
        month: r.month,
        value: Math.round(r.total / 1000 * 100) / 100,
      })),
      gradeWiseDemand: gradeWiseDemand.map((r) => ({
        grade: r.grade,
        value: Math.round(r.total * 100) / 100,
      })),
      sectorWiseDemand: sectorWiseDemand.map((r) => ({
        sector: r.sector,
        value: Math.round(r.total * 100) / 100,
      })),
      minePerformance: minePerformance.map((r) => ({
        name: r.mineName,
        value: Math.round(r.total * 100) / 100,
      })),
      latestForecasts: latestForecasts.map((f) => ({
        date: f.forecastDate,
        predicted: f.predictedQuantity,
        lower: f.confidenceLower,
        upper: f.confidenceUpper,
      })),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
