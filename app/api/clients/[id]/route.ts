import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth-config";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const [client] = await db.update(clients).set({
    name: body.name,
    email: body.email || null,
    phone: body.phone || null,
    address: body.address || null,
    companyName: body.companyName || null,
    taxId: body.taxId || null,
    notes: body.notes || null,
  }).where(eq(clients.id, id)).returning();

  return NextResponse.json(client);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!["admin", "manager"].includes(session?.user?.role || ""))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.update(clients).set({ isActive: false }).where(eq(clients.id, id));
  return NextResponse.json({ success: true });
}