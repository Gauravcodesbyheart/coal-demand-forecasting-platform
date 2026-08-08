import { NextResponse } from "next/server";
import { db } from "@/db";
import { forecastRuns, forecasts, recommendations, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const runs = await db
      .select({
        id: forecastRuns.id,
        status: forecastRuns.status,
        modelUsed: forecastRuns.modelUsed,
        horizonMonths: forecastRuns.horizonMonths,
        metrics: forecastRuns.metrics,
        createdBy: forecastRuns.createdBy,
        createdAt: forecastRuns.createdAt,
        completedAt: forecastRuns.completedAt,
        userName: sql<string>`(SELECT name FROM users WHERE id = ${forecastRuns.createdBy})`,
      })
      .from(forecastRuns)
      .orderBy(desc(forecastRuns.createdAt))
      .limit(20);

    const runsWithDetails = await Promise.all(
      runs.map(async (run) => {
        const forecastData = await db
          .select()
          .from(forecasts)
          .where(eq(forecasts.runId, run.id))
          .orderBy(forecasts.forecastDate);

        const recs = await db
          .select()
          .from(recommendations)
          .where(eq(recommendations.runId, run.id));

        return {
          ...run,
          forecasts: forecastData,
          recommendations: recs,
        };
      })
    );

    return NextResponse.json({ runs: runsWithDetails });
  } catch (error) {
    console.error("Forecast history error:", error);
    return NextResponse.json({ error: "Failed to fetch forecast history" }, { status: 500 });
  }
}
