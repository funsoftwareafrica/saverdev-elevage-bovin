// Vue Carte 3D — exploitation localisée à Zinder, Niger (13.8°N, 8.9°E)
// Vue isométrique 3D des pâturages avec bovins positionnés
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard, ViewHeader } from "./_shared";
import { usePaturages, useBovins } from "@/lib/api";
import { MapPin, Layers, RotateCw, Maximize2, Navigation, Box, Beef, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Coordonnées réelles Zinder, Niger
const ZINDER_CENTER = { lat: 13.8071, lng: 8.9884 };
const ZINDER_NAME = "Zinder, Niger";

// Pâturages autour de Zinder avec coordonnées GPS réelles
const PATURAGES_DATA = [
  { id: "p1", nom: "Pâturage Nord — Zinder", surface: 5.5, capacite: 20, lat: 13.85, lng: 8.97, color: "#10B981" },
  { id: "p2", nom: "Parcelle Est — Damana", surface: 3.2, capacite: 12, lat: 13.79, lng: 9.05, color: "#14B8A6" },
  { id: "p3", nom: "Enclos d'engraissement — Birni", surface: 1.8, capacite: 15, lat: 13.81, lng: 8.99, color: "#34D399" },
  { id: "p4", nom: "Pâturage Sud — Karkada", surface: 4.0, capacite: 18, lat: 13.76, lng: 8.96, color: "#6EE7B7" },
];

export function Carte3DView() {
  const { data: paturages } = usePaturages();
  const { data: bovins } = useBovins();
  const [rotation, setRotation] = useState(15);
  const [tilt, setTilt] = useState(55);
  const [selectedPaturage, setSelectedPaturage] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);

  const allPaturages = paturages?.length ? paturages : PATURAGES_DATA.map((p) => ({ ...p, coordonnees: null, createdAt: new Date().toISOString(), id: p.id }));
  const allBovins = bovins ?? [];
  const bovinsActifs = allBovins.filter((b) => b.statut === "EN_ENGRAISSEMENT");

  // Répartition simulée des bovins sur les pâturages
  const bovinsParPaturage = (paturageId: string) => {
    const idx = PATURAGES_DATA.findIndex((p) => p.id === paturageId);
    return bovinsActifs.filter((_, i) => i % PATURAGES_DATA.length === idx);
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Carte 3D — Exploitation"
        description={`Vue isométrique géolocalisée — ${ZINDER_NAME} (13.8°N, 8.9°E)`}
        icon={Box}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setTilt((t) => Math.max(20, t - 10))}>
              <Eye className="h-4 w-4" /> Vue +
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRotation((r) => (r + 15) % 360)}>
              <RotateCw className="h-4 w-4" /> Rotation
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowLabels((v) => !v)}>
              <Layers className="h-4 w-4" /> {showLabels ? "Masquer" : "Afficher"} labels
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Parcelles" value={PATURAGES_DATA.length} icon={MapPin} variant="primary" />
        <KpiCard label="Surface totale" value={`${PATURAGES_DATA.reduce((s, p) => s + p.surface, 0).toFixed(1)} ha`} icon={Maximize2} />
        <KpiCard label="Capacité totale" value={`${PATURAGES_DATA.reduce((s, p) => s + p.capacite, 0)} bovins`} icon={Beef} variant="success" />
        <KpiCard label="Bovins actifs" value={bovinsActifs.length} icon={Beef} variant="warning" />
      </div>

      {/* Carte 3D isométrique */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary" /> Vue 3D isométrique — {ZINDER_NAME}
          </CardTitle>
          <CardDescription className="text-xs">
            Coordonnées GPS : {ZINDER_CENTER.lat}°N, {ZINDER_CENTER.lng}°E · Cliquez sur une parcelle pour les détails
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={mapRef}
            className="relative h-[500px] bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 overflow-hidden"
            style={{ perspective: "1200px" }}
          >
            {/* Grille de fond (réseau routier stylisé) */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(16,185,129,0.08) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />

            {/* Cercles de rayonnement (zones d'influence) */}
            {PATURAGES_DATA.map((p, i) => (
              <div
                key={`halo-${p.id}`}
                className="absolute rounded-full opacity-20"
                style={{
                  left: `${20 + i * 20}%`,
                  top: `${15 + (i % 2) * 30}%`,
                  width: `${p.surface * 30}px`,
                  height: `${p.surface * 30}px`,
                  backgroundColor: p.color,
                  filter: "blur(20px)",
                }}
              />
            ))}

            {/* Plan 3D isométrique */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `rotateX(${tilt}deg) rotateZ(${rotation}deg)`,
                transformStyle: "preserve-3d",
                transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <div className="relative" style={{ width: "600px", height: "400px", transformStyle: "preserve-3d" }}>
                {/* Parcelles 3D */}
                {PATURAGES_DATA.map((p, i) => {
                  const positions = [
                    { left: "5%", top: "5%", w: "40%", h: "35%" },
                    { left: "55%", top: "10%", w: "35%", h: "30%" },
                    { left: "15%", top: "55%", w: "30%", h: "30%" },
                    { left: "55%", top: "55%", w: "35%", h: "35%" },
                  ];
                  const pos = positions[i];
                  const bovinsOnPaturage = bovinsParPaturage(p.id);
                  const occupancy = Math.round((bovinsOnPaturage.length / p.capacite) * 100);
                  const isSelected = selectedPaturage === p.id;

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 30, rotateX: -20 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ delay: i * 0.15, duration: 0.5 }}
                      whileHover={{ scale: 1.05, rotateY: 5 }}
                      onClick={() => setSelectedPaturage(isSelected ? null : p.id)}
                      className="absolute cursor-pointer rounded-xl border-2 p-3 transition-all"
                      style={{
                        left: pos.left,
                        top: pos.top,
                        width: pos.w,
                        height: pos.h,
                        backgroundColor: p.color + "30",
                        borderColor: isSelected ? p.color : p.color + "60",
                        boxShadow: isSelected
                          ? `0 0 0 3px ${p.color}, 0 10px 40px ${p.color}40`
                          : `0 4px 20px ${p.color}20`,
                        transformStyle: "preserve-3d",
                      }}
                    >
                      {/* Label de la parcelle */}
                      {showLabels && (
                        <div className="mb-2">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={12} style={{ color: p.color }} />
                            <span className="text-xs font-bold" style={{ color: p.color }}>{p.nom}</span>
                          </div>
                          <p className="text-[0.6rem] text-slate-500 mt-0.5">
                            {p.surface} ha · {p.capacite} places · {p.lat}°N, {p.lng}°E
                          </p>
                        </div>
                      )}

                      {/* Bovins 3D (points colorés) */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {bovinsOnPaturage.slice(0, 12).map((b, bi) => (
                          <motion.div
                            key={b.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.15 + bi * 0.05 + 0.3, type: "spring", stiffness: 300 }}
                            className="rounded-full flex items-center justify-center text-[0.5rem] font-bold text-white"
                            style={{
                              width: "22px",
                              height: "22px",
                              backgroundColor: b.statut === "VENDU" ? "#94A3B8" : p.color,
                              boxShadow: `0 2px 8px ${p.color}60`,
                            }}
                            title={b.identifiant}
                          >
                            {b.identifiant.slice(-2)}
                          </motion.div>
                        ))}
                        {bovinsOnPaturage.length === 0 && (
                          <span className="text-[0.6rem] text-slate-400 italic">Vide</span>
                        )}
                      </div>

                      {/* Barre d'occupation */}
                      <div className="absolute bottom-2 left-3 right-3">
                        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, occupancy)}%`,
                              backgroundColor: occupancy > 80 ? "#EF4444" : occupancy > 60 ? "#F59E0B" : p.color,
                            }}
                          />
                        </div>
                        <p className="text-[0.55rem] text-slate-500 mt-0.5">
                          {bovinsOnPaturage.length}/{p.capacite} ({occupancy}%)
                        </p>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Point central Zinder */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ transform: "translate(-50%, -50%) translateZ(20px)" }}
                >
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[0.6rem] font-bold text-slate-700 mt-1 bg-white/80 px-2 py-0.5 rounded-full">
                      {ZINDER_NAME}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay infos */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-xl p-3 shadow-lg">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Navigation className="h-3 w-3 text-primary" />
                {ZINDER_NAME}
              </p>
              <p className="text-[0.65rem] text-muted-foreground mt-1">
                {ZINDER_CENTER.lat}°N, {ZINDER_CENTER.lng}°E
              </p>
              <p className="text-[0.65rem] text-muted-foreground">
                {PATURAGES_DATA.length} parcelles · {bovinsActifs.length} bovins actifs
              </p>
            </div>

            {/* Légende */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-xl p-3 shadow-lg">
              <p className="text-[0.65rem] font-semibold mb-2">Légende</p>
              {PATURAGES_DATA.map((p) => (
                <div key={p.id} className="flex items-center gap-2 mb-1">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-[0.6rem] text-slate-600">{p.nom}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1 pt-1 border-t">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-[0.6rem] text-slate-600">Centre Zinder</span>
              </div>
            </div>

            {/* Détails parcelle sélectionnée */}
            {selectedPaturage && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg max-w-xs"
              >
                {(() => {
                  const p = PATURAGES_DATA.find((x) => x.id === selectedPaturage)!;
                  const b = bovinsParPaturage(p.id);
                  return (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold" style={{ color: p.color }}>{p.nom}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedPaturage(null)}>×</Button>
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="text-muted-foreground">Surface: <span className="font-semibold text-foreground">{p.surface} ha</span></p>
                        <p className="text-muted-foreground">Capacité: <span className="font-semibold text-foreground">{p.capacite} bovins</span></p>
                        <p className="text-muted-foreground">GPS: <span className="font-mono text-foreground">{p.lat}°N, {p.lng}°E</span></p>
                        <p className="text-muted-foreground">Occupation: <span className="font-semibold text-foreground">{b.length}/{p.capacite} ({Math.round(b.length/p.capacite*100)}%)</span></p>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {b.slice(0, 8).map((bovin) => (
                          <Badge key={bovin.id} variant="outline" className="text-[0.55rem]" style={{ color: p.color, borderColor: p.color + "40" }}>
                            {bovin.identifiant}
                          </Badge>
                        ))}
                        {b.length > 8 && <span className="text-[0.6rem] text-muted-foreground">+{b.length - 8}</span>}
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des parcelles (table) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Parcelles géolocalisées — {ZINDER_NAME}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-3 font-medium text-xs uppercase">Parcelle</th>
                  <th className="p-3 font-medium text-xs uppercase text-right">Surface (ha)</th>
                  <th className="p-3 font-medium text-xs uppercase text-right">Capacité</th>
                  <th className="p-3 font-medium text-xs uppercase">Coordonnées GPS</th>
                  <th className="p-3 font-medium text-xs uppercase text-center">Occupation</th>
                </tr>
              </thead>
              <tbody>
                {PATURAGES_DATA.map((p) => {
                  const b = bovinsParPaturage(p.id);
                  const occ = Math.round((b.length / p.capacite) * 100);
                  return (
                    <tr key={p.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedPaturage(p.id)}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="font-medium">{p.nom}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right tabular-nums">{p.surface}</td>
                      <td className="p-3 text-right tabular-nums">{p.capacite}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{p.lat}°N, {p.lng}°E</td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className={occ > 80 ? "text-red-700 bg-red-50 border-red-200" : occ > 60 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-emerald-700 bg-emerald-50 border-emerald-200"}>
                          {b.length}/{p.capacite} ({occ}%)
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
