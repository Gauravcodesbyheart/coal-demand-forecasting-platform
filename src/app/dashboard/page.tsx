"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, Package, Truck, Pickaxe, BarChart3,
  AlertTriangle, ArrowUpRight, Activity,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  Legend, ComposedChart, Line,
} from "recharts";

interface DashboardData {
  kpis: { totalProduction: number; totalDispatch: number; currentInventory: number; totalDemand: number };
  monthlyProduction: { month: string; value: number }[];
  monthlyDemand: { month: string; value: number }[];
  monthlyDispatch: { month: string; value: number }[];
  gradeWiseDemand: { grade: string; value: number }[];
  sectorWiseDemand: { sector: string; value: number }[];
  minePerformance: { name: string; value: number }[];
  latestForecasts: { date: string; predicted: number; lower: number | null; upper: number | null }[];
}

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-coal-400">
        Failed to load dashboard data.
      </div>
    );
  }

  // Combine monthly data for chart
  const combinedMonthly = data.monthlyDemand.map((d, i) => ({
    month: d.month.slice(5), // MM
    demand: d.value,
    production: data.monthlyProduction[i]?.value || 0,
    dispatch: data.monthlyDispatch[i]?.value || 0,
  }));

  const latestMonth = data.monthlyDemand[data.monthlyDemand.length - 1];
  const prevMonth = data.monthlyDemand[data.monthlyDemand.length - 2];
  const demandTrend = latestMonth && prevMonth
    ? ((latestMonth.value - prevMonth.value) / prevMonth.value) * 100
    : 0;

  const kpiCards = [
    {
      label: "Total Production",
      value: `${data.kpis.totalProduction} MT`,
      icon: Pickaxe,
      color: "from-amber-500/20 to-amber-600/5 border-amber-500/20",
      iconColor: "text-amber-400",
      sub: "All-time cumulative",
    },
    {
      label: "Total Dispatch",
      value: `${data.kpis.totalDispatch} MT`,
      icon: Truck,
      color: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
      iconColor: "text-blue-400",
      sub: "All-time cumulative",
    },
    {
      label: "Current Inventory",
      value: `${data.kpis.currentInventory} MT`,
      icon: Package,
      color: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
      iconColor: "text-emerald-400",
      sub: "Latest closing stock",
    },
    {
      label: "Demand Trend",
      value: `${demandTrend >= 0 ? "+" : ""}${demandTrend.toFixed(1)}%`,
      icon: demandTrend >= 0 ? TrendingUp : TrendingDown,
      color: demandTrend >= 0
        ? "from-red-500/20 to-red-600/5 border-red-500/20"
        : "from-green-500/20 to-green-600/5 border-green-500/20",
      iconColor: demandTrend >= 0 ? "text-red-400" : "text-green-400",
      sub: "Month-over-month change",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <p className="text-coal-400 text-sm mt-1">
          Coal demand, production & inventory intelligence at a glance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className={`bg-gradient-to-br ${kpi.color} border rounded-xl p-5`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-coal-300 text-sm font-medium">{kpi.label}</span>
              <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
            <p className="text-coal-500 text-xs mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Planning Alert */}
      {demandTrend > 5 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-red-400">⚠ Planning Alert</h3>
            <p className="text-coal-300 text-sm mt-1">
              Demand is trending {demandTrend.toFixed(1)}% higher than the previous period.
              Review production and dispatch planning to ensure supply adequacy.
            </p>
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Trend Chart */}
        <div className="lg:col-span-2 bg-coal-900 border border-coal-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Demand vs Production vs Dispatch</h3>
              <p className="text-coal-500 text-xs">Monthly comparison (in MT / thousands)</p>
            </div>
            <Activity className="w-4 h-4 text-coal-500" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combinedMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="month" stroke="#627d98" fontSize={11} />
                <YAxis stroke="#627d98" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#102a43",
                    border: "1px solid #243b53",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Area
                  type="monotone"
                  dataKey="demand"
                  fill="#f59e0b20"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Demand"
                />
                <Bar dataKey="production" fill="#3b82f6" name="Production" radius={[2, 2, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="dispatch"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Dispatch"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector-wise Demand */}
        <div className="bg-coal-900 border border-coal-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Sector-wise Demand</h3>
              <p className="text-coal-500 text-xs">Latest month breakdown</p>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.sectorWiseDemand.map((s) => ({ name: s.sector, value: s.value }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                  fontSize={10}
                >
                  {data.sectorWiseDemand.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#102a43",
                    border: "1px solid #243b53",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {data.sectorWiseDemand.map((s, i) => (
              <div key={s.sector} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-coal-300">{s.sector}</span>
                </div>
                <span className="font-medium">{s.value} MT</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Grade-wise Demand */}
        <div className="bg-coal-900 border border-coal-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Grade-wise Demand</h3>
              <p className="text-coal-500 text-xs">Latest month demand by coal grade</p>
            </div>
            <BarChart3 className="w-4 h-4 text-coal-500" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.gradeWiseDemand.map((g) => ({ name: g.grade, value: g.value }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="name" stroke="#627d98" fontSize={11} />
                <YAxis stroke="#627d98" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#102a43",
                    border: "1px solid #243b53",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Demand (MT)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mine Performance */}
        <div className="bg-coal-900 border border-coal-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Mine Performance</h3>
              <p className="text-coal-500 text-xs">Latest month production output</p>
            </div>
            <Pickaxe className="w-4 h-4 text-coal-500" />
          </div>
          <div className="space-y-3">
            {data.minePerformance.map((mine, i) => {
              const maxVal = Math.max(...data.minePerformance.map((m) => m.value));
              const pct = maxVal > 0 ? (mine.value / maxVal) * 100 : 0;
              return (
                <div key={mine.name || i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-coal-300">{mine.name || `Mine ${i + 1}`}</span>
                    <span className="font-medium">{mine.value} T</span>
                  </div>
                  <div className="w-full bg-coal-800 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forecast preview */}
      {data.latestForecasts.length > 0 && (
        <div className="bg-coal-900 border border-coal-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Latest Forecast</h3>
              <p className="text-coal-500 text-xs">Predicted demand with confidence intervals</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.latestForecasts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="date" stroke="#627d98" fontSize={11} />
                <YAxis stroke="#627d98" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#102a43",
                    border: "1px solid #243b53",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="upper"
                  stroke="none"
                  fill="#f59e0b10"
                  name="Upper Bound"
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#f59e0b"
                  fill="#f59e0b20"
                  strokeWidth={2}
                  name="Predicted"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  stroke="none"
                  fill="transparent"
                  name="Lower Bound"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
