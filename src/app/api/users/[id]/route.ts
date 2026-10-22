// GET/PUT/DELETE /api/users/[id] — gestion d'un user (E2A only)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { forbidden } = await requireRole(["E2A"]);
  if (forbidden) return NextResponse.json({ error: "Réservé à E2A" }, { status: 403 });

  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { forbidden } = await requireRole(["E2A"]);
  if (forbidden) return NextResponse.json({ error: "Réservé à E2A" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { email, name, role, password } = body;

  const data: { email?: string; name?: string; role?: string; password?: string } = {};
  if (email) data.email = email;
  if (name) data.name = name;
  if (role && ["BENEFICIAIRE", "SINERGI", "E2A"].includes(role)) data.role = role;
  if (password) {
    if (password.length < 6) return NextResponse.json({ error: "Mot de passe trop court" }, { status: 400 });
    data.password = await bcrypt.hash(password, 10);
  }

  const user = await db.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { forbidden } = await requireRole(["E2A"]);
  if (forbidden) return NextResponse.json({ error: "Réservé à E2A" }, { status: 403 });

  const { id } = await params;

  // Anti-lockout : empêcher la suppression du dernier E2A
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  if (user.role === "E2A") {
    const e2aCount = await db.user.count({ where: { role: "E2A" } });
    if (e2aCount <= 1) {
      return NextResponse.json({ error: "Impossible de supprimer le dernier compte E2A" }, { status: 409 });
    }
  }

  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
