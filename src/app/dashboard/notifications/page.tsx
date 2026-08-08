"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, AlertTriangle, Info, Activity, Zap } from "lucide-react";

interface Notification {
  id: number; userId: number; type: string; title: string;
  message: string; isRead: boolean; createdAt: string;
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  demand_alert: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  inventory_alert: { icon: Activity, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  production_alert: { icon: Zap, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  forecast_complete: { icon: CheckCheck, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  system: { icon: Info, color: "text-coal-400", bg: "bg-coal-800 border-coal-700" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => {
      setNotifications(d.notifications || []);
      setUnreadCount(d.unreadCount || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" /> Notifications
          </h2>
          <p className="text-coal-400 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="px-4 py-2 bg-coal-800 border border-coal-700 text-sm text-coal-300 rounded-lg hover:text-white transition flex items-center gap-2">
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 && (
          <div className="bg-coal-900 border border-coal-800 rounded-xl p-10 text-center text-coal-400">
            No notifications yet.
          </div>
        )}
        {notifications.map((n) => {
          const config = typeConfig[n.type] || typeConfig.system;
          const Icon = config.icon;
          return (
            <div key={n.id} className={`border rounded-xl p-4 transition ${n.isRead ? "bg-coal-900 border-coal-800 opacity-70" : config.bg}`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.isRead ? "bg-coal-800" : "bg-coal-800/50"}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
                  </div>
                  <p className="text-coal-300 text-sm mt-1">{n.message}</p>
                  <p className="text-coal-500 text-xs mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
