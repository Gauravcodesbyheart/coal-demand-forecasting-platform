"use client";

import { useState } from "react";
import { FlaskConical, ArrowRight, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface WhatIfResult {
  expectedDemand: number;
  requiredSupply: number;
  availableSupply: number;
  gap: number;
  gapPercent: number;
  status: "surplus" | "balanced" | "deficit";
  recommendation: string;
}

export default function WhatIfPage() {
  const [params, setParams] = useState({
    demandGrowthPercent: 5,
    productionCapacity: 10,
    currentInventory: 1,
    safetyStock: 0.5,
    baselineDemand: 10,
  });
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState<{ params: typeof params; result: WhatIfResult }[]>([]);

  async function runAnalysis() {
    setLoading(true);
    try {
      const res = await fetch("/api/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setScenarios((prev) => [...prev, { params: { ...params }, result: data }]);
      }
    } catch {
      alert("Analysis failed");
    }
    setLoading(false);
  }

  const statusConfig = {
    surplus: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle, label: "SURPLUS" },
    balanced: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: TrendingUp, label: "BALANCED" },
    deficit: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: AlertTriangle, label: "DEFICIT" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-amber-400" />
          What-If Analysis
        </h2>
        <p className="text-coal-400 text-sm mt-1">
          Simulate different demand and production scenarios to evaluate supply gaps
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-coal-900 border border-coal-800 rounded-xl p-6">
          <h3 className="font-semibold mb-6">Scenario Parameters</h3>
          <div className="space-y-5">
            <div>
              <label className="text-sm text-coal-300 mb-1.5 block">
                Baseline Demand (MT)
              </label>
              <input
                type="number"
                step="0.1"
                value={params.baselineDemand}
                onChange={(e) => setParams({ ...params, baselineDemand: parseFloat(e.target.value) || 0 })}
                className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <p className="text-coal-500 text-xs mt-1">Current estimated demand from last forecast</p>
            </div>

            <div>
              <label className="text-sm text-coal-300 mb-1.5 block">
                Expected Demand Growth: <span className="text-amber-400 font-bold">{params.demandGrowthPercent}%</span>
              </label>
              <input
                type="range"
                min={-30}
                max={50}
                step={1}
                value={params.demandGrowthPercent}
                onChange={(e) => setParams({ ...params, demandGrowthPercent: parseInt(e.target.value) })}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-xs text-coal-500">
                <span>-30%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-coal-300 mb-1.5 block">Production Capacity (MT)</label>
              <input
                type="number"
                step="0.1"
                value={params.productionCapacity}
                onChange={(e) => setParams({ ...params, productionCapacity: parseFloat(e.target.value) || 0 })}
                className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="text-sm text-coal-300 mb-1.5 block">Current Inventory (MT)</label>
              <input
                type="number"
                step="0.1"
                value={params.currentInventory}
                onChange={(e) => setParams({ ...params, currentInventory: parseFloat(e.target.value) || 0 })}
                className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="text-sm text-coal-300 mb-1.5 block">Safety Stock (MT)</label>
              <input
                type="number"
                step="0.1"
                value={params.safetyStock}
                onChange={(e) => setParams({ ...params, safetyStock: parseFloat(e.target.value) || 0 })}
                className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <button
              onClick={runAnalysis}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-coal-900 font-semibold rounded-lg hover:from-amber-400 hover:to-amber-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FlaskConical className="w-4 h-4" />
              {loading ? "Analyzing..." : "Run Analysis"}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {!result && (
            <div className="bg-coal-900 border border-coal-800 rounded-xl p-10 text-center text-coal-400">
              <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Configure parameters and run analysis to see results</p>
            </div>
          )}

          {result && (
            <>
              {/* Status Banner */}
              <div className={`border rounded-xl p-5 ${statusConfig[result.status].bg}`}>
                <div className="flex items-center gap-3 mb-3">
                  {(() => {
                    const Icon = statusConfig[result.status].icon;
                    return <Icon className={`w-6 h-6 ${statusConfig[result.status].color}`} />;
                  })()}
                  <span className={`text-lg font-bold ${statusConfig[result.status].color}`}>
                    {statusConfig[result.status].label}
                  </span>
                  <span className={`text-2xl font-bold ml-auto ${statusConfig[result.status].color}`}>
                    {result.gap >= 0 ? "+" : ""}{result.gap} MT
                  </span>
                </div>
                <p className="text-coal-300 text-sm">{result.recommendation}</p>
              </div>

              {/* Supply Flow */}
              <div className="bg-coal-900 border border-coal-800 rounded-xl p-5">
                <h4 className="font-semibold mb-4">Supply-Demand Flow</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-coal-800 rounded-lg p-4">
                    <p className="text-coal-500 text-xs mb-1">Expected Demand</p>
                    <p className="text-xl font-bold text-amber-400">{result.expectedDemand} MT</p>
                    <p className="text-coal-500 text-xs">+ Safety: {params.safetyStock} MT</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-coal-600" />
                  </div>
                  <div className="bg-coal-800 rounded-lg p-4">
                    <p className="text-coal-500 text-xs mb-1">Available Supply</p>
                    <p className="text-xl font-bold text-blue-400">{result.availableSupply} MT</p>
                    <p className="text-coal-500 text-xs">Inv + Production</p>
                  </div>
                </div>

                <div className="mt-4 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Required\nSupply", value: result.requiredSupply },
                        { name: "Available\nSupply", value: result.availableSupply },
                      ]}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis type="number" stroke="#627d98" fontSize={11} />
                      <YAxis type="category" dataKey="name" stroke="#627d98" fontSize={11} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#102a43",
                          border: "1px solid #243b53",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        <Cell fill="#f59e0b" />
                        <Cell fill={result.gap >= 0 ? "#10b981" : "#ef4444"} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Numbers */}
              <div className="bg-coal-900 border border-coal-800 rounded-xl p-5">
                <h4 className="font-semibold mb-3">Breakdown</h4>
                <div className="space-y-2 text-sm">
                  {[
                    ["Baseline Demand", `${params.baselineDemand} MT`],
                    ["Growth Factor", `${params.demandGrowthPercent}%`],
                    ["Expected Demand", `${result.expectedDemand} MT`],
                    ["Safety Stock", `${params.safetyStock} MT`],
                    ["Required Supply", `${result.requiredSupply} MT`],
                    ["Current Inventory", `${params.currentInventory} MT`],
                    ["Production Capacity", `${params.productionCapacity} MT`],
                    ["Available Supply", `${result.availableSupply} MT`],
                    ["Gap", `${result.gap >= 0 ? "+" : ""}${result.gap} MT (${result.gapPercent}%)`],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-1 border-b border-coal-800/50">
                      <span className="text-coal-400">{label}</span>
                      <span className="font-mono font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scenario Comparison */}
      {scenarios.length > 1 && (
        <div className="bg-coal-900 border border-coal-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Scenario Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-coal-400 border-b border-coal-800">
                  <th className="text-left py-2 px-3">#</th>
                  <th className="text-right py-2 px-3">Growth %</th>
                  <th className="text-right py-2 px-3">Demand</th>
                  <th className="text-right py-2 px-3">Supply</th>
                  <th className="text-right py-2 px-3">Gap</th>
                  <th className="text-center py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s, i) => (
                  <tr key={i} className="border-b border-coal-800/50">
                    <td className="py-2 px-3">{i + 1}</td>
                    <td className="text-right py-2 px-3 font-mono">{s.params.demandGrowthPercent}%</td>
                    <td className="text-right py-2 px-3 font-mono">{s.result.expectedDemand} MT</td>
                    <td className="text-right py-2 px-3 font-mono">{s.result.availableSupply} MT</td>
                    <td className={`text-right py-2 px-3 font-mono font-bold ${
                      s.result.gap >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {s.result.gap >= 0 ? "+" : ""}{s.result.gap} MT
                    </td>
                    <td className="text-center py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        statusConfig[s.result.status].bg
                      } ${statusConfig[s.result.status].color}`}>
                        {statusConfig[s.result.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
