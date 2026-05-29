"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend } from "@/lib/api";

export type SettingsDTO = {
  enabled: boolean;
  whatsappNumberOverride: string | null;
  resumoMatinalEnabled: boolean;
  resumoMatinalTime: string;
  alertaGargaloEnabled: boolean;
  alertaSucessoEnabled: boolean;
  lembretePrazoEnabled: boolean;
  lembretePrazoMinutos: number;
};

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => apiGet<SettingsDTO>("/api/settings/notifications"),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SettingsDTO>) =>
      apiSend<SettingsDTO>("/api/settings/notifications", "PUT", data),
    onSuccess: (data) => qc.setQueryData(["settings"], data),
  });
}
