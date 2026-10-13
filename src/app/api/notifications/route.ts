// GET  /api/notifications — centre de notifications (notifications + alertes actives)
// POST /api/notifications — crée une notification manuelle (E2A/admin)
// PATCH /api/notifications — marque tout comme lu (body: { all: true }) ou une
//                             seule notification (body: { id, lu: true })
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { emitNotification } from "@/lib/ws-emit";

export async function GET() {
  const [notifs, alertes] = await Promise.all([
    db.notification.findMany({ orderBy: { date: "desc" }, take: 30 }),
    db.alerte.findMany({ where: { resolved: false }, orderBy: { date: "desc" } }),
  ]);

  const items = [
    ...notifs.map((n) => ({
      id: n.id,
      date: n.date.toISOString(),
      type: n.type,
      titre: n.titre,
      message: n.message,
      lu: n.lu,
      lien: n.lien,
      source: "notification" as const,
    })),
    ...alertes.map((a) => ({
      id: a.id,
      date: a.date.toISOString(),
      type: a.type,
      titre: a.severite === "CRITICAL" ? "Alerte critique" : a.severite === "WARNING" ? "Attention" : "Info",
      message: a.message,
      lu: false,
      lien: null,
      source: "alerte" as const,
    })),
  ].sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime()).slice(0, 50);

  return NextResponse.json({
    items,
    nonLues: items.filter((i) => !i.lu).length,
  });
}

export async function POST(req: NextRequest) {
  const { forbidden } = await requireRole(["E2A", "BENEFICIAIRE"]);
  if (forbidden) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.titre || !body.message) {
    return NextResponse.json({ error: "titre + message requis" }, { status: 400 });
  }
  const notif = await db.notification.create({
    data: {
      type: body.type ?? "AUTRE",
      titre: String(body.titre).slice(0, 200),
      message: String(body.message).slice(0, 1000),
      lien: body.lien ?? null,
      lu: false,
    },
  });

  // Broadcast WebSocket temps réel aux clients connectés.
  void emitNotification({
    type: notif.type,
    titre: notif.titre,
    message: notif.message,
    date: notif.date.toISOString(),
  });

  return NextResponse.json({
    id: notif.id,
    date: notif.date.toISOString(),
    type: notif.type,
    titre: notif.titre,
    message: notif.message,
    lu: notif.lu,
    lien: notif.lien,
  }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { forbidden } = await requireRole(["E2A", "BENEFICIAIRE", "SINERGI"]);
  if (forbidden) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }
  const body = await req.json();

  // PATCH ?all=true → tout marquer comme lu
  if (body.all === true) {
    await db.notification.updateMany({
      where: { lu: false },
      data: { lu: true },
    });
    return NextResponse.json({ ok: true, marquees: "toutes" });
  }

  // PATCH avec un id spécifique
  if (body.id) {
    const notif = await db.notification.update({
      where: { id: String(body.id) },
      data: { lu: body.lu ?? true },
    });
    return NextResponse.json({
      id: notif.id,
      lu: notif.lu,
    });
  }

  return NextResponse.json({ error: "id ou all=true requis" }, { status: 400 });
}
