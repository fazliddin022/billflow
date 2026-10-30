"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Receipt, Mail, Lock, Eye, EyeOff, Sun, Moon } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState("light");
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    if (res?.error) { setError("Invalid email or password!"); return; }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 flex items-center justify-center p-4 transition-colors duration-300">
      <button onClick={toggleTheme} className="fixed top-4 right-4 p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 transition-all">
        {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left */}
        <div className="hidden lg:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Receipt size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">BillFlow</h1>
              <p className="text-sm text-gray-500">Invoice & Billing</p>
            </div>
          </div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white leading-tight mb-4">
            Get paid <span className="text-blue-600">faster</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Create invoices, track payments and manage clients in one place.</p>
          <div className="space-y-3">
            {[
              { icon: "🧾", title: "Smart Invoices", desc: "Create and send in seconds" },
              { icon: "👥", title: "Client Management", desc: "All your clients in one place" },
              { icon: "💰", title: "Payment Tracking", desc: "Paid, unpaid and overdue" },
              { icon: "📈", title: "Revenue Reports", desc: "Know where your money is" },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-gray-100 dark:border-white/10">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{f.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-white/10 p-8">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <Receipt size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">BillFlow</h1>
          </div>

          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Welcome back!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Sign in to your account</p>

          <div className="space-y-4">
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="your@email.com"
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 dark:border-white/10 rounded-2xl text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-400 transition-all" />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showPassword ? "text" : "password"} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 border-2 border-gray-200 dark:border-white/10 rounded-2xl text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-400 transition-all" />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>

          <div className="mt-5 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5">Demo accounts:</p>
            <div className="space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
              <p>👑 admin@billflow.com / admin123</p>
              <p>📋 manager@billflow.com / manager123</p>
              <p>🧮 accountant@billflow.com / accountant123</p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            No account?{" "}
            <Link href="/register" className="text-blue-600 font-bold no-underline hover:text-blue-700">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}