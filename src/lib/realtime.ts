// Hook de notifications temps réel via socket.io.
//
// Connexion au mini-service WebSocket (mini-services/notifications-ws) sur
// le port 3030 via le gateway Caddy (`io("/?XTransformPort=3030")`).
//
// Quand une notification arrive (event "notification:new"), on invalide
// la query ["notifications"] de TanStack Query pour que le frontend
// rafraîchisse la liste + badge de non-lues.
//
// Usage : `useRealtimeNotifications();` dans le NotificationCenter (appel
// unique au niveau du shell).

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

    socket.on("notification:new", onNotification);

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
      socket.disconnect();
      socketRef.current = null;
    };
  }, [qc]);
}
