import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, invoices } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth-config";
import { toUSD } from "@/lib/format";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allClients = await db.select().from(clients)
    .where(eq(clients.isActive, true))
    .orderBy(desc(clients.createdAt));
  const allInvoices = await db.select().from(invoices);

  const result = allClients.map((c) => {
    const mine = allInvoices.filter((i) => i.clientId === c.id);
    return {
      ...c,
      invoiceCount: mine.length,
      totalBilled: Math.round(mine.filter((i) => i.status !== "cancelled" && i.status !== "draft").reduce((s, i) => s + toUSD(i.total, i.currency), 0)),
      totalPaid: Math.round(mine.filter((i) => i.status === "paid").reduce((s, i) => s + toUSD(i.total, i.currency), 0)),
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const [client] = await db.insert(clients).values({
    userId: session.user.id,
    name: body.name,
    email: body.email || null,
    phone: body.phone || null,
    address: body.address || null,
    companyName: body.companyName || null,
    taxId: body.taxId || null,
    notes: body.notes || null,
  }).returning();

  return NextResponse.json(client);
}