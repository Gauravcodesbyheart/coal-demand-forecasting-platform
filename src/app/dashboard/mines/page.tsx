"use client";

import { useEffect, useState } from "react";
import { Settings, Plus, X, Loader2, MapPin } from "lucide-react";

interface Mine {
  id: number; name: string; location: string | null;
  capacity: number | null; isActive: boolean; createdAt: string;
}

export default function MinesPage() {
  const [mines, setMines] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", capacity: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/mines").then((r) => r.json()).then((d) => {
      setMines(d.mines || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/mines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, location: form.location || null, capacity: form.capacity ? parseFloat(form.capacity) : null }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: "", location: "", capacity: "" });
        const refreshed = await fetch("/api/mines").then((r) => r.json());
        setMines(refreshed.mines || []);
      } else { const err = await res.json(); alert(err.error); }
    } catch { alert("Error"); }
    setSubmitting(false);
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6 text-amber-400" /> Mine Management</h2>
          <p className="text-coal-400 text-sm mt-1">Manage CCL mine locations and capacity</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-amber-500 text-coal-900 font-semibold rounded-lg hover:bg-amber-400 transition flex items-center gap-2 text-sm">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add Mine"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-coal-900 border border-coal-800 rounded-xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-coal-400 block mb-1">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2 text-white text-sm" required />
            </div>
            <div>
              <label className="text-sm text-coal-400 block mb-1">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-sm text-coal-400 block mb-1">Capacity (MT/month)</label>
              <input type="number" step="0.1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="mt-4 px-6 py-2 bg-amber-500 text-coal-900 font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Mine
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mines.map((mine) => (
          <div key={mine.id} className="bg-coal-900 border border-coal-800 rounded-xl p-5 hover:border-coal-700 transition">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold">{mine.name}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded ${mine.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                {mine.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
            {mine.location && (
              <p className="text-coal-400 text-sm flex items-center gap-1 mb-2">
                <MapPin className="w-3 h-3" /> {mine.location}
              </p>
            )}
            {mine.capacity && (
              <div className="bg-coal-800 rounded-lg px-3 py-2 inline-block">
                <span className="text-coal-500 text-xs">Capacity: </span>
                <span className="text-amber-400 font-bold">{mine.capacity} MT/mo</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
