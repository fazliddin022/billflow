"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, Send } from "lucide-react";
import { formatMoney } from "@/lib/format";

type Client = { id: string; name: string; companyName: string | null };
type Item = { description: string; quantity: string; unitPrice: string };

const today = () => new Date().toISOString().split("T")[0];
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().split("T")[0];

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [clientId, setClientId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [issueDate, setIssueDate] = useState(today());
  const [dueDate, setDueDate] = useState(inDays(30));
  const [taxRate, setTaxRate] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Payment due within the due date. Late payments may incur a fee.");
  const [items, setItems] = useState<Item[]>([{ description: "", quantity: "1", unitPrice: "" }]);

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then((data) => { setClients(data); setLoading(false); });
  }, []);

  const updateItem = (idx: number, patch: Partial<Item>) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const addItem = () => setItems([...items, { description: "", quantity: "1", unitPrice: "" }]);
  const removeItem = (idx: number) => items.length > 1 && setItems(items.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + Math.round((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)), 0);
  const disc = Math.round(Number(discount) || 0);
  const taxAmount = Math.round(((subtotal - disc) * (Number(taxRate) || 0)) / 100);
  const total = subtotal - disc + taxAmount;

  const handleSave = async (status: "draft" | "sent") => {
    setError("");
    if (!clientId) { setError("Please select a client"); return; }
    const valid = items.filter((i) => i.description.trim() && Number(i.unitPrice) > 0);
    if (valid.length === 0) { setError("Add at least one item with a description and price"); return; }
    if (dueDate && issueDate && dueDate < issueDate) { setError("Due date cannot be before issue date"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId, currency, status, issueDate, dueDate,
          taxRate: Number(taxRate) || 0,
          discount: disc,
          notes, terms,
          items: valid,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      router.push(`/dashboard/invoices/${data.id}`);
    } finally { setSaving(false); }
  };

  const inputClass = "w-full px-4 py-2.5 border-2 border-gray-200 dark:border-white/10 rounded-xl text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-400 transition-all";
  const labelClass = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/invoices" className="p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">New Invoice</h1>
      </div>

      {!loading && clients.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-2xl p-4 text-sm text-yellow-700 dark:text-yellow-400">
          You have no clients yet. <Link href="/dashboard/clients" className="font-bold underline">Add a client first</Link>.
        </div>
      )}

      {/* Details */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-6 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white">Invoice details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Client *</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={`${inputClass} bg-white dark:bg-gray-900`}>
              <option value="">Select client...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.companyName ? `${c.companyName} — ${c.name}` : c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={`${inputClass} bg-white dark:bg-gray-900`}>
              {["USD", "EUR", "UZS", "RUB"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Issue date</label>
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white">Items</h2>
          <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all">
            <Plus size={13} /> Add item
          </button>
        </div>

        <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
          <div className="col-span-6">Description</div>
          <div className="col-span-2">Qty</div>
          <div className="col-span-2">Unit price</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>

        {items.map((item, idx) => {
          const amount = Math.round((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
          return (
            <div key={idx} className="grid grid-cols-12 gap-3 items-center">
              <input value={item.description} onChange={(e) => updateItem(idx, { description: e.target.value })}
                placeholder="Service or product description" className={`${inputClass} col-span-12 sm:col-span-6`} />
              <input type="number" min="0" step="any" value={item.quantity} onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                className={`${inputClass} col-span-4 sm:col-span-2`} />
              <input type="number" min="0" value={item.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: e.target.value })}
                placeholder="0" className={`${inputClass} col-span-4 sm:col-span-2`} />
              <div className="col-span-3 sm:col-span-1 text-right text-sm font-bold text-gray-900 dark:text-white">{formatMoney(amount, currency)}</div>
              <button onClick={() => removeItem(idx)} disabled={items.length === 1}
                className="col-span-1 p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg disabled:opacity-30 transition-all justify-self-end">
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Totals + notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-6 space-y-4">
          <div>
            <label className={labelClass}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Thank you for your business!" className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className={labelClass}>Terms</label>
            <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Tax rate (%)</label>
              <input type="number" min="0" step="any" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Discount</label>
              <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="space-y-2 text-sm pt-2">
            <div className="flex justify-between text-gray-500 dark:text-gray-400"><span>Subtotal</span><span>{formatMoney(subtotal, currency)}</span></div>
            {disc > 0 && <div className="flex justify-between text-gray-500 dark:text-gray-400"><span>Discount</span><span>-{formatMoney(disc, currency)}</span></div>}
            {Number(taxRate) > 0 && <div className="flex justify-between text-gray-500 dark:text-gray-400"><span>Tax ({taxRate}%)</span><span>{formatMoney(taxAmount, currency)}</span></div>}
            <div className="flex justify-between font-black text-xl text-gray-900 dark:text-white pt-3 border-t border-gray-100 dark:border-white/10">
              <span>Total</span><span className="text-blue-600">{formatMoney(total, currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}

      <div className="flex gap-3 justify-end flex-wrap">
        <button onClick={() => handleSave("draft")} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition-all">
          <Save size={16} /> Save as Draft
        </button>
        <button onClick={() => handleSave("sent")} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-50 shadow-lg shadow-blue-500/20 transition-all">
          <Send size={16} /> {saving ? "Saving..." : "Save & Mark as Sent"}
        </button>
      </div>
    </div>
  );
}