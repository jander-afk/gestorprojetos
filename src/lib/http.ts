import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Erro com status HTTP, lançado nas camadas de serviço/sessão.
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

// Converte qualquer erro num NextResponse padronizado.
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: err.flatten() },
      { status: 400 },
    );
  }
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[API] erro não tratado:", err);
  return NextResponse.json({ error: "Erro interno" }, { status: 500 });
}
