"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Download, TrendingUp, AlertCircle, Users } from "lucide-react";
import { formatMoney, formatDate, STATUS_STYLES } from "@/lib/format";

type Stats = {
  totalRevenue: number;
  outstanding: number;
  overdueAmount: number;
  thisMonth: number;
  counts: Record<string, number>;
  monthly: Array<{ label: string; amount: number }>;
};

type ClientRow = {
  id: string; name: string; companyName: string | null;
  invoiceCount: number; totalBilled: number; totalPaid: number;
};

type InvoiceRow = {
  id: string; invoiceNumber: string; status: string; currency: string; total: number;
  issueDate: string | null; dueDate: string | null; clientName: string; clientCompany: string | null;
};

const BAR_COLORS: Record<string, string> = {
  draft: "bg-gray-400", sent: "bg-blue-500", paid: "bg-emerald-500", overdue: "bg-red-500", cancelled: "bg-gray-300",
};

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/invoices").then((r) => r.json()),
    ]).then(([s, c, i]) => { setStats(s); setClients(c); setInvoices(i); setLoading(false); });
  }, []);

  const exportCSV = () => {
    const header = ["Invoice", "Client", "Status", "Currency", "Total", "Issue Date", "Due Date"];
    const rows = invoices.map((i) => [
      i.invoiceNumber, i.clientCompany || i.clientName, i.status, i.currency, i.total, formatDate(i.issueDate), formatDate(i.dueDate),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "billflow-invoices.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxMonthly = Math.max(...(stats?.monthly.map((m) => m.amount) || [0]), 1);
  const totalCount = Object.values(stats?.counts || {}).reduce((a, b) => a + b, 0) || 1;
  const topClients = [...clients].sort((a, b) => b.totalBilled - a.totalBilled).slice(0, 5);
  const overdue = invoices.filter((i) => i.status === "overdue");
  const collectionRate = stats && stats.totalRevenue + stats.outstanding > 0
    ? Math.round((stats.totalRevenue / (stats.totalRevenue + stats.outstanding)) * 100) : 0;

  if (loading) return <div className="h-96 bg-white dark:bg-gray-900 rounded-3xl animate-pulse border border-gray-100 dark:border-white/5" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 size={28} className="text-blue-600" /> Reports
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Amounts shown in USD equivalent</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatMoney(stats?.totalRevenue || 0), color: "text-emerald-600" },
          { label: "Outstanding", value: formatMoney(stats?.outstanding || 0), color: "text-blue-600" },
          { label: "Overdue", value: formatMoney(stats?.overdueAmount || 0), color: "text-red-500" },
          { label: "Collection Rate", value: `${collectionRate}%`, color: "text-purple-600" },
        ].map((c) => (
          <div key={c.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">{c.label}</p>
            <p className={`text-2xl font-black mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly revenue */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2"><TrendingUp size={18} className="text-blue-600" /> Monthly revenue</h2>
          <p className="text-xs text-gray-400 mb-6">Last 6 months · payments received</p>
          <div className="flex items-end justify-between gap-3 h-48">
            {(stats?.monthly || []).map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{m.amount > 0 ? `$${m.amount.toLocaleString()}` : ""}</span>
                <div className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-xl min-h-[4px]"
                  style={{ height: `${Math.max((m.amount / maxMonthly) * 80, 2)}%`, opacity: m.amount > 0 ? 1 : 0.2 }} />
                <span className="text-xs text-gray-400">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Invoice status</h2>
          <div className="flex h-3 rounded-full overflow-hidden mb-5 bg-gray-100 dark:bg-white/10">
            {Object.keys(STATUS_STYLES).map((k) => (
              <div key={k} className={BAR_COLORS[k]} style={{ width: `${((stats?.counts?.[k] || 0) / totalCount) * 100}%` }} />
            ))}
          </div>
          <div className="space-y-2.5">
            {Object.entries(STATUS_STYLES).map(([k, cfg]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <span className={`w-2.5 h-2.5 rounded-full ${BAR_COLORS[k]}`} /> {cfg.label}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">{stats?.counts?.[k] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top clients */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 dark:border-white/5">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Users size={18} className="text-purple-500" /> Top clients</h2>
          </div>
          {topClients.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No data yet</div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {topClients.map((c, i) => (
                <div key={c.id} className="flex items-center gap-4 px-6 py-3.5">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-sm font-black text-blue-600 dark:text-blue-400">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{c.companyName || c.name}</p>
                    <p className="text-xs text-gray-400">{c.invoiceCount} invoices</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{formatMoney(c.totalBilled)}</p>
                    <p className="text-xs text-emerald-600">{formatMoney(c.totalPaid)} paid</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-100 dark:border-red-500/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-50 dark:border-red-500/10">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" /> Overdue invoices ({overdue.length})
            </h2>
          </div>
          {overdue.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No overdue invoices ✓</div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {overdue.map((i) => {
                const days = i.dueDate ? Math.max(Math.floor((Date.now() - new Date(i.dueDate).getTime()) / 86400000), 0) : 0;
                return (
                  <Link key={i.id} href={`/dashboard/invoices/${i.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 no-underline hover:bg-gray-50 dark:hover:bg-white/3 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{i.invoiceNumber}</p>
                      <p className="text-xs text-gray-400 truncate">{i.clientCompany || i.clientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-500 text-sm">{formatMoney(i.total, i.currency)}</p>
                      <p className="text-xs text-gray-400">{days} days late</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}