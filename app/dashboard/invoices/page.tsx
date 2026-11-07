"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import { formatMoney, formatDate, STATUS_STYLES } from "@/lib/format";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  total: number;
  issueDate: string | null;
  dueDate: string | null;
  clientName: string;
  clientCompany: string | null;
};

function InvoicesContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("client") || "";
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [search, setSearch] = useState("");

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    if (clientId) params.set("client", clientId);
    const res = await fetch(`/api/invoices?${params}`);
    setInvoices(await res.json());
    setLoading(false);
  }, [status, search, clientId]);

  useEffect(() => {
    const t = setTimeout(fetchInvoices, 250);
    return () => clearTimeout(t);
  }, [fetchInvoices]);

  const TABS = [{ key: "", label: "All" }, ...Object.entries(STATUS_STYLES).map(([key, v]) => ({ key, label: v.label }))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <FileText size={28} className="text-blue-600" /> Invoices
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{invoices.length} invoices{clientId ? " (filtered by client)" : ""}</p>
        </div>
        <Link href="/dashboard/invoices/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl no-underline hover:opacity-90 shadow-lg shadow-blue-500/20">
          <Plus size={16} /> New Invoice
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by number or client..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-blue-400 text-gray-900 dark:text-white" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setStatus(t.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                status === t.key
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-white/5 bg-gray-50 dark:bg-white/3">
                {["Invoice", "Client", "Issued", "Due", "Status", "Amount"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 dark:bg-white/5 rounded-full animate-pulse" /></td>)}</tr>
                ))
              ) : invoices.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-14 text-gray-400">
                  <FileText size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No invoices found</p>
                </td></tr>
              ) : invoices.map((inv, i) => {
                const st = STATUS_STYLES[inv.status];
                return (
                  <tr key={inv.id} className={`hover:bg-gray-50 dark:hover:bg-white/3 transition-all ${i < invoices.length - 1 ? "border-b border-gray-50 dark:border-white/5" : ""}`}>
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="font-bold text-blue-600 dark:text-blue-400 text-sm no-underline hover:underline">{inv.invoiceNumber}</Link>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{inv.clientCompany || inv.clientName}</p>
                      {inv.clientCompany && <p className="text-xs text-gray-400">{inv.clientName}</p>}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(inv.issueDate)}</td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(inv.dueDate)}</td>
                    <td className="px-5 py-4"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st?.className}`}>{st?.label}</span></td>
                    <td className="px-5 py-4 font-bold text-gray-900 dark:text-white text-sm whitespace-nowrap">{formatMoney(inv.total, inv.currency)}</td>
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

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
      <InvoicesContent />
    </Suspense>
  );
}