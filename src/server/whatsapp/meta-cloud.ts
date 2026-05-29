import type {
  WhatsappProvider,
  TemplateMessage,
  SendResult,
} from "./provider";

// Implementação do WhatsApp Cloud API oficial (Graph API da Meta).
// Só envia TEMPLATES — é o único tipo permitido para mensagem iniciada
// pelo sistema fora da janela de 24h.

type MetaConfig = {
  apiVersion: string;
  phoneNumberId: string;
  accessToken: string;
};

export class MetaCloudProvider implements WhatsappProvider {
  constructor(private config: MetaConfig) {}

  private get endpoint() {
    return `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;
  }

  async sendTemplate(msg: TemplateMessage): Promise<SendResult> {
    const body = {
      messaging_product: "whatsapp",
      to: msg.to,
      type: "template",
      template: {
        name: msg.templateName,
        language: { code: msg.locale },
        components: msg.bodyParams.length
          ? [
              {
                type: "body",
                parameters: msg.bodyParams.map((text) => ({
                  type: "text",
                  text,
                })),
              },
            ]
          : [],
      },
    };

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json().catch(() => ({}))) as {
      messages?: { id: string }[];
      error?: { message?: string };
    };

    if (!res.ok) {
      const reason = json.error?.message ?? `HTTP ${res.status}`;
      throw new Error(`Meta Cloud API: ${reason}`);
    }

    return { messageId: json.messages?.[0]?.id, raw: json };
  }
}
