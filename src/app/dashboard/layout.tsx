"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, BarChart3, TrendingUp, Pickaxe, Truck,
  Package, Upload, Users, Bell, ClipboardList, Settings,
  LogOut, Menu, X, Zap, ChevronRight, FlaskConical,
} from "lucide-react";

interface UserInfo {
  userId: number;
  email: string;
  role: string;
  name: string;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "view_dashboard" },
  { href: "/dashboard/forecast", label: "Forecasting", icon: TrendingUp, permission: "view_forecasts" },
  { href: "/dashboard/what-if", label: "What-If Analysis", icon: FlaskConical, permission: "what_if_analysis" },
  { href: "/dashboard/production", label: "Production", icon: Pickaxe, permission: "enter_production" },
  { href: "/dashboard/dispatch", label: "Dispatch", icon: Truck, permission: "enter_dispatch" },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package, permission: "update_inventory" },
  { href: "/dashboard/upload", label: "Data Upload", icon: Upload, permission: "upload_data" },
  { href: "/dashboard/mines", label: "Mines", icon: Settings, permission: "view_dashboard" },
  { href: "/dashboard/users", label: "Users", icon: Users, permission: "manage_users" },
  { href: "/dashboard/audit-logs", label: "Audit Logs", icon: ClipboardList, permission: "view_audit_logs" },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell, permission: "view_notifications" },
];

const rolePermissions: Record<string, string[]> = {
  admin: [
    "manage_users","manage_mines","manage_roles","view_dashboard","run_forecasts",
    "view_forecasts","view_audit_logs","upload_data","enter_production",
    "enter_dispatch","update_inventory","view_recommendations","what_if_analysis",
    "generate_reports","view_notifications",
  ],
  analyst: ["upload_data","run_forecasts","view_forecasts","view_dashboard","generate_reports","view_recommendations","view_notifications","what_if_analysis"],
  manager: ["view_dashboard","view_forecasts","view_recommendations","what_if_analysis","generate_reports","view_notifications"],
  operator: ["enter_production","enter_dispatch","update_inventory","view_dashboard","view_notifications"],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
        else router.push("/");
      })
      .catch(() => router.push("/"));

    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        if (d.unreadCount) setUnreadCount(d.unreadCount);
      })
      .catch(() => {});
  }, [router]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-coal-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const userPerms = rolePermissions[user.role] || [];
  const filteredNav = navItems.filter((item) => userPerms.includes(item.permission));

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/20 text-red-400",
    analyst: "bg-blue-500/20 text-blue-400",
    manager: "bg-emerald-500/20 text-emerald-400",
    operator: "bg-amber-500/20 text-amber-400",
  };

  return (
    <div className="min-h-screen bg-coal-950 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-coal-900 border-r border-coal-800 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-coal-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-coal-900" />
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight">CoalSense AI</h1>
                <p className="text-coal-500 text-[10px] uppercase tracking-widest">CCL Platform</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden ml-auto text-coal-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "text-coal-400 hover:text-white hover:bg-coal-800/50"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                  {item.label === "Notifications" && unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-coal-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-coal-700 rounded-full flex items-center justify-center text-sm font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${roleColors[user.role] || ""}`}>
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-coal-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-coal-950/80 backdrop-blur-xl border-b border-coal-800 px-4 lg:px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-coal-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-coal-400">
              <LayoutDashboard className="w-4 h-4" />
              <ChevronRight className="w-3 h-3" />
              <span className="text-white font-medium capitalize">
                {pathname === "/dashboard"
                  ? "Overview"
                  : pathname.split("/").pop()?.replace(/-/g, " ")}
              </span>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
