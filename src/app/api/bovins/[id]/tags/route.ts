// GET /api/bovins/[id]/tags — liste les tags d'un bovin
// POST /api/bovins/[id]/tags — ajoute un tag
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tags = await db.tag.findMany({ where: { bovinId: id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(tags.map((t) => ({ id: t.id, tag: t.tag, color: t.color })));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const tag = await db.tag.create({ data: { bovinId: id, tag: body.tag, color: body.color ?? "#10B981" } });
  return NextResponse.json({ id: tag.id, tag: tag.tag, color: tag.color }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const tagId = url.searchParams.get("tagId");
  if (tagId) {
    await db.tag.delete({ where: { id: tagId } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "tagId requis" }, { status: 400 });
}
