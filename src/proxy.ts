import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 — la convention "middleware" est dépréciée en faveur de "proxy".
// Le fichier doit être nommé `proxy.ts` (à la racine de `src/` ou du projet).
// La fonction exportée peut s'appeler `proxy` ou `middleware` (alias acceptés).
export function proxy(request: NextRequest) {
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  }
  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  return response;
}

export const config = { matcher: ["/api/:path*"] };
