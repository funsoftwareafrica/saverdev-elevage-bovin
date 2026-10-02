// Seed CRM — Companies, Contacts, Deals, Activities, Notes
import { db } from "@/lib/db";

async function main() {
  console.log("🗑️  Nettoyage des données existantes...");
  await db.note.deleteMany();
  await db.activity.deleteMany();
  await db.deal.deleteMany();
  await db.contact.deleteMany();
  await db.company.deleteMany();

  // ---------- Companies ----------
  console.log("🏢 Création des entreprises...");
  const companies = await Promise.all([
    db.company.create({
      data: {
        name: "Sahel Tech SARL",
        industry: "Technologie",
        website: "https://sahel-tech.com",
        location: "Bamako, Mali",
        employees: 45,
        revenue: 850000000,
        description: "Solutions logicielles et intégration cloud pour PME ouest-africaines.",
        status: "active",
      },
    }),
    db.company.create({
      data: {
        name: "Coris Bank International",
        industry: "Finance",
        website: "https://corisbank.com",
        location: "Ouagadougou, Burkina Faso",
        employees: 1200,
        revenue: 45000000000,
        description: "Banque régionale de référence, services de banque de détail et corporate.",
        status: "active",
      },
    }),
    db.company.create({
      data: {
        name: "Faso Agro Industries",
        industry: "Agroalimentaire",
        website: "https://fasoagro.bf",
        location: "Bobo-Dioulasso, Burkina Faso",
        employees: 320,
        revenue: 12000000000,
        description: "Transformation de céréales et production de denrées alimentaires locales.",
        status: "active",
      },
    }),
    db.company.create({
      data: {
        name: "Nimba Distribution",
        industry: "Distribution",
        website: "https://nimba-dist.com",
        location: "Abidjan, Côte d'Ivoire",
        employees: 180,
        revenue: 6500000000,
        description: "Distribution de biens de consommation et logistique régionale.",
        status: "active",
      },
    }),
    db.company.create({
      data: {
        name: "Tabaski Consulting",
        industry: "Conseil",
        website: "https://tabaski-consulting.com",
        location: "Dakar, Sénégal",
        employees: 28,
        revenue: 1800000000,
        description: "Cabinet de conseil en stratégie et transformation digitale.",
        status: "active",
      },
    }),
    db.company.create({
      data: {
        name: "TransSahel Logistique",
        industry: "Logistique",
        website: "https://transsahel.com",
        location: "Niamey, Niger",
        employees: 95,
        revenue: 4200000000,
        description: "Transport interurbain et fret international corridor Abidjan-Ouagadougou.",
        status: "active",
      },
    }),
    db.company.create({
      data: {
        name: "Savane Énergie",
        industry: "Énergie",
        website: "https://savane-energie.com",
        location: "Bamako, Mali",
        employees: 150,
        revenue: 9500000000,
        description: "Production d'énergie solaire et hybride pour zones rurales.",
        status: "prospect",
      },
    }),
    db.company.create({
      data: {
        name: "Telecoms Africa",
        industry: "Télécommunications",
        website: "https://telecoms-africa.com",
        location: "Abidjan, Côte d'Ivoire",
        employees: 850,
        revenue: 28000000000,
        description: "Opérateur de télécommunications, infrastructure fibre et mobile.",
        status: "active",
      },
    }),
  ]);
  console.log(`  ✅ ${companies.length} entreprises créées`);

  // ---------- Contacts ----------
  console.log("👤 Création des contacts...");
  const contacts = await Promise.all([
    db.contact.create({
      data: {
        firstName: "Awa", lastName: "Traoré",
        email: "awa.traore@sahel-tech.com", phone: "+223 76 12 34 56",
        position: "Directrice Générale", source: "referral", status: "active",
        companyId: companies[0].id,
      },
    }),
    db.contact.create({
      data: {
        firstName: "Ibrahim", lastName: "Sawadogo",
        email: "i.sawadogo@corisbank.com", phone: "+226 70 89 45 12",
        position: "Directeur IT", source: "event", status: "active",
        companyId: companies[1].id,
      },
    }),
    db.contact.create({
      data: {
        firstName: "Fatoumata", lastName: "Kone",
        email: "f.kone@corisbank.com", phone: "+226 78 23 56 78",
        position: "Responsable Achats", source: "linkedin", status: "active",
        companyId: companies[1].id,
      },
    }),
    db.contact.create({
      data: {
        firstName: "Moussa", lastName: "Diallo",
        email: "m.diallo@fasoagro.bf", phone: "+226 76 45 67 89",
        position: "Directeur des opérations", source: "referral", status: "active",
        companyId: companies[2].id,
      },
    }),
    db.contact.create({
      data: {
        firstName: "Aïcha", lastName: "Bamba",
        email: "a.bamba@fasoagro.bf", phone: "+226 70 14 25 36",
        position: "Responsable Qualité", source: "manual", status: "active",
        companyId: companies[2].id,
      },
    }),
    db.contact.create({
      data: {
        firstName: "Konaté", lastName: "Yacouba",
        email: "k.yacouba@nimba-dist.com", phone: "+225 07 88 99 44",
        position: "PDG", source: "referral", status: "active",
        companyId: companies[3].id,
      },
    }),
    db.contact.create({
      data: {
        firstName: "Mariam", lastName: "Cissé",
        email: "m.cisse@tabaski-consulting.com", phone: "+221 77 123 45 67",
        position: "Associée gérante", source: "website", status: "active",
        companyId: companies[4].id,
      },
    }),
    db.contact.create({
      data: {
        firstName: "Ousmane", lastName: "Barro",
        email: "o.barro@tabaski-consulting.com", phone: "+221 78 456 78 90",
        position: "Consultant senior", source: "linkedin", status: "lead",
        companyId: companies[4].id,
      },
    }),
    db.contact.create({
      data: {
        firstName: "Seydou", lastName: "Maïga",
        email: "s.maiga@transsahel.com", phone: "+227 90 12 34 56",
        position: "Directeur Logistique", source: "event", status: "active",
        companyId: companies[5].id,
      },
    }),
    db.contact.create({
      data: {
        firstName: "Aminata", lastName: "Diarra",
        email: "a.diarra@savane-energie.com", phone: "+223 65 78 90 12",
        position: "Directrice Commerciale", source: "manual", status: "lead",
        companyId: companies[6].id,
      },
    }),
    db.contact.create({
      data: {
        firstName: "Bakary", lastName: "Touré",
        email: "b.toure@telecoms-africa.com", phone: "+225 07 77 88 99",
        position: "VP Infrastructure", source: "referral", status: "active",
        companyId: companies[7].id,
      },
    }),
    db.contact.create({
      data: {
        firstName: "Nadège", lastName: "Ouattara",
        email: "n.ouattara@telecoms-africa.com", phone: "+225 07 66 55 44",
        position: "Responsable Achats IT", source: "linkedin", status: "active",
        companyId: companies[7].id,
      },
    }),
    db.contact.create({
      data: {
        firstName: "Adama", lastName: "Zerbo",
        email: "a.zerbo@fasoagro.bf", phone: "+226 76 99 88 77",
        position: "Comptable principal", source: "manual", status: "active",
        companyId: companies[2].id,
      },
    }),
    db.contact.create({
      data: {
        firstName: "Rokia", lastName: "Coulibaly",
        email: "r.coulibaly@sahel-tech.com", phone: "+223 76 54 32 10",
        position: "Responsable Marketing", source: "website", status: "active",
        companyId: companies[0].id,
      },
    }),
    db.contact.create({
      data: {
        firstName: "Yacouba", lastName: "Nacro",
        email: "y.nacro@nimba-dist.com", phone: "+225 07 55 44 33",
        position: "Responsable Supply Chain", source: "manual", status: "inactive",
        companyId: companies[3].id,
      },
    }),
  ]);
  console.log(`  ✅ ${contacts.length} contacts créés`);

  // ---------- Deals ----------
  console.log("💼 Création des opportunités...");
  const now = new Date();
  const inDays = (d: number) => new Date(now.getTime() + d * 86400000);
  const ago = (d: number) => new Date(now.getTime() - d * 86400000);

  const deals = await Promise.all([
    db.deal.create({
      data: {
        title: "Licence ERP + déploiement", value: 45000000, stage: "negotiation",
        probability: 70, closeDate: inDays(20),
        description: "Déploiement ERP pour 45 postes, formation et support 1 an.",
        companyId: companies[0].id, contactId: contacts[0].id,
      },
    }),
    db.deal.create({
      data: {
        title: "Infrastructure cloud bancaire", value: 120000000, stage: "proposal",
        probability: 50, closeDate: inDays(45),
        description: "Migration des charges de travail vers cloud privé sécurisé.",
        companyId: companies[1].id, contactId: contacts[1].id,
      },
    }),
    db.deal.create({
      data: {
        title: "Module de suivi qualité", value: 18000000, stage: "qualified",
        probability: 40, closeDate: inDays(60),
        description: "Application de traçabilité qualité pour chaîne de production.",
        companyId: companies[2].id, contactId: contacts[3].id,
      },
    }),
    db.deal.create({
      data: {
        title: "Système de gestion de stock", value: 32000000, stage: "negotiation",
        probability: 65, closeDate: inDays(15),
        description: "WMS multi-entrepôts avec intégration comptable.",
        companyId: companies[3].id, contactId: contacts[5].id,
      },
    }),
    db.deal.create({
      data: {
        title: "Audit transformation digitale", value: 15000000, stage: "closed_won",
        probability: 100, closeDate: ago(30),
        description: "Mission d'audit et plan de transformation sur 3 mois.",
        companyId: companies[4].id, contactId: contacts[6].id,
      },
    }),
    db.deal.create({
      data: {
        title: "Suivi de flotte GPS", value: 25000000, stage: "proposal",
        probability: 55, closeDate: inDays(40),
        description: "Solution de géolocalisation et télémétrie pour 80 véhicules.",
        companyId: companies[5].id, contactId: contacts[8].id,
      },
    }),
    db.deal.create({
      data: {
        title: "Mini-réseau solaire villageois", value: 75000000, stage: "lead",
        probability: 20, closeDate: inDays(90),
        description: "Pilot de 3 mini-réseaux hybrides pour localités rurales.",
        companyId: companies[6].id, contactId: contacts[9].id,
      },
    }),
    db.deal.create({
      data: {
        title: "Refonte datacenter fibre", value: 200000000, stage: "qualified",
        probability: 35, closeDate: inDays(75),
        description: "Extension du datacenter et backbone fibre national.",
        companyId: companies[7].id, contactId: contacts[10].id,
      },
    }),
    db.deal.create({
      data: {
        title: "Formation équipes commerciales", value: 8000000, stage: "closed_won",
        probability: 100, closeDate: ago(60),
        description: "Programme de formation 5 jours pour 20 commerciaux.",
        companyId: companies[4].id, contactId: contacts[7].id,
      },
    }),
    db.deal.create({
      data: {
        title: "Solution de facturation électronique", value: 22000000, stage: "closed_lost",
        probability: 0, closeDate: ago(15),
        description: "SaaS de facturation conforme à la réglementation fiscale.",
        companyId: companies[2].id, contactId: contacts[4].id,
      },
    }),
    db.deal.create({
      data: {
        title: "Extension ERP module RH", value: 15000000, stage: "lead",
        probability: 15, closeDate: inDays(120),
        description: "Module paie et congés pour ERP existant.",
        companyId: companies[0].id, contactId: contacts[13].id,
      },
    }),
    db.deal.create({
      data: {
        title: "Maintenance préventive équipements", value: 12000000, stage: "qualified",
        probability: 45, closeDate: inDays(50),
        description: "Contrat de maintenance annuel pour parcs machines.",
        companyId: companies[7].id, contactId: contacts[11].id,
      },
    }),
  ]);
  console.log(`  ✅ ${deals.length} opportunités créées`);

  // ---------- Activities ----------
  console.log("📞 Création des activités...");
  const activities = await Promise.all([
    db.activity.create({ data: { type: "call", title: "Appel découverte avec DG", description: "Présentation de notre offre ERP, très intéressé.", date: ago(5), completed: true, contactId: contacts[0].id, dealId: deals[0].id } }),
    db.activity.create({ data: { type: "email", title: "Envoi proposition commerciale", description: "Envoi du devis détaillé pour le module ERP.", date: ago(3), completed: true, contactId: contacts[0].id, dealId: deals[0].id } }),
    db.activity.create({ data: { type: "meeting", title: "Réunion négociation contractuelle", description: "Discussion sur les termes du contrat et SLA.", date: inDays(2), completed: false, contactId: contacts[0].id, dealId: deals[0].id } }),
    db.activity.create({ data: { type: "meeting", title: "Présentation architecturale", description: "Présentation de l'architecture cible cloud bancaire.", date: ago(8), completed: true, contactId: contacts[1].id, dealId: deals[1].id } }),
    db.activity.create({ data: { type: "task", title: "Préparer maquette UI qualité", description: "Maquettes Figma pour module de suivi qualité.", date: inDays(3), completed: false, contactId: contacts[3].id, dealId: deals[2].id } }),
    db.activity.create({ data: { type: "call", title: "Appel de suivi achats Coris", description: "Comprendre le calendrier budgétaire.", date: ago(10), completed: true, contactId: contacts[2].id, dealId: deals[1].id } }),
    db.activity.create({ data: { type: "email", title: "Relance proposition WMS", description: "Relance pour demande de révision du devis.", date: ago(2), completed: true, contactId: contacts[5].id, dealId: deals[3].id } }),
    db.activity.create({ data: { type: "meeting", title: "Négociation prix WMS", description: "Discussion sur remise volume et calendrier.", date: inDays(5), completed: false, contactId: contacts[5].id, dealId: deals[3].id } }),
    db.activity.create({ data: { type: "task", title: "Finaliser rapport d'audit", description: "Document de restitution de l'audit digital.", date: ago(35), completed: true, contactId: contacts[6].id, dealId: deals[4].id } }),
    db.activity.create({ data: { type: "call", title: "Appel satisfaction post-vente", description: "Client satisfait, évoque extension du périmètre.", date: ago(20), completed: true, contactId: contacts[6].id, dealId: deals[4].id } }),
    db.activity.create({ data: { type: "email", title: "Envoi proposition GPS flotte", description: "Proposition détaillée avec ROI estimé.", date: ago(6), completed: true, contactId: contacts[8].id, dealId: deals[5].id } }),
    db.activity.create({ data: { type: "meeting", title: "Visite site logistique Nimba", description: "Démonstration de traçabilité en entrepôt.", date: inDays(7), completed: false, contactId: contacts[8].id, dealId: deals[5].id } }),
    db.activity.create({ data: { type: "call", title: "Premier contact Savane Énergie", description: "Intro via common, besoin de mini-réseaux.", date: ago(12), completed: true, contactId: contacts[9].id, dealId: deals[6].id } }),
    db.activity.create({ data: { type: "task", title: "Rédiger note technique mini-réseau", description: "Préparer une note technique préliminaire.", date: inDays(10), completed: false, contactId: contacts[9].id, dealId: deals[6].id } }),
    db.activity.create({ data: { type: "meeting", title: "Atelier besoins datacenter", description: "Cadrage fonctionnel de l'extension datacenter.", date: inDays(15), completed: false, contactId: contacts[10].id, dealId: deals[7].id } }),
    db.activity.create({ data: { type: "email", title: "Envoi support formation commerciale", description: "Envoi du support et exercices post-formation.", date: ago(62), completed: true, contactId: contacts[7].id, dealId: deals[8].id } }),
    db.activity.create({ data: { type: "call", title: "Appel refacturation électronique", description: "Client a choisi un concurrent, retour d'expérience.", date: ago(16), completed: true, contactId: contacts[4].id, dealId: deals[9].id } }),
    db.activity.create({ data: { type: "task", title: "Rédiger proposition module RH", description: "Scénariser l'extension RH de l'ERP.", date: inDays(12), completed: false, contactId: contacts[13].id, dealId: deals[10].id } }),
    db.activity.create({ data: { type: "call", title: "Appel de prise de besoin maintenance", description: "Inventaire des équipements à couvrir.", date: ago(7), completed: true, contactId: contacts[11].id, dealId: deals[11].id } }),
    db.activity.create({ data: { type: "email", title: "Envoi catalogue services maintenance", description: "Catalogue des prestations et niveaux de service.", date: ago(4), completed: true, contactId: contacts[11].id, dealId: deals[11].id } }),
  ]);
  console.log(`  ✅ ${activities.length} activités créées`);

  // ---------- Notes ----------
  console.log("📝 Création des notes...");
  const notes = await Promise.all([
    db.note.create({ data: { content: "Société très réactive, décision attendue sous 2 semaines. Budget confirmé.", dealId: deals[0].id, contactId: contacts[0].id } }),
    db.note.create({ data: { content: "Exigences de sécurité élevées (banque), prévoir certification.", dealId: deals[1].id, companyId: companies[1].id } }),
    db.note.create({ data: { content: "Le DG souhaite une démo du module de traçabilité.", dealId: deals[2].id, contactId: contacts[3].id } }),
    db.note.create({ data: { content: "Nimba Distribution envisage un rollout sur 3 pays, potentiel d'expansion.", dealId: deals[3].id, companyId: companies[3].id } }),
    db.note.create({ data: { content: "Mission d'audit clôturée, retour positif du client.", dealId: deals[4].id, contactId: contacts[6].id } }),
    db.note.create({ data: { content: "Prévoir une visite de site pour valider la faisabilité GPS.", dealId: deals[5].id, contactId: contacts[8].id } }),
    db.note.create({ data: { content: "Financement par bailleur régional à confirmer.", dealId: deals[6].id, contactId: contacts[9].id } }),
    db.note.create({ data: { content: "Télécoms Africa a un calendrier serré, capacité de réponse critique.", dealId: deals[7].id, companyId: companies[7].id } }),
    db.note.create({ data: { content: "Formation bien accueillie, évaluation moyenne 4.6/5.", dealId: deals[8].id, contactId: contacts[7].id } }),
    db.note.create({ data: { content: "Perte du deal : choix d'un concurrent moins cher. Objectif : rengager dans 6 mois.", dealId: deals[9].id, companyId: companies[2].id } }),
  ]);
  console.log(`  ✅ ${notes.length} notes créées`);

  console.log("\n✅ Seed CRM terminé !");
  const counts = await Promise.all([
    db.company.count(), db.contact.count(), db.deal.count(),
    db.activity.count(), db.note.count(),
  ]);
  console.log(`   Entreprises: ${counts[0]}, Contacts: ${counts[1]}, Deals: ${counts[2]}, Activités: ${counts[3]}, Notes: ${counts[4]}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
