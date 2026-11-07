"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Search, Banknote, Landmark, Globe } from "lucide-react";
import { formatMoney, formatDate } from "@/lib/format";

type PaymentRow = {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  paidAt: string | null;
  invoiceId: string;
  invoiceNumber: string;
  currency: string;
  clientName: string;
  clientCompany: string | null;
};

const METHOD_STYLE: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  cash: { label: "Cash", icon: Banknote, className: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" },
  bank_transfer: { label: "Bank transfer", icon: Landmark, className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" },
  card: { label: "Card", icon: CreditCard, className: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400" },
  online: { label: "Online", icon: Globe, className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400" },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");

  useEffect(() => {
    fetch("/api/payments").then((r) => r.json()).then((d) => { setPayments(d); setLoading(false); });
  }, []);

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.invoiceNumber.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q) || (p.clientCompany || "").toLowerCase().includes(q) || (p.reference || "").toLowerCase().includes(q);
    return matchSearch && (!method || p.method === method);
  });

  // Totals grouped by currency (no fake conversion here)
  const totals = filtered.reduce<Record<string, number>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] || 0) + p.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <CreditCard size={28} className="text-blue-600" /> Payments
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{filtered.length} payments</p>
      </div>

      {/* Totals by currency */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.keys(totals).length === 0 ? (
          <div className="col-span-full text-sm text-gray-400">No payments yet</div>
        ) : Object.entries(totals).map(([cur, amount]) => (
          <div key={cur} className="bg-white dark:bg-gray-900 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Received ({cur})</p>
            <p className="text-2xl font-black text-emerald-600">{formatMoney(amount, cur)}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by invoice, client or reference..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-blue-400 text-gray-900 dark:text-white" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ key: "", label: "All" }, ...Object.entries(METHOD_STYLE).map(([key, v]) => ({ key, label: v.label }))].map((m) => (
            <button key={m.key} onClick={() => setMethod(m.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                method === m.key ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10"
              }`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-white/5 bg-gray-50 dark:bg-white/3">
                {["Date", "Invoice", "Client", "Method", "Reference", "Amount"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 dark:bg-white/5 rounded-full animate-pulse" /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-14 text-gray-400">
                  <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No payments found</p>
                </td></tr>
              ) : filtered.map((p, i) => {
                const m = METHOD_STYLE[p.method];
                const Icon = m?.icon || CreditCard;
                return (
                  <tr key={p.id} className={`hover:bg-gray-50 dark:hover:bg-white/3 transition-all ${i < filtered.length - 1 ? "border-b border-gray-50 dark:border-white/5" : ""}`}>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(p.paidAt)}</td>
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/invoices/${p.invoiceId}`} className="font-bold text-blue-600 dark:text-blue-400 text-sm no-underline hover:underline">{p.invoiceNumber}</Link>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">{p.clientCompany || p.clientName}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${m?.className}`}>
                        <Icon size={11} /> {m?.label || p.method}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 font-mono">{p.reference || "—"}</td>
                    <td className="px-5 py-4 font-bold text-emerald-600 text-sm whitespace-nowrap">{formatMoney(p.amount, p.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}