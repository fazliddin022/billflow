import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, invoiceItems, clients, payments } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth-config";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [client] = await db.select().from(clients).where(eq(clients.id, invoice.clientId));
  const items = await db.select().from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, id)).orderBy(asc(invoiceItems.order));
  const paymentList = await db.select().from(payments).where(eq(payments.invoiceId, id));

  return NextResponse.json({ ...invoice, client, items, payments: paymentList });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const [existing] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Mark as paid → record the remaining balance as a payment
  if (body.status === "paid" && existing.status !== "paid") {
    const prior = await db.select().from(payments).where(eq(payments.invoiceId, id));
    const alreadyPaid = prior.reduce((s, p) => s + p.amount, 0);
    const remaining = existing.total - alreadyPaid;
    if (remaining > 0) {
      await db.insert(payments).values({
        invoiceId: id,
        userId: session.user.id,
        amount: remaining,
        method: body.method || "bank_transfer",
        reference: body.reference || null,
      });
    }
  }

  const [invoice] = await db.update(invoices).set({
    status: body.status,
    paidDate: body.status === "paid" ? new Date() : body.status === existing.status ? existing.paidDate : null,
    updatedAt: new Date(),
  }).where(eq(invoices.id, id)).returning();

  return NextResponse.json(invoice);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!["admin", "manager"].includes(session?.user?.role || ""))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(payments).where(eq(payments.invoiceId, id));
  await db.delete(invoices).where(eq(invoices.id, id));
  return NextResponse.json({ success: true });
}