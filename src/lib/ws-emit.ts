// Helper pour émettre un event WebSocket au mini-service notifications-ws.
//
// Le mini-service écoute sur le port 3030 et expose POST /emit qui
// broadcast à tous les clients connectés (frontend Next.js via
// io("/?XTransformPort=3030")).
//
// On garde cet appel tolérant : si le mini-service est down (ex : en prod
// Vercel sans mini-service sidecar), on ignore silencieusement. Le frontend
// retombe sur le polling TanStack Query (60s).

const WS_EMIT_URL = "http://localhost:3030/emit";

export interface WsNotificationPayload {
  type: string;
  titre: string;
  message: string;
  severite?: string;
  date?: string;
}

/** Émet un event "notification:new" au mini-service WS. Tolérant aux échecs. */
export async function emitNotification(payload: WsNotificationPayload): Promise<void> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    await fetch(WS_EMIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "notification:new", payload }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
  } catch (e) {
    // Mini-service WS indisponible — on continue sans broadcast temps réel.
    console.debug("[ws-emit] mini-service indisponible:", e);
  }
}
