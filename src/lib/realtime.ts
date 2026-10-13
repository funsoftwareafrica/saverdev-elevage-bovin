// Hook de notifications temps réel via socket.io.
//
// Connexion au mini-service WebSocket (mini-services/notifications-ws) sur
// le port 3030 via le gateway Caddy (`io("/?XTransformPort=3030")`).
//
// Quand une notification arrive (event "notification:new"), on invalide
// la query ["notifications"] de TanStack Query pour que le frontend
// rafraîchisse la liste + badge de non-lues.
//
// Task 31-B — revalidation multi-user : on écoute aussi l'event
// "saisie:new" (émis par /api/saisie POST via lib/ws-emit.ts). À la
// réception, on invalide globalement les queries pour que les tableaux
// de bord, journaux de saisie et rapports se rafraîchissent automatiquement
// (re-fetch TanStack Query). Payload transmis : `{ type: SaisieType }` pour
// permettre une invalidation sélective côté composants.
//
// Usage : `useRealtimeNotifications();` dans le shell (appel unique).

"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

export function useRealtimeNotifications() {
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Toujours utiliser le path "/" + XTransformPort pour Caddy.
    // Pas d'URL absolue (interdit par les conventions gateway).
    const socket = io("/?XTransformPort=3030", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10_000,
    });
    socketRef.current = socket;

    const onNotification = (_payload: unknown) => {
      // Invalide les queries de notifications pour forcer un refetch.
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    };

    // Task 31-B : event "saisie:new" — revalidation temps réel multi-user.
    // Payload : { type: SaisieType }. On invalide les queries serveur
    // (saisie, dashboard, rapport-bailleur, financement, etc.) pour qu'elles
    // se rafraîchissent automatiquement.
    const onSaisieNew = (payload: unknown) => {
      // Invalidation large : toutes les queries serveur concernées par une
      // saisie. On évite l'invalidation globale (trop coûteuse) en ciblant
      // les queryKeys les plus pertinentes.
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["rapport-bailleur"] });
      qc.invalidateQueries({ queryKey: ["bovins"] });
      qc.invalidateQueries({ queryKey: ["alimentations"] });
      qc.invalidateQueries({ queryKey: ["depenses"] });
      qc.invalidateQueries({ queryKey: ["ventes"] });
      qc.invalidateQueries({ queryKey: ["financement"] });
      qc.invalidateQueries({ queryKey: ["alertes"] });
      qc.invalidateQueries({ queryKey: ["historique"] });
      qc.invalidateQueries({ queryKey: ["tresorerie"] });
      // Log dev pour vérifier que l'event arrive.
      console.debug("[ws-notif] saisie:new reçu", payload);
    };

    socket.on("notification:new", onNotification);
    socket.on("saisie:new", onSaisieNew);

    socket.on("connect", () => {
      // Connexion établie — silencieux en prod, loggable en dev.
      console.debug("[ws-notif] connecté", socket.id);
    });

    socket.on("connect_error", (err: unknown) => {
      // Tolerant : si le mini-service WS est down, on retombe sur le polling.
      console.debug("[ws-notif] connexion échouée", err);
    });

    return () => {
      socket.off("notification:new", onNotification);
      socket.off("saisie:new", onSaisieNew);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [qc]);
}
