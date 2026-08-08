import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { runWhatIfAnalysis } from "@/lib/forecasting";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!hasPermission(user.role, "what_if_analysis") && !hasPermission(user.role, "run_forecasts")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      demandGrowthPercent = 5,
      productionCapacity = 10,
      currentInventory = 1,
      safetyStock = 0.5,
      baselineDemand = 10,
    } = body;

    const result = runWhatIfAnalysis({
      demandGrowthPercent,
      productionCapacity,
      currentInventory,
      safetyStock,
      baselineDemand,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("What-If error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
