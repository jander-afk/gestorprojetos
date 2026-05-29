// Contrato do provider de WhatsApp. Toda a aplicação fala COM ESTA INTERFACE,
// nunca direto com a Meta. Trocar de provider = nova implementação, nada mais.

export type TemplateMessage = {
  /** Destino em E.164 sem '+', ex.: 5582999999999 */
  to: string;
  /** Nome do Message Template aprovado na Meta */
  templateName: string;
  /** Locale do template, ex.: pt_BR */
  locale: string;
  /** Parâmetros do corpo, na ordem dos {{1}}, {{2}}...
   *  Restrição da Meta: NÃO pode conter quebra de linha, tab nem 4+ espaços. */
  bodyParams: string[];
};

export type SendResult = {
  /** wamid retornado pela API (id da mensagem) */
  messageId?: string;
  raw?: unknown;
};

export interface WhatsappProvider {
  sendTemplate(msg: TemplateMessage): Promise<SendResult>;
}
