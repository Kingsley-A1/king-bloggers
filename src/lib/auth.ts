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
    async jwt({ token, user }) {
      // =====================================================
      // 👑 KING BLOGGERS - Zero-DB JWT Callback
      // =====================================================
      // We store ALL user data in the JWT at login time.
      // This prevents DB timeouts from breaking every request.
      // If user updates their profile, they should re-login or
      // we can implement a separate "refresh token data" action.
      // =====================================================

      // On initial login, copy user data to token
      if (user) {
        const u = user as {
          id?: string;
          role?: string;
          name?: string;
          image?: string;
        };
        if (typeof u.role === "string") token.role = u.role;
        if (typeof u.name === "string") token.name = u.name;
        if (typeof u.image === "string") token.picture = u.image;
      }

      return token;
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          if (typeof token.sub === "string") session.user.id = token.sub;
          if (typeof token.role === "string") session.user.role = token.role;
          if (typeof token.name === "string") session.user.name = token.name;
          if (typeof token.picture === "string")
            session.user.image = token.picture;
        }
      } catch (error) {
        console.error("Auth session callback error:", error);
      }
      return session;
    },
  },
});

export const { GET, POST } = handlers;
