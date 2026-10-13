// Mini-service WebSocket SAVERDEV — notifications temps réel.
//
// Rôle : recevoir les notifications émises par le backend Next.js (route
// /api/notifications/*) et les broadcaster à tous les clients connectés
// (le frontend Next.js se connecte via io("/?XTransformPort=3030")).
//
// Endpoints HTTP (pour le backend Next.js) :
//   GET  /              → statut JSON (smoke test)
//   POST /emit          → body { event?, payload } → broadcast sur
//                         l'event "notification:new" (ou `event` si fourni)
//
// Port : 3030 (fixe — référencé par Caddy et par le client).
//
// Convention Caddyfile : path "/" obligatoire pour le socket.io. Comme
// engine.io intercepte TOUTES les requêtes quand path="/" (cf. source
// engine.io : `path === req.url.slice(0, path.length)` est toujours vrai),
// on retire le listener engine.io et on ajoute le nôtre qui :
//   - délègue à engine.io les requêtes avec query EIO/transport
//   - gère en HTTP les autres requêtes (GET /, POST /emit)

import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { Server } from "socket.io";

const PORT = 3030;

const httpServer = createServer();

const io = new Server(httpServer, {
  // Le path "/" est utilisé par Caddy pour router vers le bon port.
  // NE PAS MODIFIER.
  path: "/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

/** Vrai si la requête est une requête engine.io (socket.io). */
function isEngineIoRequest(req: IncomingMessage): boolean {
  const url = req.url ?? "";
  // engine.io envoie toujours les query params EIO et transport
  return url.includes("EIO=") || url.includes("transport=");
}

/** Routeur HTTP "maison" pour GET / et POST /emit. */
function handleHttpRequest(req: IncomingMessage, res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && (req.url === "/" || req.url === "" || req.url?.startsWith("/?"))) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        service: "notifications-ws",
        status: "ok",
        port: PORT,
        connectedClients: io.engine.clientsCount,
        uptime: process.uptime(),
      })
    );
    return;
  }

  if (req.method === "POST" && (req.url === "/emit" || req.url === "/emit/")) {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const parsed = JSON.parse(body) as { event?: string; payload?: unknown };
        const event = parsed.event || "notification:new";
        const payload = parsed.payload ?? {};
        io.emit(event, payload);
        console.log(`[ws] emit "${event}" → ${io.engine.clientsCount} client(s)`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            ok: true,
            event,
            broadcastedTo: io.engine.clientsCount,
          })
        );
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: (e as Error).message }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
}

// CRITIQUE : engine.io (attaché par `new Server(httpServer)`) enregistre
// un listener "request" unique qui intercepte TOUTES les requêtes quand
// path="/". On récupère ce listener, on le retire, et on ajoute le nôtre
// qui décide : engine.io pour les requêtes socket.io, HTTP pour le reste.
const eioListener = httpServer.listeners("request").slice(0);
httpServer.removeAllListeners("request");
httpServer.on("request", (req, res) => {
  if (isEngineIoRequest(req)) {
    // Laisse engine.io traiter (socket.io handshake, polling, websocket upgrade)
    for (const l of eioListener) {
      l.call(httpServer, req, res);
    }
    return;
  }
  handleHttpRequest(req, res);
});

io.on("connection", (socket) => {
  console.log(`[ws] client connected: ${socket.id}`);

  socket.on("notification:new", (payload: unknown) => {
    io.emit("notification:new", payload);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[ws] client disconnected: ${socket.id} (${reason})`);
  });

  socket.on("error", (err: unknown) => {
    console.error(`[ws] socket error ${socket.id}:`, err);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[ws] notifications-ws service running on port ${PORT}`);
  console.log(`[ws] GET  /              → smoke test`);
  console.log(`[ws] POST /emit          → { event, payload } broadcast`);
  console.log(`[ws] socket.io path "/" (Caddy gateway)`);
});

process.on("SIGTERM", () => {
  console.log("[ws] SIGTERM received, shutting down...");
  io.close();
  httpServer.close(() => {
    console.log("[ws] server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("[ws] SIGINT received, shutting down...");
  io.close();
  httpServer.close(() => {
    console.log("[ws] server closed");
    process.exit(0);
  });
});
