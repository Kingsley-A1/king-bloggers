import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";

import { db } from "../db";
import { users } from "../db/schema";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
if (process.env.NODE_ENV === "production" && !authSecret) {
  throw new Error("Missing AUTH_SECRET (or NEXTAUTH_SECRET) in environment");
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: false,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const rows = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            imageUrl: users.imageUrl,
            passwordHash: users.passwordHash,
            role: users.role,
          })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        const user = rows[0];
        if (!user) return null;
        if (!user.passwordHash) return null;

        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.imageUrl ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user && typeof (user as { role?: unknown }).role === "string") {
        token.role = (user as { role: string }).role;
      }

      if (typeof token.sub === "string") {
        const rows = await db
          .select({ role: users.role, name: users.name, imageUrl: users.imageUrl })
          .from(users)
          .where(eq(users.id, token.sub))
          .limit(1);
        const row = rows[0];
        if (row) {
          if (typeof row.role === "string") token.role = row.role;
          if (typeof row.name === "string") token.name = row.name;
          token.picture = typeof row.imageUrl === "string" ? row.imageUrl : undefined;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.sub === "string" ? token.sub : "";
        if (typeof token.role === "string") {
          session.user.role = token.role;
        }
      }
      return session;
    },
  },
});

export const { GET, POST } = handlers;
