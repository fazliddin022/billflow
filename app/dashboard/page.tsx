"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  DollarSign, Clock, AlertCircle, TrendingUp,
  FileText, Users, ArrowRight,
} from "lucide-react";
import { formatMoney, formatDate, STATUS_STYLES } from "@/lib/format";

type Stats = {
  totalRevenue: number;
  outstanding: number;
  overdueAmount: number;
  thisMonth: number;
  totalClients: number;
  totalInvoices: number;
  counts: Record<string, number>;
  monthly: Array<{ label: string; amount: number }>;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    currency: string;
    total: number;
    dueDate: string | null;
    clientName: string;
    clientCompany: string | null;
  }>;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); });
  }, []);

  const maxMonthly = Math.max(...(stats?.monthly.map((m) => m.amount) || [0]), 1);

  const cards = [
    { label: "Total Revenue", value: formatMoney(stats?.totalRevenue || 0), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-100 dark:border-emerald-500/20" },
    { label: "Outstanding", value: formatMoney(stats?.outstanding || 0), icon: Clock, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-100 dark:border-blue-500/20" },
    { label: "Overdue", value: formatMoney(stats?.overdueAmount || 0), icon: AlertCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-100 dark:border-red-500/20" },
    { label: "This Month", value: formatMoney(stats?.thisMonth || 0), icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-100 dark:border-purple-500/20" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          Hello, {session?.user?.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          {" · "}amounts shown in USD equivalent
        </p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white dark:bg-gray-900 rounded-2xl animate-pulse border border-gray-100 dark:border-white/5" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className={`bg-white dark:bg-gray-900 rounded-2xl border ${c.border} p-5`}>
              <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
                <c.icon size={20} className={c.color} />
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{c.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-1">Revenue (last 6 months)</h2>
          <p className="text-xs text-gray-400 mb-6">Payments received</p>
          <div className="flex items-end justify-between gap-3 h-48">
            {(stats?.monthly || []).map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {m.amount > 0 ? `$${m.amount.toLocaleString()}` : ""}
                </span>
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-xl transition-all min-h-[4px]"
                  style={{ height: `${Math.max((m.amount / maxMonthly) * 80, 2)}%`, opacity: m.amount > 0 ? 1 : 0.2 }}
                />
                <span className="text-xs text-gray-400">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Invoice Status</h2>
          <div className="space-y-3">
            {Object.entries(STATUS_STYLES).map(([key, cfg]) => (
              <Link key={key} href={`/dashboard/invoices?status=${key}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 no-underline transition-all">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.className}`}>{cfg.label}</span>
                <span className="font-black text-gray-900 dark:text-white">{stats?.counts?.[key] ?? 0}</span>
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <FileText size={15} className="text-blue-500" /> {stats?.totalInvoices ?? 0} invoices
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Users size={15} className="text-purple-500" /> {stats?.totalClients ?? 0} clients
            </div>
          </div>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText size={18} className="text-blue-600" /> Recent Invoices
          </h2>
          <Link href="/dashboard/invoices" className="flex items-center gap-1 text-xs text-blue-600 font-semibold no-underline hover:underline">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-50 dark:bg-white/5 rounded-xl animate-pulse" />)}</div>
        ) : (stats?.recentInvoices.length || 0) === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No invoices yet</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {stats?.recentInvoices.map((inv) => {
              const st = STATUS_STYLES[inv.status];
              return (
                <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`}
                  className="flex items-center gap-4 px-6 py-4 no-underline hover:bg-gray-50 dark:hover:bg-white/3 transition-all">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-400 truncate">{inv.clientCompany || inv.clientName} · due {formatDate(inv.dueDate)}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${st?.className}`}>{st?.label}</span>
                  <p className="font-bold text-gray-900 dark:text-white text-sm w-32 text-right flex-shrink-0">
                    {formatMoney(inv.total, inv.currency)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}