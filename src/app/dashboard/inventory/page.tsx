"use client";

import { useEffect, useState } from "react";
import { Package, Plus, X, Loader2 } from "lucide-react";

interface InventoryRecord {
  id: number; mineId: number; mineName: string; date: string;
  coalGrade: string; openingStock: number; closingStock: number;
}
interface Mine { id: number; name: string; }

const COAL_GRADES = ["G5","G6","G7","G8","G9","G10"];

export default function InventoryPage() {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ mineId: "", date: "", coalGrade: "G5", openingStock: "", closingStock: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/inventory").then((r) => r.json()),
      fetch("/api/mines").then((r) => r.json()),
    ]).then(([d, m]) => {
      setRecords(d.records || []);
      setMines(m.mines || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mineId: parseInt(form.mineId), date: form.date, coalGrade: form.coalGrade,
          openingStock: parseFloat(form.openingStock), closingStock: parseFloat(form.closingStock),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        const refreshed = await fetch("/api/inventory").then((r) => r.json());
        setRecords(refreshed.records || []);
      } else { const err = await res.json(); alert(err.error); }
    } catch { alert("Error"); }
    setSubmitting(false);
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6 text-emerald-400" /> Inventory Records</h2>
          <p className="text-coal-400 text-sm mt-1">Monitor opening and closing stock levels</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-400 transition flex items-center gap-2 text-sm">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add Record"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-coal-900 border border-coal-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">New Inventory Record</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-coal-400 block mb-1">Mine</label>
              <select value={form.mineId} onChange={(e) => setForm({ ...form, mineId: e.target.value })} className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2 text-white text-sm" required>
                <option value="">Select mine</option>
                {mines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-coal-400 block mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2 text-white text-sm" required />
            </div>
            <div>
              <label className="text-sm text-coal-400 block mb-1">Coal Grade</label>
              <select value={form.coalGrade} onChange={(e) => setForm({ ...form, coalGrade: e.target.value })} className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2 text-white text-sm">
                {COAL_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-coal-400 block mb-1">Opening Stock (MT)</label>
              <input type="number" step="0.01" value={form.openingStock} onChange={(e) => setForm({ ...form, openingStock: e.target.value })} className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2 text-white text-sm" required />
            </div>
            <div>
              <label className="text-sm text-coal-400 block mb-1">Closing Stock (MT)</label>
              <input type="number" step="0.01" value={form.closingStock} onChange={(e) => setForm({ ...form, closingStock: e.target.value })} className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2 text-white text-sm" required />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="mt-4 px-6 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-400 transition disabled:opacity-50 flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Record
          </button>
        </form>
      )}

      <div className="bg-coal-900 border border-coal-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-coal-400 border-b border-coal-800 bg-coal-900/80">
              <th className="text-left py-3 px-4">Mine</th>
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Grade</th>
              <th className="text-right py-3 px-4">Opening (MT)</th>
              <th className="text-right py-3 px-4">Closing (MT)</th>
              <th className="text-right py-3 px-4">Change</th>
            </tr></thead>
            <tbody>
              {records.slice(0, 50).map((r) => {
                const change = r.closingStock - r.openingStock;
                return (
                  <tr key={r.id} className="border-b border-coal-800/30 hover:bg-coal-800/30">
                    <td className="py-2.5 px-4 font-medium">{r.mineName}</td>
                    <td className="py-2.5 px-4 text-coal-300">{r.date}</td>
                    <td className="py-2.5 px-4"><span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-medium">{r.coalGrade}</span></td>
                    <td className="py-2.5 px-4 text-right font-mono">{r.openingStock}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{r.closingStock}</td>
                    <td className={`py-2.5 px-4 text-right font-mono ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>{change >= 0 ? "+" : ""}{change.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
