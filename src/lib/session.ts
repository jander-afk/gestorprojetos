import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HttpError } from "@/lib/http";

export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  timezone?: string;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as SessionUser) ?? null;
}

// Garante usuário autenticado em route handlers; senão lança 401.
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user?.id) throw new HttpError(401, "Não autenticado");
  return user;
}
