// GET /api/notifications — centre de notifications (notifications + alertes actives)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [notifs, alertes] = await Promise.all([
    db.notification.findMany({ orderBy: { date: "desc" }, take: 20 }),
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
    })),
    ...alertes.map((a) => ({
      id: a.id,
      date: a.date.toISOString(),
      type: a.type,
      titre: a.severite === "CRITICAL" ? "Alerte critique" : a.severite === "WARNING" ? "Attention" : "Info",
      message: a.message,
      lu: false,
      lien: null,
    })),
  ].sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime()).slice(0, 30);

  return NextResponse.json(items);
}
