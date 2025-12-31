import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { compare } from "bcryptjs";

import { db } from "../db";
import { users } from "../db/schema";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  secret: authSecret,
  trustHost: true,
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
        try {
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
            .where(eq(sql`lower(${users.email})`, email))
            .limit(1);

          const user = rows[0];
          if (!user || !user.passwordHash) return null;

          const ok = await compare(password, user.passwordHash);
          if (!ok) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            image: user.imageUrl ?? undefined,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth authorize error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      try {
        // On initial sign-in, populate token with user data from authorize()
        if (user) {
          token.role = (user as { role?: string }).role ?? "reader";
          token.name = user.name ?? undefined;
          token.picture = user.image ?? undefined;
        }

        // Only refresh from DB on signIn or explicit update trigger
        // This prevents a DB query on EVERY authenticated request
        if (
          (trigger === "signIn" || trigger === "update") &&
          typeof token.sub === "string"
        ) {
          const rows = await db
            .select({
              role: users.role,
              name: users.name,
              imageUrl: users.imageUrl,
            })
            .from(users)
            .where(eq(users.id, token.sub))
            .limit(1);
          const row = rows[0];
          if (row) {
            token.role = row.role ?? "reader";
            token.name = row.name ?? undefined;
            token.picture = row.imageUrl ?? undefined;
          }
        }
      } catch (error) {
        console.error("Auth JWT callback error:", error);
      }

      return token;
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = typeof token.sub === "string" ? token.sub : "";
          if (typeof token.role === "string") {
            session.user.role = token.role;
          }
        }
      } catch (error) {
        console.error("Auth session callback error:", error);
      }
      return session;
    },
  },
});

export const { GET, POST } = handlers;
