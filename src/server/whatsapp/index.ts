import type { WhatsappProvider } from "./provider";
import { MetaCloudProvider } from "./meta-cloud";

// Factory: lê o env e devolve o provider ativo (singleton).
// Hoje só "meta"; amanhã basta acrescentar um case.

let cached: WhatsappProvider | undefined;

export function getWhatsappProvider(): WhatsappProvider {
  if (cached) return cached;

  const provider = process.env.WHATSAPP_PROVIDER ?? "meta";

  switch (provider) {
    case "meta": {
      const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
      const accessToken = process.env.META_ACCESS_TOKEN;
      const apiVersion = process.env.META_API_VERSION ?? "v20.0";
      if (!phoneNumberId || !accessToken) {
        throw new Error(
          "WhatsApp Meta: defina META_PHONE_NUMBER_ID e META_ACCESS_TOKEN",
        );
      }
      cached = new MetaCloudProvider({ apiVersion, phoneNumberId, accessToken });
      return cached;
    }
    default:
      throw new Error(`WHATSAPP_PROVIDER desconhecido: ${provider}`);
  }
}

export type { WhatsappProvider } from "./provider";
