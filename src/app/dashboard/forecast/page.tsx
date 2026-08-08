"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Play, Clock, CheckCircle, XCircle, Loader2,
  BarChart3, AlertTriangle, Info,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Legend,
  BarChart, Bar,
} from "recharts";

interface ForecastResult {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
}

interface ModelComparison {
  name: string;
  metrics: { mae: number; rmse: number; mape: number };
  forecasts: ForecastResult[];
}

interface ForecastRunResult {
  runId: number;
  modelComparison: ModelComparison[];
  bestModel: { name: string; metrics: { mae: number; rmse: number; mape: number } };
  ensemble: { name: string; metrics: { mae: number; rmse: number; mape: number }; forecasts: ForecastResult[] };
  recommendations: { type: string; severity: string; title: string; description: string }[];
}

interface HistoryRun {
  id: number;
  status: string;
  modelUsed: string | null;
  horizonMonths: number;
  metrics: { mae: number; rmse: number; mape: number } | null;
  createdAt: string;
  completedAt: string | null;
  userName: string;
  forecasts: { forecastDate: string; predictedQuantity: number; confidenceLower: number | null; confidenceUpper: number | null }[];
  recommendations: { type: string; severity: string; title: string; description: string }[];
}

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444"];

export default function ForecastPage() {
  const [horizon, setHorizon] = useState(3);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ForecastRunResult | null>(null);
  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [activeTab, setActiveTab] = useState<"run" | "history">("run");

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch("/api/forecast/history");
      const data = await res.json();
      if (data.runs) setHistory(data.runs);
    } catch {}
  }

  async function runForecast() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/forecast/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horizonMonths: horizon }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        fetchHistory();
      } else {
        alert(data.error || "Forecast failed");
      }
    } catch {
      alert("Network error");
    }
    setRunning(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Demand Forecasting</h2>
        <p className="text-coal-400 text-sm mt-1">
          Run multi-model forecasting engine with automatic model selection
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("run")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "run"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "text-coal-400 hover:text-white bg-coal-900 border border-coal-800"
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Run Forecast
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "history"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "text-coal-400 hover:text-white bg-coal-900 border border-coal-800"
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          History ({history.length})
        </button>
      </div>

      {activeTab === "run" && (
        <div className="space-y-6">
          {/* Run Controls */}
          <div className="bg-coal-900 border border-coal-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Configure Forecast</h3>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="text-sm text-coal-400 block mb-1.5">Forecast Horizon</label>
                <select
                  value={horizon}
                  onChange={(e) => setHorizon(Number(e.target.value))}
                  className="bg-coal-800 border border-coal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>

              <div className="bg-coal-800 border border-coal-700 rounded-lg px-4 py-2 text-sm">
                <p className="text-coal-500 text-xs">Models</p>
                <p className="font-medium">Linear Regression, Moving Avg, Exp Smoothing, Holt&apos;s Trend</p>
              </div>

              <div className="bg-coal-800 border border-coal-700 rounded-lg px-4 py-2 text-sm">
                <p className="text-coal-500 text-xs">Ensemble</p>
                <p className="font-medium">Weighted (inverse RMSE)</p>
              </div>

              <button
                onClick={runForecast}
                disabled={running}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-coal-900 font-semibold rounded-lg hover:from-amber-400 hover:to-amber-500 transition disabled:opacity-50 flex items-center gap-2"
              >
                {running ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {running ? "Running..." : "Run Forecast"}
              </button>
            </div>
          </div>

          {/* Results */}
          {result && (
            <>
              {/* Model Comparison Table */}
              <div className="bg-coal-900 border border-coal-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  Model Comparison
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-coal-400 border-b border-coal-800">
                        <th className="text-left py-2 px-3">Model</th>
                        <th className="text-right py-2 px-3">MAE</th>
                        <th className="text-right py-2 px-3">RMSE</th>
                        <th className="text-right py-2 px-3">MAPE (%)</th>
                        <th className="text-center py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.modelComparison.map((model) => {
                        const isBest = model.name === result.bestModel.name;
                        return (
                          <tr key={model.name} className={`border-b border-coal-800/50 ${isBest ? "bg-amber-500/5" : ""}`}>
                            <td className="py-2.5 px-3 font-medium">
                              {model.name}
                              {isBest && (
                                <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                                  BEST
                                </span>
                              )}
                            </td>
                            <td className="text-right py-2.5 px-3 font-mono">{model.metrics.mae}</td>
                            <td className="text-right py-2.5 px-3 font-mono">{model.metrics.rmse}</td>
                            <td className="text-right py-2.5 px-3 font-mono">{model.metrics.mape}%</td>
                            <td className="text-center py-2.5 px-3">
                              <CheckCircle className="w-4 h-4 text-emerald-400 inline" />
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-blue-500/5 font-semibold">
                        <td className="py-2.5 px-3">
                          {result.ensemble.name}
                          <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                            SELECTED
                          </span>
                        </td>
                        <td className="text-right py-2.5 px-3 font-mono">{result.ensemble.metrics.mae}</td>
                        <td className="text-right py-2.5 px-3 font-mono">{result.ensemble.metrics.rmse}</td>
                        <td className="text-right py-2.5 px-3 font-mono">{result.ensemble.metrics.mape}%</td>
                        <td className="text-center py-2.5 px-3">
                          <CheckCircle className="w-4 h-4 text-blue-400 inline" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Forecast Chart — all models */}
              <div className="bg-coal-900 border border-coal-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Forecast Comparison</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis
                        dataKey="date"
                        stroke="#627d98"
                        fontSize={11}
                        type="category"
                        allowDuplicatedCategory={false}
                      />
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
                      {result.modelComparison.map((model, i) => (
                        <Line
                          key={model.name}
                          data={model.forecasts}
                          dataKey="predicted"
                          name={model.name}
                          stroke={COLORS[i]}
                          strokeWidth={1.5}
                          strokeDasharray={model.name === result.bestModel.name ? undefined : "5 5"}
                          dot={false}
                        />
                      ))}
                      <Line
                        data={result.ensemble.forecasts}
                        dataKey="predicted"
                        name="Ensemble"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ensemble with Confidence Intervals */}
              <div className="bg-coal-900 border border-coal-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Ensemble Forecast with Confidence Intervals</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.ensemble.forecasts}>
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
                      <Area type="monotone" dataKey="upper" stroke="none" fill="#f59e0b15" name="Upper" />
                      <Area type="monotone" dataKey="predicted" stroke="#f59e0b" fill="#f59e0b30" strokeWidth={2} name="Predicted" />
                      <Area type="monotone" dataKey="lower" stroke="none" fill="transparent" name="Lower" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {result.ensemble.forecasts.map((f) => (
                    <div key={f.date} className="bg-coal-800 rounded-lg p-3 text-sm">
                      <p className="text-coal-500 text-xs">{f.date}</p>
                      <p className="font-bold text-lg mt-0.5">{f.predicted} MT</p>
                      <p className="text-coal-500 text-xs">
                        Range: {f.lower} — {f.upper} MT
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">AI Recommendations</h3>
                  {result.recommendations.map((rec, i) => {
                    const severityStyles: Record<string, string> = {
                      critical: "border-red-500/30 bg-red-500/5",
                      warning: "border-amber-500/30 bg-amber-500/5",
                      info: "border-blue-500/30 bg-blue-500/5",
                    };
                    const severityIcons: Record<string, typeof AlertTriangle> = {
                      critical: XCircle,
                      warning: AlertTriangle,
                      info: Info,
                    };
                    const Icon = severityIcons[rec.severity] || Info;
                    return (
                      <div key={i} className={`border rounded-xl p-4 ${severityStyles[rec.severity] || severityStyles.info}`}>
                        <div className="flex items-start gap-3">
                          <Icon className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                          <div>
                            <p className="font-medium">{rec.title}</p>
                            <p className="text-coal-300 text-sm mt-1">{rec.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          {history.length === 0 && (
            <div className="bg-coal-900 border border-coal-800 rounded-xl p-10 text-center text-coal-400">
              No forecast runs yet. Run your first forecast to see history.
            </div>
          )}
          {history.map((run) => (
            <div key={run.id} className="bg-coal-900 border border-coal-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    run.status === "completed" ? "bg-emerald-500/20" : run.status === "failed" ? "bg-red-500/20" : "bg-amber-500/20"
                  }`}>
                    {run.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : run.status === "failed" ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Run #{run.id}</p>
                    <p className="text-coal-500 text-xs">
                      {run.modelUsed || "N/A"} • {run.horizonMonths}mo horizon • by {run.userName}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-coal-400">
                  {new Date(run.createdAt).toLocaleString()}
                </div>
              </div>

              {run.metrics && (
                <div className="flex gap-4 text-sm">
                  <span className="text-coal-400">MAE: <span className="text-white font-mono">{(run.metrics as { mae: number }).mae}</span></span>
                  <span className="text-coal-400">RMSE: <span className="text-white font-mono">{(run.metrics as { rmse: number }).rmse}</span></span>
                  <span className="text-coal-400">MAPE: <span className="text-white font-mono">{(run.metrics as { mape: number }).mape}%</span></span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
