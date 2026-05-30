import { HttpError } from "@/lib/http";

// Autenticação por chave de API (header x-api-key ou Authorization: Bearer).
// Usada pelos endpoints externos (/api/ext/*) que o conector MCP consome.
export function requireApiKey(req: Request): void {
  const fromHeader = req.headers.get("x-api-key");
  const fromAuth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const key = fromHeader || fromAuth;
  const expected = process.env.API_TOKEN;
  if (!expected) throw new HttpError(500, "API_TOKEN não configurado no servidor");
  if (!key || key !== expected) throw new HttpError(401, "Chave de API inválida");
}
