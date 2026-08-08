import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demandRecords, forecastRuns, forecasts, recommendations, notifications } from "@/db/schema";
import { sql } from "drizzle-orm";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { runAllModels } from "@/lib/forecasting";
import { logAudit } from "@/lib/audit";
import type { DataPoint } from "@/lib/forecasting";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!hasPermission(user.role, "run_forecasts")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const horizonMonths = body.horizonMonths || 3;

    // Create a forecast run
    const [run] = await db.insert(forecastRuns).values({
      status: "running",
      horizonMonths,
      createdBy: user.userId,
    }).returning();

    // Get monthly demand data
    const monthlyDemand = await db
      .select({
        month: sql<string>`TO_CHAR(date::date, 'YYYY-MM')`,
        total: sql<number>`COALESCE(SUM(quantity), 0)`,
      })
      .from(demandRecords)
      .groupBy(sql`TO_CHAR(date::date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(date::date, 'YYYY-MM')`);

    const dataPoints: DataPoint[] = monthlyDemand.map((r) => ({
      date: r.month,
      value: r.total,
    }));

    if (dataPoints.length < 3) {
      await db.update(forecastRuns).set({ status: "failed" }).where(sql`id = ${run.id}`);
      return NextResponse.json({ error: "Not enough historical data. Need at least 3 months." }, { status: 400 });
    }

    // Run forecasting engine
    const { models, bestModel, ensemble } = runAllModels(dataPoints, horizonMonths);

    // Save forecast results using the ensemble model
    const forecastValues = ensemble.forecasts.map((f) => ({
      runId: run.id,
      forecastDate: `${f.date}-01`,
      predictedQuantity: f.predicted,
      confidenceLower: f.lower,
      confidenceUpper: f.upper,
    }));

    await db.insert(forecasts).values(forecastValues);

    // Generate recommendations based on forecast
    const latestActual = dataPoints[dataPoints.length - 1].value;
    const firstForecast = ensemble.forecasts[0].predicted;
    const changePercent = ((firstForecast - latestActual) / latestActual) * 100;

    const recsToInsert = [];

    if (changePercent > 10) {
      recsToInsert.push({
        runId: run.id,
        type: "demand_surge",
        severity: "warning",
        title: `Demand Surge Alert: ${Math.round(changePercent)}% Increase Expected`,
        description: `Forecasted demand for ${ensemble.forecasts[0].date} is ${firstForecast.toFixed(2)} MT, which is ${Math.round(changePercent)}% higher than the most recent actual demand of ${latestActual.toFixed(2)} MT. Consider ramping up production and reviewing dispatch schedules.`,
        metadata: { changePercent: Math.round(changePercent * 100) / 100, forecastValue: firstForecast, actualValue: latestActual },
      });
    } else if (changePercent < -10) {
      recsToInsert.push({
        runId: run.id,
        type: "demand_decline",
        severity: "info",
        title: `Demand Decline: ${Math.abs(Math.round(changePercent))}% Decrease Expected`,
        description: `Forecasted demand shows a ${Math.abs(Math.round(changePercent))}% decrease. Consider adjusting production targets to optimize costs and avoid excess inventory buildup.`,
        metadata: { changePercent: Math.round(changePercent * 100) / 100, forecastValue: firstForecast, actualValue: latestActual },
      });
    }

    // Supply gap analysis
    recsToInsert.push({
      runId: run.id,
      type: "planning_guidance",
      severity: "info",
      title: "Production Planning Guidance",
      description: `Based on the ${horizonMonths}-month forecast, total expected demand is ${ensemble.forecasts.reduce((s, f) => s + f.predicted, 0).toFixed(2)} MT. Use the What-If Analysis tool to evaluate different production scenarios and identify potential supply gaps.`,
      metadata: { totalForecast: ensemble.forecasts.reduce((s, f) => s + f.predicted, 0) },
    });

    if (recsToInsert.length > 0) {
      await db.insert(recommendations).values(recsToInsert);
    }

    // Update run status
    await db.update(forecastRuns).set({
      status: "completed",
      modelUsed: ensemble.name,
      metrics: ensemble.metrics,
      completedAt: new Date(),
    }).where(sql`id = ${run.id}`);

    // Send notification
    await db.insert(notifications).values({
      userId: user.userId,
      type: "forecast_complete",
      title: "Forecast Run Completed",
      message: `Your ${horizonMonths}-month forecast has been completed using ${ensemble.name}. Best individual model: ${bestModel.name} (MAPE: ${bestModel.metrics.mape}%).`,
    });

    await logAudit({
      userId: user.userId,
      action: "RUN_FORECAST",
      entity: "forecast_runs",
      entityId: run.id,
      newValue: { horizonMonths, modelUsed: ensemble.name },
    });

    return NextResponse.json({
      runId: run.id,
      modelComparison: models.map((m) => ({
        name: m.name,
        metrics: m.metrics,
        forecasts: m.forecasts,
      })),
      bestModel: {
        name: bestModel.name,
        metrics: bestModel.metrics,
      },
      ensemble: {
        name: ensemble.name,
        metrics: ensemble.metrics,
        forecasts: ensemble.forecasts,
      },
      recommendations: recsToInsert,
    });
  } catch (error) {
    console.error("Forecast error:", error);
    return NextResponse.json({ error: "Forecast failed" }, { status: 500 });
  }
}
