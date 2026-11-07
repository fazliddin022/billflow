"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import InvoiceDocument, { InvoiceDoc } from "@/components/InvoiceDocument";

function PublicInvoiceContent() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<InvoiceDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then(async (r) => {
        if (!r.ok) { setNotFound(true); return; }
        setInvoice(await r.json());
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto">
      {loading ? (
        <div className="h-96 bg-white rounded-3xl animate-pulse" />
      ) : notFound || !invoice ? (
        <div className="text-center py-24 bg-white rounded-3xl">
          <p className="text-5xl mb-3">🧾</p>
          <p className="font-bold text-gray-700">Invoice not found</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4 print:hidden">
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all">
              <Printer size={15} /> Print / Save as PDF
            </button>
          </div>
          <InvoiceDocument invoice={invoice} />
          <p className="text-center text-xs text-gray-400 mt-6 print:hidden">Powered by BillFlow</p>
        </>
      )}
    </div>
  );
}

export default function PublicInvoicePage() {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 print:bg-white print:py-0">
      <Suspense fallback={<div className="max-w-3xl mx-auto h-96 bg-white rounded-3xl animate-pulse" />}>
        <PublicInvoiceContent />
      </Suspense>
    </div>
  );
}