"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Users, Plus, X, Check, Trash2, Pencil, Mail, Phone, MapPin, Search, Building2 } from "lucide-react";
import { formatMoney } from "@/lib/format";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  companyName: string | null;
  taxId: string | null;
  notes: string | null;
  invoiceCount: number;
  totalBilled: number;
  totalPaid: number;
};

const EMPTY_FORM = { name: "", companyName: "", email: "", phone: "", address: "", taxId: "", notes: "" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchClients = useCallback(async () => {
    const res = await fetch("/api/clients");
    setClients(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setError(""); setShowModal(true); };
  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      name: c.name, companyName: c.companyName || "", email: c.email || "",
      phone: c.phone || "", address: c.address || "", taxId: c.taxId || "", notes: c.notes || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/clients/${editing.id}` : "/api/clients", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Error"); return; }
      await fetchClients();
      setShowModal(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this client?")) return;
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) setClients(clients.filter((c) => c.id !== id));
    else alert("Only admin or manager can remove clients");
  };

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.companyName || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
  });

  const inputClass = "w-full px-4 py-2.5 border-2 border-gray-200 dark:border-white/10 rounded-xl text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-400 transition-all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={28} className="text-blue-600" /> Clients
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{clients.length} clients</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:opacity-90 shadow-lg shadow-blue-500/20">
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-blue-400 text-gray-900 dark:text-white" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-56 bg-white dark:bg-gray-900 rounded-2xl animate-pulse border border-gray-100 dark:border-white/5" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/5 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>No clients found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-black text-xl">
                  {(c.companyName || c.name).charAt(0)}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                </div>
              </div>

              <p className="font-bold text-gray-900 dark:text-white">{c.companyName || c.name}</p>
              {c.companyName && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Building2 size={11} /> {c.name}</p>}

              <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 mt-3">
                {c.email && <div className="flex items-center gap-2"><Mail size={12} />{c.email}</div>}
                {c.phone && <div className="flex items-center gap-2"><Phone size={12} />{c.phone}</div>}
                {c.address && <div className="flex items-center gap-2"><MapPin size={12} />{c.address}</div>}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-50 dark:border-white/5 text-center">
                <div>
                  <p className="font-black text-gray-900 dark:text-white">{c.invoiceCount}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Invoices</p>
                </div>
                <div>
                  <p className="font-black text-blue-600 text-sm">{formatMoney(c.totalBilled)}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Billed</p>
                </div>
                <div>
                  <p className="font-black text-emerald-600 text-sm">{formatMoney(c.totalPaid)}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Paid</p>
                </div>
              </div>

              <Link href={`/dashboard/invoices?client=${c.id}`}
                className="block text-center mt-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-xl no-underline hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all">
                View invoices →
              </Link>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md border border-gray-100 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-gray-900 dark:text-white text-xl">{editing ? "Edit Client" : "Add Client"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-xl text-gray-500"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contact name *" className={inputClass} />
              <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Company name" className={inputClass} />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className={inputClass} />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className={inputClass} />
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className={inputClass} />
              <input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} placeholder="Tax ID" className={inputClass} />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" rows={2} className={`${inputClass} resize-none`} />
              {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-red-600 dark:text-red-400">{error}</div>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-white/10 rounded-2xl text-sm font-semibold text-gray-600 dark:text-gray-400">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
                <Check size={16} /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}