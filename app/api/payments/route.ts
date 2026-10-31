import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, invoices, clients } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth-config";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      method: payments.method,
      reference: payments.reference,
      notes: payments.notes,
      paidAt: payments.paidAt,
      invoiceId: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      currency: invoices.currency,
      clientName: clients.name,
      clientCompany: clients.companyName,
    })
    .from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(payments.paidAt));

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const amount = Math.round(Number(body.amount) || 0);
  if (!body.invoiceId || amount <= 0)
    return NextResponse.json({ error: "Invoice and amount are required" }, { status: 400 });

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, body.invoiceId));
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const [payment] = await db.insert(payments).values({
    invoiceId: body.invoiceId,
    userId: session.user.id,
    amount,
    method: body.method || "bank_transfer",
    reference: body.reference || null,
    notes: body.notes || null,
    paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
  }).returning();

  // Fully paid? → update invoice
  const all = await db.select().from(payments).where(eq(payments.invoiceId, body.invoiceId));
  const totalPaid = all.reduce((s, p) => s + p.amount, 0);
  if (totalPaid >= invoice.total) {
    await db.update(invoices).set({ status: "paid", paidDate: new Date(), updatedAt: new Date() })
      .where(eq(invoices.id, body.invoiceId));
  }

  return NextResponse.json(payment);
}