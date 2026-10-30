"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Receipt, Mail, Lock, Eye, EyeOff, User, Sun, Moon } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState("light");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

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
    if (!form.name || !form.email || !form.password) return;
    if (form.password.length < 6) { setError("Password must be at least 6 characters!"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      router.push("/dashboard");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 flex items-center justify-center p-4 transition-colors duration-300">
      <button onClick={toggleTheme} className="fixed top-4 right-4 p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 transition-all">
        {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mx-auto mb-3">
            <Receipt size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">BillFlow</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create your account</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-white/10 p-8">
          <div className="space-y-4">
            <div className="relative">
              <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name *"
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 dark:border-white/10 rounded-2xl text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-400 transition-all" />
            </div>
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email *"
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 dark:border-white/10 rounded-2xl text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-400 transition-all" />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showPassword ? "text" : "password"} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Password (min 6) *"
                className="w-full pl-11 pr-11 py-3 border-2 border-gray-200 dark:border-white/10 rounded-2xl text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-400 transition-all" />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}

            <button onClick={handleSubmit} disabled={loading || !form.name || !form.email || !form.password}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20">
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            Have an account?{" "}
            <Link href="/login" className="text-blue-600 font-bold no-underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}