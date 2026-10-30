import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, clients, invoices, invoiceItems, payments } from "@/lib/schema";
import bcrypt from "bcryptjs";

const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000);

type ItemInput = { description: string; quantity: number; unitPrice: number };

export async function GET() {
  const [admin] = await db.insert(users).values({
    name: "Admin User",
    email: "admin@billflow.com",
    password: await bcrypt.hash("admin123", 10),
    role: "admin",
    companyName: "BillFlow Studio",
  }).returning().onConflictDoNothing();

  if (!admin) return NextResponse.json({ message: "Already seeded" });

  await db.insert(users).values([
    { name: "John Manager", email: "manager@billflow.com", password: await bcrypt.hash("manager123", 10), role: "manager" },
    { name: "Anna Accountant", email: "accountant@billflow.com", password: await bcrypt.hash("accountant123", 10), role: "accountant" },
  ]);

  // Clients
  const cls = await db.insert(clients).values([
    { userId: admin.id, name: "Alibek Yusupov", companyName: "TechWorld LLC", email: "alibek@techworld.uz", phone: "+998901234567", address: "Tashkent, IT Park", taxId: "305123456" },
    { userId: admin.id, name: "Dilnoza Karimova", companyName: "Office Masters", email: "dilnoza@officemasters.uz", phone: "+998902345678", address: "Tashkent, Mirzo Ulugbek", taxId: "305234567" },
    { userId: admin.id, name: "Sardor Rahimov", companyName: "FurniPro", email: "sardor@furnipro.uz", phone: "+998903456789", address: "Tashkent, Shayxontohur", taxId: "305345678" },
    { userId: admin.id, name: "Emma Wilson", companyName: "Wilson & Co", email: "emma@wilsonco.com", phone: "+14155550123", address: "San Francisco, CA, USA" },
    { userId: admin.id, name: "Ivan Petrov", companyName: "Petrov Group", email: "ivan@petrovgroup.ru", phone: "+74951234567", address: "Moscow, Russia" },
  ]).returning();

  async function makeInvoice(opts: {
    number: string; clientId: string; status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
    currency: "USD" | "UZS" | "EUR" | "RUB"; taxRate: number; discount?: number;
    issueDays: number; dueDays: number; paidDays?: number; items: ItemInput[]; notes?: string;
  }) {
    const subtotal = opts.items.reduce((s, i) => s + Math.round(i.quantity * i.unitPrice), 0);
    const discount = opts.discount || 0;
    const taxAmount = Math.round(((subtotal - discount) * opts.taxRate) / 100);
    const total = subtotal - discount + taxAmount;

    const [inv] = await db.insert(invoices).values({
      userId: admin.id,
      clientId: opts.clientId,
      invoiceNumber: opts.number,
      status: opts.status,
      currency: opts.currency,
      subtotal,
      taxRate: opts.taxRate,
      taxAmount,
      discount,
      total,
      notes: opts.notes || null,
      terms: "Payment due within the due date. Late payments may incur a fee.",
      issueDate: daysFromNow(opts.issueDays),
      dueDate: daysFromNow(opts.dueDays),
      paidDate: opts.paidDays !== undefined ? daysFromNow(opts.paidDays) : null,
    }).returning();

    await db.insert(invoiceItems).values(
      opts.items.map((i, idx) => ({
        invoiceId: inv.id,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        amount: Math.round(i.quantity * i.unitPrice),
        order: idx + 1,
      }))
    );

    if (opts.status === "paid") {
      await db.insert(payments).values({
        invoiceId: inv.id,
        userId: admin.id,
        amount: total,
        method: "bank_transfer",
        reference: `TRX-${opts.number}`,
        paidAt: daysFromNow(opts.paidDays ?? 0),
      });
    }
    return inv;
  }

  await makeInvoice({
    number: "INV-2026-001", clientId: cls[0].id, status: "paid", currency: "USD", taxRate: 12,
    issueDays: -60, dueDays: -30, paidDays: -35,
    items: [
      { description: "Website design & development", quantity: 1, unitPrice: 2500 },
      { description: "Hosting (12 months)", quantity: 12, unitPrice: 20 },
    ],
  });

  await makeInvoice({
    number: "INV-2026-002", clientId: cls[1].id, status: "paid", currency: "USD", taxRate: 12,
    issueDays: -45, dueDays: -15, paidDays: -20,
    items: [
      { description: "Brand identity package", quantity: 1, unitPrice: 1800 },
      { description: "Business card design", quantity: 2, unitPrice: 150 },
    ],
  });

  await makeInvoice({
    number: "INV-2026-003", clientId: cls[2].id, status: "overdue", currency: "USD", taxRate: 12,
    issueDays: -40, dueDays: -10,
    items: [
      { description: "E-commerce platform setup", quantity: 1, unitPrice: 3200 },
      { description: "Payment gateway integration", quantity: 1, unitPrice: 600 },
    ],
    notes: "Reminder sent twice.",
  });

  await makeInvoice({
    number: "INV-2026-004", clientId: cls[3].id, status: "sent", currency: "USD", taxRate: 0,
    issueDays: -7, dueDays: 23,
    items: [
      { description: "Monthly retainer — frontend development", quantity: 40, unitPrice: 45 },
      { description: "Code review sessions", quantity: 4, unitPrice: 60 },
    ],
  });

  await makeInvoice({
    number: "INV-2026-005", clientId: cls[0].id, status: "sent", currency: "UZS", taxRate: 12,
    issueDays: -5, dueDays: 25,
    items: [
      { description: "Mobile app UI design", quantity: 1, unitPrice: 15000000 },
      { description: "Prototype & user testing", quantity: 1, unitPrice: 6000000 },
    ],
  });

  await makeInvoice({
    number: "INV-2026-006", clientId: cls[4].id, status: "paid", currency: "RUB", taxRate: 20,
    issueDays: -30, dueDays: 0, paidDays: -3,
    items: [
      { description: "Landing page development", quantity: 1, unitPrice: 120000 },
      { description: "SEO optimization", quantity: 1, unitPrice: 45000 },
    ],
  });

  await makeInvoice({
    number: "INV-2026-007", clientId: cls[1].id, status: "draft", currency: "USD", taxRate: 12, discount: 100,
    issueDays: 0, dueDays: 30,
    items: [
      { description: "Annual maintenance contract", quantity: 1, unitPrice: 1200 },
      { description: "Priority support", quantity: 1, unitPrice: 400 },
    ],
  });

  await makeInvoice({
    number: "INV-2026-008", clientId: cls[3].id, status: "cancelled", currency: "EUR", taxRate: 0,
    issueDays: -20, dueDays: 10,
    items: [{ description: "Consulting (cancelled by client)", quantity: 10, unitPrice: 80 }],
  });

  return NextResponse.json({ success: true });
}