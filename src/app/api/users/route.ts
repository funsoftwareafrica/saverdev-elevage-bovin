// GET /api/users — liste tous les users (E2A only)
// POST /api/users — crée un user (E2A only)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const { forbidden } = await requireRole(["E2A"]);
  if (forbidden) return NextResponse.json({ error: "Réservé à E2A" }, { status: 403 });

  const users = await db.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { forbidden } = await requireRole(["E2A"]);
  if (forbidden) return NextResponse.json({ error: "Réservé à E2A" }, { status: 403 });

  const body = await req.json();
  const { email, name, role, password } = body;

  if (!email || !name || !password || !role) {
    return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
  }
  if (!["BENEFICIAIRE", "SINERGI", "E2A"].includes(role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Mot de passe trop court (min 6 caractères)" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { email, name, role, password: hashedPassword },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
