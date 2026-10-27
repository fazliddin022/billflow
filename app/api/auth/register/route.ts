import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: "All fields required" }, { status: 400 });
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  const hashedPassword = await bcrypt.hash(password, 10);
  const [user] = await db.insert(users).values({ name, email, password: hashedPassword, role: "accountant" }).returning();
  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}