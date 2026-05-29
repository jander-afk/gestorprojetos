"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useSettings, useUpdateSettings, type SettingsDTO } from "@/hooks/use-settings";

export default function ConfigPage() {
  const { data, isLoading } = useSettings();
  const update = useUpdateSettings();
  const [form, setForm] = useState<SettingsDTO | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  if (isLoading || !form) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  function set<K extends keyof SettingsDTO>(key: K, value: SettingsDTO[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setSaved(false);
  }

  async function save() {
    if (!form) return;
    await update.mutateAsync(form);
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <Row
          title="Notificações no WhatsApp"
          desc="Liga ou desliga todos os disparos."
        >
          <Switch
            checked={form.enabled}
            onChange={(v) => set("enabled", v)}
          />
        </Row>

        <Field label="Número de WhatsApp (E.164, sem +)">
          <input
            value={form.whatsappNumberOverride ?? ""}
            onChange={(e) =>
              set("whatsappNumberOverride", e.target.value || null)
            }
            placeholder="5582999999999"
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
      </section>

      <section className="space-y-1 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-2 font-heading font-semibold">Gatilhos</h2>

        <Row title="Resumo matinal" desc="Tarefas em Foco de Hoje, todo dia.">
          <Switch
            checked={form.resumoMatinalEnabled}
            onChange={(v) => set("resumoMatinalEnabled", v)}
          />
        </Row>
        <Field label="Horário do resumo">
          <input
            type="time"
            value={form.resumoMatinalTime}
            onChange={(e) => set("resumoMatinalTime", e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>

        <Row title="Alerta de gargalo" desc="Quando uma tarefa vai para Pendente.">
          <Switch
            checked={form.alertaGargaloEnabled}
            onChange={(v) => set("alertaGargaloEnabled", v)}
          />
        </Row>

        <Row
          title="Alerta de sucesso"
          desc="Quando uma tarefa entra em Aprovado ou Concluído."
        >
          <Switch
            checked={form.alertaSucessoEnabled}
            onChange={(v) => set("alertaSucessoEnabled", v)}
          />
        </Row>

        <Row title="Lembrete de prazo" desc="Antes do vencimento da tarefa.">
          <Switch
            checked={form.lembretePrazoEnabled}
            onChange={(v) => set("lembretePrazoEnabled", v)}
          />
        </Row>
        <Field label="Antecedência do lembrete (minutos)">
          <input
            type="number"
            min={5}
            max={1440}
            value={form.lembretePrazoMinutos}
            onChange={(e) =>
              set("lembretePrazoMinutos", Number(e.target.value))
            }
            className="h-10 w-32 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending ? "Salvando…" : "Salvar"}
        </Button>
        {saved && <span className="text-sm text-primary">Salvo ✓</span>}
      </div>
    </div>
  );
}

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5 py-3">
      <label className="text-sm font-medium">{label}</label>
      <div>{children}</div>
    </div>
  );
}
