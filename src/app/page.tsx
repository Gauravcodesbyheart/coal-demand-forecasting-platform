"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Shield,
  Zap,
  ChevronRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const seedInitiated = useRef(false);

  useEffect(() => {
    // Check if user already logged in
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) router.push("/dashboard");
      })
      .catch(() => {});

    // Auto-seed database, ensuring it only runs once
    if (!seedInitiated.current) {
      seedInitiated.current = true;
      fetch("/api/seed", { method: "POST" })
        .then((r) => r.json())
        .then(() => setSeeded(true))
        .catch(() => setSeeded(true));
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const demoAccounts = [
    { role: "Admin", email: "admin@coalsense.ai", password: "admin123", color: "bg-red-500/20 text-red-400 border-red-500/30" },
    { role: "Analyst", email: "analyst@coalsense.ai", password: "analyst123", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { role: "Manager", email: "manager@coalsense.ai", password: "manager123", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    { role: "Operator", email: "operator@coalsense.ai", password: "operator123", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-coal-900 via-coal-800 to-coal-950 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 bg-amber-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-coal-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">CoalSense AI</h1>
              <p className="text-coal-400 text-sm">Central Coalfields Limited</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <h2 className="text-4xl font-bold leading-tight">
            Intelligent Coal
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
              Demand Forecasting
            </span>
            <br />& Production Planning
          </h2>
          <p className="text-coal-300 text-lg max-w-md">
            AI-powered decision support platform that forecasts demand, optimizes
            production planning, and identifies supply gaps — transforming data
            into actionable intelligence.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { icon: BarChart3, label: "Multi-Model Forecasting", desc: "4 ML models + ensemble" },
              { icon: Activity, label: "Real-time Analytics", desc: "Production & dispatch insights" },
              { icon: Shield, label: "Role-Based Access", desc: "Enterprise-grade security" },
              { icon: Zap, label: "What-If Analysis", desc: "Scenario planning tool" },
            ].map((f, i) => (
              <div key={i} className="bg-coal-800/50 border border-coal-700/50 rounded-xl p-4">
                <f.icon className="w-5 h-5 text-amber-400 mb-2" />
                <p className="font-semibold text-sm">{f.label}</p>
                <p className="text-coal-400 text-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-coal-500 text-sm">
          © 2024 CoalSense AI • CCL Internship Project
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-coal-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-coal-900" />
            </div>
            <h1 className="text-xl font-bold">CoalSense AI</h1>
          </div>

          <div className="bg-coal-900 border border-coal-800 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-1">Welcome back</h3>
            <p className="text-coal-400 mb-8">Sign in to your CoalSense AI account</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-coal-300 mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coal-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-coal-800 border border-coal-700 rounded-lg text-white placeholder-coal-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                    placeholder="you@coalsense.ai"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-coal-300 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coal-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-coal-800 border border-coal-700 rounded-lg text-white placeholder-coal-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-coal-500 hover:text-coal-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-coal-900 font-semibold rounded-lg hover:from-amber-400 hover:to-amber-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Sign In <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Demo accounts */}
          <div className="mt-6">
            <p className="text-coal-500 text-xs uppercase tracking-wider font-medium mb-3 text-center">
              Demo Accounts — Click to autofill
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                    setError("");
                  }}
                  className={`${acc.color} border rounded-lg px-3 py-2 text-xs font-medium hover:opacity-80 transition text-left`}
                >
                  <span className="font-bold">{acc.role}</span>
                  <br />
                  <span className="opacity-70">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
