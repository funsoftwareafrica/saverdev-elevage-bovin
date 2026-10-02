import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/dashboard — agrégation KPIs + graphiques
export async function GET() {
  const [
    contacts, companies, deals, activities,
    contactsByStatus, dealsByStage, activitiesByType,
    recentActivities, upcomingActivities,
  ] = await Promise.all([
    db.contact.findMany({ include: { company: true } }),
    db.company.findMany(),
    db.deal.findMany({ include: { contact: true, company: true } }),
    db.activity.findMany({ include: { contact: true, deal: true } }),
    db.contact.groupBy({ by: ["status"], _count: true }),
    db.deal.groupBy({ by: ["stage"], _count: true, _sum: { value: true } }),
    db.activity.groupBy({ by: ["type"], _count: true }),
    db.activity.findMany({
      where: { completed: true },
      orderBy: { date: "desc" },
      take: 6,
      include: { contact: true, deal: true },
    }),
    db.activity.findMany({
      where: { completed: false },
      orderBy: { date: "asc" },
      take: 6,
      include: { contact: true, deal: true },
    }),
  ]);

  const totalContacts = contacts.length;
  const totalCompanies = companies.length;
  const activeContacts = contacts.filter(c => c.status === "active").length;
  const leadContacts = contacts.filter(c => c.status === "lead").length;

  const totalPipeline = deals.reduce((s, d) => s + d.value, 0);
  const wonDeals = deals.filter(d => d.stage === "closed_won");
  const lostDeals = deals.filter(d => d.stage === "closed_lost");
  const openDeals = deals.filter(d => !["closed_won", "closed_lost"].includes(d.stage));
  const wonValue = wonDeals.reduce((s, d) => s + d.value, 0);
  const openValue = openDeals.reduce((s, d) => s + d.value, 0);
  const weightedPipeline = openDeals.reduce((s, d) => s + (d.value * d.probability) / 100, 0);
  const winRate = wonDeals.length + lostDeals.length > 0
    ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
    : 0;

  const pendingActivities = activities.filter(a => !a.completed).length;
  const completedActivities = activities.filter(a => a.completed).length;

  // Deals by stage (ordered pipeline)
  const stageOrder = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"];
  const stageLabels: Record<string, string> = {
    lead: "Prospects", qualified: "Qualifiés", proposal: "Proposition",
    negotiation: "Négociation", closed_won: "Gagnés", closed_lost: "Perdus",
  };
  const pipelineStages = stageOrder.map(stage => {
    const items = dealsByStage.find(d => d.stage === stage);
    return {
      stage,
      label: stageLabels[stage],
      count: items?._count ?? 0,
      value: items?._sum?.value ?? 0,
    };
  });

  // Contacts by source (for pie chart)
  const sourceLabels: Record<string, string> = {
    manual: "Saisie", referral: "Référent", website: "Site web",
    linkedin: "LinkedIn", event: "Événement",
  };
  const sources = ["referral", "website", "linkedin", "event", "manual"].map(s => ({
    source: s,
    label: sourceLabels[s] || s,
    count: contacts.filter(c => c.source === s).length,
  })).filter(s => s.count > 0);

  // Revenue trend (won deals by month, last 6 months)
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthWon = wonDeals.filter(deal => {
      const cd = deal.closeDate ? new Date(deal.closeDate) : null;
      return cd && cd >= d && cd < next;
    });
    months.push({
      month: d.toLocaleString("fr-FR", { month: "short" }),
      revenue: monthWon.reduce((s, d) => s + d.value, 0),
      deals: monthWon.length,
    });
  }

  // Top companies by deal value
  const companyDealMap = new Map<string, { name: string; value: number; count: number }>();
  deals.forEach(d => {
    if (!d.company) return;
    const key = d.companyId!;
    const existing = companyDealMap.get(key) || { name: d.company.name, value: 0, count: 0 };
    existing.value += d.value;
    existing.count += 1;
    companyDealMap.set(key, existing);
  });
  const topCompanies = Array.from(companyDealMap.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return NextResponse.json({
    kpis: {
      totalContacts, activeContacts, leadContacts, totalCompanies,
      totalDeals: deals.length, openDeals: openDeals.length, wonDeals: wonDeals.length, lostDeals: lostDeals.length,
      totalPipeline, openValue, wonValue, weightedPipeline, winRate,
      pendingActivities, completedActivities, totalActivities: activities.length,
    },
    pipelineStages,
    sources,
    revenueTrend: months,
    topCompanies,
    contactsByStatus: contactsByStatus.map(c => ({ status: c.status, count: c._count })),
    activitiesByType: activitiesByType.map(a => ({ type: a.type, count: a._count })),
    recentActivities: recentActivities.map(a => ({
      id: a.id, type: a.type, title: a.title, description: a.description,
      date: a.date.toISOString(), completed: a.completed,
      contact: a.contact ? `${a.contact.firstName} ${a.contact.lastName}` : null,
      dealTitle: a.deal?.title ?? null,
    })),
    upcomingActivities: upcomingActivities.map(a => ({
      id: a.id, type: a.type, title: a.title, description: a.description,
      date: a.date.toISOString(), completed: a.completed,
      contact: a.contact ? `${a.contact.firstName} ${a.contact.lastName}` : null,
      dealTitle: a.deal?.title ?? null,
    })),
  });
}
