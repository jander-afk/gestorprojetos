import { redirect } from "next/navigation";

// Raiz do dashboard -> abre direto na visão Diária.
export default function DashboardIndex() {
  redirect("/hoje");
}
