import NextAuth, { Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const [user] = await db.select().from(users).where(eq(users.email, credentials.email as string));
        if (!user || !user.password) return null;
        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const [existing] = await db.select().from(users).where(eq(users.email, user.email!));
        if (!existing) {
          const [newUser] = await db.insert(users).values({
            name: user.name!,
            email: user.email!,
            image: user.image,
            role: "accountant",
          }).returning();
          (user as unknown as { id: string; role: string }).id = newUser.id;
          (user as unknown as { id: string; role: string }).role = newUser.role;
        } else {
          (user as unknown as { id: string; role: string }).id = existing.id;
          (user as unknown as { id: string; role: string }).role = existing.role;
        }
      }
      return true;
    },
    async jwt({ token, user }: { token: JWT; user?: { id?: string; role?: string } }) {
      if (user?.id) token.id = user.id;
      if (user?.role) token.role = user.role;
      if (token.email && !token.id) {
        const [dbUser] = await db.select().from(users).where(eq(users.email, token.email));
        if (dbUser) { token.id = dbUser.id; token.role = dbUser.role; }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});