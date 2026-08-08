"use client";

import { useEffect, useState } from "react";
import { Pickaxe, Plus, X, Loader2 } from "lucide-react";

interface ProductionRecord {
  id: number;
  mineId: number;
  mineName: string;
  date: string;
  coalGrade: string;
  quantity: number;
  shift: string;
  productionCost: number | null;
  createdAt: string;
}

interface Mine { id: number; name: string; }

const COAL_GRADES = ["G5","G6","G7","G8","G9","G10"];
const SHIFTS = ["A","B","C","General"];

export default function ProductionPage() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ mineId: "", date: "", coalGrade: "G5", quantity: "", shift: "General", productionCost: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/production").then((r) => r.json()),
      fetch("/api/mines").then((r) => r.json()),
    ]).then(([prodData, mineData]) => {
      setRecords(prodData.records || []);
      setMines(mineData.mines || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mineId: parseInt(form.mineId),
          date: form.date,
          coalGrade: form.coalGrade,
          quantity: parseFloat(form.quantity),
          shift: form.shift,
          productionCost: form.productionCost ? parseFloat(form.productionCost) : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowForm(false);
        // Refresh
        const refreshed = await fetch("/api/production").then((r) => r.json());
        setRecords(refreshed.records || []);
      } else {
        const err = await res.json();
        alert(err.error || "Failed");
      }
    } catch { alert("Error"); }
    setSubmitting(false);
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Pickaxe className="w-6 h-6 text-amber-400" /> Production Records</h2>
          <p className="text-coal-400 text-sm mt-1">Track and manage coal production data across all mines</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-amber-500 text-coal-900 font-semibold rounded-lg hover:bg-amber-400 transition flex items-center gap-2 text-sm">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add Record"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-coal-900 border border-coal-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">New Production Record</h3>
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
              <label className="text-sm text-coal-400 block mb-1">Quantity (Tonnes)</label>
              <input type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2 text-white text-sm" required />
            </div>
            <div>
              <label className="text-sm text-coal-400 block mb-1">Shift</label>
              <select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2 text-white text-sm">
                {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-coal-400 block mb-1">Production Cost (₹)</label>
              <input type="number" step="0.01" value={form.productionCost} onChange={(e) => setForm({ ...form, productionCost: e.target.value })} className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="mt-4 px-6 py-2 bg-amber-500 text-coal-900 font-semibold rounded-lg hover:bg-amber-400 transition disabled:opacity-50 flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Record
          </button>
        </form>
      )}

      <div className="bg-coal-900 border border-coal-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-coal-400 border-b border-coal-800 bg-coal-900/80">
                <th className="text-left py-3 px-4">Mine</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Grade</th>
                <th className="text-right py-3 px-4">Quantity (T)</th>
                <th className="text-left py-3 px-4">Shift</th>
                <th className="text-right py-3 px-4">Cost (₹)</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 50).map((r) => (
                <tr key={r.id} className="border-b border-coal-800/30 hover:bg-coal-800/30">
                  <td className="py-2.5 px-4 font-medium">{r.mineName}</td>
                  <td className="py-2.5 px-4 text-coal-300">{r.date}</td>
                  <td className="py-2.5 px-4"><span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-xs font-medium">{r.coalGrade}</span></td>
                  <td className="py-2.5 px-4 text-right font-mono">{r.quantity}</td>
                  <td className="py-2.5 px-4 text-coal-300">{r.shift}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-coal-300">{r.productionCost ? `₹${r.productionCost}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {records.length > 50 && (
          <div className="text-center py-3 text-coal-500 text-sm border-t border-coal-800">
            Showing 50 of {records.length} records
          </div>
        )}
      </div>
    </div>
  );
}
