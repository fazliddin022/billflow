"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Send, CheckCircle, Ban, Printer, Link2,
  Check, Trash2, CreditCard, X,
} from "lucide-react";
import InvoiceDocument, { InvoiceDoc } from "@/components/InvoiceDocument";
import { formatMoney, formatDate, STATUS_STYLES } from "@/lib/format";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [pay, setPay] = useState({ amount: "", method: "bank_transfer", reference: "", notes: "" });
  const [payError, setPayError] = useState("");

  const fetchInvoice = useCallback(async () => {
    const res = await fetch(`/api/invoices/${id}`);
    if (!res.ok) { setLoading(false); return; }
    setInvoice(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

  const setStatus = async (status: string) => {
    setBusy(true);
    await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchInvoice();
    setBusy(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this invoice permanently?")) return;
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/invoices");
    else alert("Only admin or manager can delete invoices");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/invoice/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const paid = invoice?.payments.reduce((s, p) => s + p.amount, 0) || 0;
  const balance = invoice ? Math.max(invoice.total - paid, 0) : 0;

  const openPay = () => {
    setPay({ amount: String(balance), method: "bank_transfer", reference: "", notes: "" });
    setPayError("");
    setShowPay(true);
  };

  const handlePay = async () => {
    const amount = Math.round(Number(pay.amount) || 0);
    if (amount <= 0) { setPayError("Enter a valid amount"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: id, amount, method: pay.method, reference: pay.reference, notes: pay.notes }),
      });
      if (!res.ok) { const d = await res.json(); setPayError(d.error || "Error"); return; }
      setShowPay(false);
      await fetchInvoice();
    } finally { setBusy(false); }
  };

  if (loading) return <div className="h-96 bg-white dark:bg-gray-900 rounded-3xl animate-pulse border border-gray-100 dark:border-white/5" />;
  if (!invoice) return <div className="text-center py-20 text-gray-400">Invoice not found</div>;

  const st = STATUS_STYLES[invoice.status];
  const canPay = invoice.status !== "paid" && invoice.status !== "cancelled" && invoice.status !== "draft";
  const inputClass = "w-full px-4 py-2.5 border-2 border-gray-200 dark:border-white/10 rounded-xl text-sm bg-transparent text-gray-900 dark:text-white outline-none focus:border-blue-400 transition-all";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/invoices" className="p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{invoice.invoiceNumber}</h1>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st?.className}`}>{st?.label}</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {invoice.status === "draft" && (
            <button onClick={() => setStatus("sent")} disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all">
              <Send size={14} /> Mark as Sent
            </button>
          )}
          {canPay && (
            <button onClick={openPay} disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all">
              <CreditCard size={14} /> Record Payment
            </button>
          )}
          {canPay && (
            <button onClick={() => setStatus("paid")} disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-900 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 disabled:opacity-50 transition-all">
              <CheckCircle size={14} /> Mark as Paid
            </button>
          )}
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <button onClick={() => confirm("Cancel this invoice?") && setStatus("cancelled")} disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 text-sm font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition-all">
              <Ban size={14} /> Cancel
            </button>
          )}
          <button onClick={copyLink}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
            {copied ? <><Check size={14} className="text-emerald-500" /> Copied!</> : <><Link2 size={14} /> Public link</>}
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
            <Printer size={14} /> Print / PDF
          </button>
          <button onClick={handleDelete}
            className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <InvoiceDocument invoice={invoice} />

      {/* Payment history */}
      {invoice.payments.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden print:hidden">
          <div className="px-6 py-4 border-b border-gray-50 dark:border-white/5">
            <h2 className="font-bold text-gray-900 dark:text-white">Payment history</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {invoice.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-6 py-3.5">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm capitalize">{p.method.replace("_", " ")}</p>
                  <p className="text-xs text-gray-400">{formatDate(p.paidAt)}{p.reference ? ` · ${p.reference}` : ""}</p>
                </div>
                <p className="font-bold text-emerald-600">{formatMoney(p.amount, invoice.currency)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPay && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md border border-gray-100 dark:border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-gray-900 dark:text-white text-xl">Record Payment</h2>
              <button onClick={() => setShowPay(false)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-xl text-gray-500"><X size={16} /></button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Balance due: <strong className="text-gray-900 dark:text-white">{formatMoney(balance, invoice.currency)}</strong>
            </p>
            <div className="space-y-3">
              <input type="number" min="1" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} placeholder="Amount" className={inputClass} />
              <select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} className={`${inputClass} bg-white dark:bg-gray-900`}>
                <option value="bank_transfer">Bank transfer</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="online">Online</option>
              </select>
              <input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} placeholder="Reference (optional)" className={inputClass} />
              <textarea value={pay.notes} onChange={(e) => setPay({ ...pay, notes: e.target.value })} placeholder="Notes (optional)" rows={2} className={`${inputClass} resize-none`} />
              {payError && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-red-600 dark:text-red-400">{payError}</div>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPay(false)} className="flex-1 py-3 bg-gray-100 dark:bg-white/10 rounded-2xl text-sm font-semibold text-gray-600 dark:text-gray-400">Cancel</button>
              <button onClick={handlePay} disabled={busy}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
                <Check size={16} /> {busy ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}