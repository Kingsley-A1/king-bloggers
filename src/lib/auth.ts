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

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`${label}: timeout after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(id);
        resolve(value);
      },
      (err) => {
        clearTimeout(id);
        reject(err);
      }
    );
  });
}

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
    async jwt({ token, user }) {
      try {
        if (user && typeof (user as { role?: unknown }).role === "string") {
          token.role = (user as { role: string }).role;
        }

        if (typeof token.sub === "string") {
          // Avoid hammering DB on every request (and avoid long hangs if DB is unreachable).
          const now = Date.now();
          const lastSync =
            typeof (token as { kbUserSyncAt?: unknown }).kbUserSyncAt === "number"
              ? ((token as { kbUserSyncAt: number }).kbUserSyncAt as number)
              : 0;

          const shouldSync = !lastSync || now - lastSync > 10 * 60 * 1000;
          if (shouldSync) {
            const rows = await withTimeout(
              db
                .select({
                  role: users.role,
                  name: users.name,
                  imageUrl: users.imageUrl,
                })
                .from(users)
                .where(eq(users.id, token.sub))
                .limit(1),
              2500,
              "auth.jwt user lookup"
            );

            const row = rows[0];
            if (row) {
              if (typeof row.role === "string") token.role = row.role;
              if (typeof row.name === "string") token.name = row.name;
              token.picture =
                typeof row.imageUrl === "string" ? row.imageUrl : undefined;
            }

            (token as { kbUserSyncAt?: number }).kbUserSyncAt = now;
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
          if (typeof token.sub === "string") session.user.id = token.sub;
          if (typeof token.role === "string") session.user.role = token.role;
          if (typeof token.name === "string") session.user.name = token.name;
          if (typeof token.picture === "string") session.user.image = token.picture;
        }
      } catch (error) {
        console.error("Auth session callback error:", error);
      }
      return session;
    },
  },
});

export const { GET, POST } = handlers;
