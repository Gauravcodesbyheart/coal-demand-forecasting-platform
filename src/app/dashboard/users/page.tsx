"use client";

import { useEffect, useState } from "react";
import { Users, Plus, X, Loader2, Shield } from "lucide-react";

interface User {
  id: number; email: string; name: string; role: string;
  isActive: boolean; createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "operator" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((d) => {
      if (d.users) setUsers(d.users);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setShowForm(false);
        setForm({ email: "", password: "", name: "", role: "operator" });
        const refreshed = await fetch("/api/users").then((r) => r.json());
        if (refreshed.users) setUsers(refreshed.users);
      } else { setError(data.error || "Failed"); }
    } catch { setError("Network error"); }
    setSubmitting(false);
  }

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/20 text-red-400",
    analyst: "bg-blue-500/20 text-blue-400",
    manager: "bg-emerald-500/20 text-emerald-400",
    operator: "bg-amber-500/20 text-amber-400",
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-amber-400" /> User Management</h2>
          <p className="text-coal-400 text-sm mt-1">Manage platform users and role-based access</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-amber-500 text-coal-900 font-semibold rounded-lg hover:bg-amber-400 transition flex items-center gap-2 text-sm">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add User"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-coal-900 border border-coal-800 rounded-xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-coal-400 block mb-1">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2 text-white text-sm" required />
            </div>
            <div>
              <label className="text-sm text-coal-400 block mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2 text-white text-sm" required />
            </div>
            <div>
              <label className="text-sm text-coal-400 block mb-1">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2 text-white text-sm" required />
            </div>
            <div>
              <label className="text-sm text-coal-400 block mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full bg-coal-800 border border-coal-700 rounded-lg px-3 py-2 text-white text-sm">
                <option value="operator">Operator</option>
                <option value="analyst">Analyst</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button type="submit" disabled={submitting} className="mt-4 px-6 py-2 bg-amber-500 text-coal-900 font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create User
          </button>
        </form>
      )}

      <div className="bg-coal-900 border border-coal-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-coal-400 border-b border-coal-800 bg-coal-900/80">
            <th className="text-left py-3 px-4">Name</th>
            <th className="text-left py-3 px-4">Email</th>
            <th className="text-left py-3 px-4">Role</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-left py-3 px-4">Created</th>
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-coal-800/30 hover:bg-coal-800/30">
                <td className="py-2.5 px-4 font-medium flex items-center gap-2">
                  <div className="w-7 h-7 bg-coal-700 rounded-full flex items-center justify-center text-xs font-bold">{u.name.charAt(0)}</div>
                  {u.name}
                </td>
                <td className="py-2.5 px-4 text-coal-300">{u.email}</td>
                <td className="py-2.5 px-4">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium uppercase ${roleColors[u.role] || ""}`}>
                    <Shield className="w-3 h-3 inline mr-1" />{u.role}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <span className={`text-xs px-2 py-0.5 rounded ${u.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-coal-400">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
