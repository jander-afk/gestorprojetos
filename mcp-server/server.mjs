import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

// Servidor MCP do Kanban SHU. Expõe 3 ferramentas que chamam a API externa
// do app (/api/ext/*) usando a chave de API. Transporte: Streamable HTTP
// (stateless). Acesso protegido por um segredo no caminho da URL.

const APP_URL = process.env.APP_URL || "http://web:3000";
const API_TOKEN = process.env.API_TOKEN || "";
const SECRET = process.env.MCP_SECRET || "";
const PORT = process.env.PORT || 8080;

async function api(path, opts = {}) {
  const res = await fetch(`${APP_URL}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-api-key": API_TOKEN, ...(opts.headers || {}) },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`API ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  return data;
}

function buildServer() {
  const server = new McpServer({ name: "kanban-shu", version: "1.0.0" });

  server.tool(
    "listar_atividades",
    "Lista as atividades do quadro Kanban. Opcionalmente filtra por status: 'Foco de Hoje', 'A fazer', 'Em andamento', 'Pendente', 'Aprovado', 'Em produção', 'Concluído'.",
    { status: z.string().optional().describe("Status para filtrar (rótulo em português)") },
    async ({ status }) => {
      const data = await api(`/api/ext/tasks${status ? `?status=${encodeURIComponent(status)}` : ""}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "criar_atividade",
    "Cria uma nova atividade no quadro Kanban.",
    {
      titulo: z.string().describe("Título da atividade"),
      status: z.string().optional().describe("Coluna inicial (padrão: A fazer)"),
      prioridade: z.string().optional().describe("Baixa, Média, Alta ou Urgente"),
      descricao: z.string().optional(),
      inicio: z.string().optional().describe("Data/hora de início em ISO 8601"),
      prazo: z.string().optional().describe("Data/hora de prazo em ISO 8601"),
      categoria: z.string().optional().describe("Categoria/etiqueta"),
      checklist: z.array(z.string()).optional().describe("Itens do checklist"),
    },
    async (args) => {
      const data = await api("/api/ext/tasks", { method: "POST", body: JSON.stringify(args) });
      return { content: [{ type: "text", text: `Atividade criada:\n${JSON.stringify(data, null, 2)}` }] };
    },
  );

  server.tool(
    "atualizar_atividade",
    "Atualiza uma atividade existente pelo id (status, prioridade, prazo, título, descrição, ou adiciona itens ao checklist).",
    {
      id: z.string().describe("ID da atividade"),
      status: z.string().optional(),
      prioridade: z.string().optional(),
      titulo: z.string().optional(),
      descricao: z.string().optional(),
      inicio: z.string().optional(),
      prazo: z.string().optional(),
      checklist: z.array(z.string()).optional().describe("Itens a adicionar ao checklist"),
    },
    async ({ id, ...patch }) => {
      const data = await api(`/api/ext/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      return { content: [{ type: "text", text: `Atividade atualizada:\n${JSON.stringify(data, null, 2)}` }] };
    },
  );

  return server;
}

const app = express();
app.use(express.json());

async function handleMcp(req, res) {
  if (SECRET && req.params.secret !== SECRET) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => { transport.close(); server.close(); });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}

app.post("/mcp/:secret", (req, res) => {
  handleMcp(req, res).catch((e) => {
    console.error(e);
    if (!res.headersSent) res.status(500).json({ error: String(e) });
  });
});
app.get("/mcp/:secret", (_req, res) => res.status(405).json({ error: "use POST" }));
app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Kanban MCP server on :${PORT}`));
