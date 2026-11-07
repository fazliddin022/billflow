import { Receipt } from "lucide-react";
import { formatMoney, formatDate } from "@/lib/format";

export type InvoiceDoc = {
  id: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  subtotal: number;
  taxRate: number | null;
  taxAmount: number | null;
  discount: number | null;
  total: number;
  notes: string | null;
  terms: string | null;
  issueDate: string | null;
  dueDate: string | null;
  paidDate: string | null;
  client: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    companyName: string | null;
    taxId: string | null;
  };
  items: Array<{ id: string; description: string; quantity: number; unitPrice: number; amount: number }>;
  payments: Array<{ id: string; amount: number; method: string; reference: string | null; paidAt: string | null }>;
};

const BADGE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function InvoiceDocument({ invoice }: { invoice: InvoiceDoc }) {
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const balance = Math.max(invoice.total - paid, 0);
  const cur = invoice.currency;

  return (
    <div className="bg-white text-gray-900 rounded-3xl border border-gray-200 shadow-sm p-8 md:p-10 print:shadow-none print:border-0 print:p-0">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center">
            <Receipt size={24} className="text-white" />
          </div>
          <div>
            <p className="text-xl font-black">BillFlow Studio</p>
            <p className="text-xs text-gray-500">Invoice & Billing</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black tracking-tight">INVOICE</p>
          <p className="text-sm font-semibold text-gray-500">{invoice.invoiceNumber}</p>
          <span className={`inline-block mt-2 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${BADGE[invoice.status]}`}>
            {invoice.status}
          </span>
        </div>
      </div>

      {/* Parties + dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
          <p className="font-bold">{invoice.client.companyName || invoice.client.name}</p>
          {invoice.client.companyName && <p className="text-sm text-gray-600">{invoice.client.name}</p>}
          {invoice.client.address && <p className="text-sm text-gray-500">{invoice.client.address}</p>}
          {invoice.client.email && <p className="text-sm text-gray-500">{invoice.client.email}</p>}
          {invoice.client.phone && <p className="text-sm text-gray-500">{invoice.client.phone}</p>}
          {invoice.client.taxId && <p className="text-xs text-gray-400 mt-1">Tax ID: {invoice.client.taxId}</p>}
        </div>
        <div className="sm:text-right space-y-1.5 text-sm">
          <p><span className="text-gray-400">Issue date: </span><span className="font-semibold">{formatDate(invoice.issueDate)}</span></p>
          <p><span className="text-gray-400">Due date: </span><span className="font-semibold">{formatDate(invoice.dueDate)}</span></p>
          {invoice.paidDate && (
            <p><span className="text-gray-400">Paid on: </span><span className="font-semibold text-emerald-600">{formatDate(invoice.paidDate)}</span></p>
          )}
          <p><span className="text-gray-400">Currency: </span><span className="font-semibold">{cur}</span></p>
        </div>
      </div>

      {/* Items */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-100">
              <th className="text-left py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
              <th className="text-right py-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-20">Qty</th>
              <th className="text-right py-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-36">Unit price</th>
              <th className="text-right py-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-36">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-50">
                <td className="py-3.5 text-sm font-medium">{item.description}</td>
                <td className="py-3.5 text-sm text-right text-gray-600">{item.quantity}</td>
                <td className="py-3.5 text-sm text-right text-gray-600">{formatMoney(item.unitPrice, cur)}</td>
                <td className="py-3.5 text-sm text-right font-semibold">{formatMoney(item.amount, cur)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-full sm:w-72 space-y-2 text-sm">
          <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatMoney(invoice.subtotal, cur)}</span></div>
          {(invoice.discount || 0) > 0 && (
            <div className="flex justify-between text-gray-500"><span>Discount</span><span>-{formatMoney(invoice.discount || 0, cur)}</span></div>
          )}
          {(invoice.taxRate || 0) > 0 && (
            <div className="flex justify-between text-gray-500"><span>Tax ({invoice.taxRate}%)</span><span>{formatMoney(invoice.taxAmount || 0, cur)}</span></div>
          )}
          <div className="flex justify-between font-black text-lg pt-3 border-t-2 border-gray-100">
            <span>Total</span><span>{formatMoney(invoice.total, cur)}</span>
          </div>
          {paid > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold"><span>Paid</span><span>-{formatMoney(paid, cur)}</span></div>
          )}
          <div className={`flex justify-between font-black text-base p-3 rounded-xl ${balance === 0 ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
            <span>Balance due</span><span>{formatMoney(balance, cur)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {(invoice.notes || invoice.terms) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-100 text-sm">
          {invoice.notes && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Notes</p>
              <p className="text-gray-600">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Terms</p>
              <p className="text-gray-600">{invoice.terms}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}