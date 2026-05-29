import type { DefaultSession } from "next-auth";

// Aumenta os tipos do NextAuth para carregar id e timezone do usuário.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      timezone?: string;
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    timezone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    timezone?: string;
  }
}
