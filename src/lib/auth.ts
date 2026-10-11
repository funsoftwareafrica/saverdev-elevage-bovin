// Configuration NextAuth.js v4 — authentification réelle (cahier des charges §9).
// Credentials provider (email/mot de passe) + JWT + callbacks (role, name, email dans la session).
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { Role } from "@/lib/types";

// Étends les types NextAuth pour inclure role + id dans la session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
    };
  }
  interface User {
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 jours
  providers: [
    Credentials({
      name: "Identifiants",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "gerant@saverdev.org" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await db.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // À la connexion : user est défini → on ajoute id + role au token
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      // On expose id + role dans la session côté client
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) ?? "BENEFICIAIRE";
      }
      return session;
    },
  },
  pages: {
    // Pas de page de connexion dédiée (contrainte : seulement / route).
    // Le formulaire de login est rendu en overlay sur / quand pas de session.
    signIn: "/",
  },
};

// Helper pour vérifier le rôle côté API (server-side)
export async function requireRole(allowedRoles: Role[]) {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  if (!session?.user) return { session: null, forbidden: true as const };
  if (!allowedRoles.includes(session.user.role)) return { session, forbidden: true as const };
  return { session, forbidden: false as const };
}
