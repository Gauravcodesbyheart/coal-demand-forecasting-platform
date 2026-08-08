"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Clock, User, Activity } from "lucide-react";

interface AuditLog {
  id: number; userId: number; userName: string; action: string;
  entity: string; entityId: number | null; oldValue: unknown; newValue: unknown;
  ipAddress: string | null; createdAt: string;
}

const actionColors: Record<string, string> = {
  LOGIN: "bg-blue-500/20 text-blue-400",
  CREATE_PRODUCTION: "bg-emerald-500/20 text-emerald-400",
  CREATE_DISPATCH: "bg-cyan-500/20 text-cyan-400",
  CREATE_INVENTORY: "bg-purple-500/20 text-purple-400",
  RUN_FORECAST: "bg-amber-500/20 text-amber-400",
  UPLOAD_DATA: "bg-pink-500/20 text-pink-400",
  CREATE_USER: "bg-red-500/20 text-red-400",
  CREATE_MINE: "bg-green-500/20 text-green-400",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audit-logs").then((r) => r.json()).then((d) => {
      if (d.logs) setLogs(d.logs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-amber-400" /> Audit Logs
        </h2>
        <p className="text-coal-400 text-sm mt-1">
          Complete activity trail for compliance and security monitoring
        </p>
      </div>

      <div className="bg-coal-900 border border-coal-800 rounded-xl">
        {logs.length === 0 ? (
          <div className="p-10 text-center text-coal-400">No audit logs yet.</div>
        ) : (
          <div className="divide-y divide-coal-800/50">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-coal-800/20 transition">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-coal-800 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-coal-400">
                    {log.userName?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{log.userName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${actionColors[log.action] || "bg-coal-700 text-coal-300"}`}>
                        {log.action}
                      </span>
                      <span className="text-coal-500 text-xs">on {log.entity}</span>
                      {log.entityId && <span className="text-coal-600 text-xs">#{log.entityId}</span>}
                    </div>
                    {log.newValue != null && (
                      <p className="text-coal-400 text-xs mt-1 font-mono truncate">
                        {typeof log.newValue === 'object' ? JSON.stringify(log.newValue) : String(log.newValue)}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-coal-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(log.createdAt).toLocaleString()}</span>
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
