import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, clients, payments } from "@/lib/schema";
import { eq, and, lt, desc } from "drizzle-orm";
import { auth } from "@/lib/auth-config";
import { toUSD } from "@/lib/format";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Auto-mark overdue
  await db.update(invoices).set({ status: "overdue" })
    .where(and(eq(invoices.status, "sent"), lt(invoices.dueDate, new Date())));

  const allInvoices = await db.select().from(invoices);
  const allClients = await db.select().from(clients).where(eq(clients.isActive, true));

  const paymentRows = await db
    .select({ amount: payments.amount, paidAt: payments.paidAt, currency: invoices.currency })
    .from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id));

  const totalRevenue = paymentRows.reduce((s, p) => s + toUSD(p.amount, p.currency), 0);
  const outstanding = allInvoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((s, i) => s + toUSD(i.total, i.currency), 0);
  const overdueAmount = allInvoices
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + toUSD(i.total, i.currency), 0);

  const now = new Date();
  const thisMonth = paymentRows
    .filter((p) => p.paidAt && new Date(p.paidAt).getMonth() === now.getMonth() && new Date(p.paidAt).getFullYear() === now.getFullYear())
    .reduce((s, p) => s + toUSD(p.amount, p.currency), 0);

  // Last 6 months
  const monthly = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    const amount = paymentRows
      .filter((p) => p.paidAt && new Date(p.paidAt).getMonth() === d.getMonth() && new Date(p.paidAt).getFullYear() === d.getFullYear())
      .reduce((s, p) => s + toUSD(p.amount, p.currency), 0);
    return { label: d.toLocaleDateString("en-US", { month: "short" }), amount: Math.round(amount) };
  });

  const counts = {
    draft: allInvoices.filter((i) => i.status === "draft").length,
    sent: allInvoices.filter((i) => i.status === "sent").length,
    paid: allInvoices.filter((i) => i.status === "paid").length,
    overdue: allInvoices.filter((i) => i.status === "overdue").length,
    cancelled: allInvoices.filter((i) => i.status === "cancelled").length,
  };

  const recentInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      currency: invoices.currency,
      total: invoices.total,
      dueDate: invoices.dueDate,
      clientName: clients.name,
      clientCompany: clients.companyName,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(invoices.createdAt))
    .limit(6);

  return NextResponse.json({
    totalRevenue: Math.round(totalRevenue),
    outstanding: Math.round(outstanding),
    overdueAmount: Math.round(overdueAmount),
    thisMonth: Math.round(thisMonth),
    totalClients: allClients.length,
    totalInvoices: allInvoices.length,
    counts,
    monthly,
    recentInvoices,
  });
}