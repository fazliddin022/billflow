import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, invoiceItems, clients } from "@/lib/schema";
import { eq, desc, and, lt } from "drizzle-orm";
import { auth } from "@/lib/auth-config";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.update(invoices).set({ status: "overdue" })
    .where(and(eq(invoices.status, "sent"), lt(invoices.dueDate, new Date())));

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const search = (searchParams.get("search") || "").toLowerCase();
  const clientId = searchParams.get("client") || "";

  let data = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      currency: invoices.currency,
      subtotal: invoices.subtotal,
      taxAmount: invoices.taxAmount,
      total: invoices.total,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      paidDate: invoices.paidDate,
      clientId: invoices.clientId,
      clientName: clients.name,
      clientCompany: clients.companyName,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(invoices.createdAt));

  if (status) data = data.filter((i) => i.status === status);
  if (clientId) data = data.filter((i) => i.clientId === clientId);
  if (search) data = data.filter((i) =>
    i.invoiceNumber.toLowerCase().includes(search) ||
    i.clientName.toLowerCase().includes(search) ||
    (i.clientCompany || "").toLowerCase().includes(search)
  );

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.clientId) return NextResponse.json({ error: "Client is required" }, { status: 400 });
  if (!Array.isArray(body.items) || body.items.length === 0)
    return NextResponse.json({ error: "Add at least one item" }, { status: 400 });

  const items = body.items.map((i: { description: string; quantity: number; unitPrice: number }) => ({
    description: i.description,
    quantity: Number(i.quantity) || 1,
    unitPrice: Math.round(Number(i.unitPrice) || 0),
  }));

  const subtotal = items.reduce((s: number, i: { quantity: number; unitPrice: number }) => s + Math.round(i.quantity * i.unitPrice), 0);
  const discount = Math.round(Number(body.discount) || 0);
  const taxRate = Number(body.taxRate) || 0;
  const taxAmount = Math.round(((subtotal - discount) * taxRate) / 100);
  const total = subtotal - discount + taxAmount;

  // Generate next invoice number: INV-YYYY-NNN
  const year = new Date().getFullYear();
  const existing = await db.select({ n: invoices.invoiceNumber }).from(invoices);
  const maxSeq = existing
    .map((e) => e.n)
    .filter((n) => n.startsWith(`INV-${year}-`))
    .map((n) => parseInt(n.split("-")[2], 10) || 0)
    .reduce((a, b) => Math.max(a, b), 0);
  const invoiceNumber = `INV-${year}-${String(maxSeq + 1).padStart(3, "0")}`;

  const [invoice] = await db.insert(invoices).values({
    userId: session.user.id,
    clientId: body.clientId,
    invoiceNumber,
    status: body.status === "sent" ? "sent" : "draft",
    currency: body.currency || "USD",
    subtotal,
    taxRate,
    taxAmount,
    discount,
    total,
    notes: body.notes || null,
    terms: body.terms || null,
    issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
  }).returning();

  await db.insert(invoiceItems).values(
    items.map((i: { description: string; quantity: number; unitPrice: number }, idx: number) => ({
      invoiceId: invoice.id,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      amount: Math.round(i.quantity * i.unitPrice),
      order: idx + 1,
    }))
  );

  return NextResponse.json(invoice);
}