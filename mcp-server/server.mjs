import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Servidor MCP do Kanban SHU (Streamable HTTP COM sessão). Expõe 3 ferramentas
// que chamam a API externa do app (/api/ext/*) com a chave de API. Acesso
// protegido por um segredo no caminho da URL.

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
    "Lista as atividades do quadro Kanban. Filtra por status opcional: 'Foco de Hoje', 'A fazer', 'Em andamento', 'Pendente', 'Aprovado', 'Em produção', 'Concluído'.",
    { status: z.string().optional().describe("Status (rótulo em português)") },
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
      inicio: z.string().optional().describe("Início em ISO 8601"),
      prazo: z.string().optional().describe("Prazo em ISO 8601"),
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
      checklist: z.array(z.string()).optional().describe("Itens a adicionar"),
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

const transports = {};

function checkSecret(req, res) {
  if (SECRET && req.params.secret !== SECRET) {
    res.status(403).json({ error: "forbidden" });
    return false;
  }
  return true;
}

app.post("/mcp/:secret", async (req, res) => {
  try {
    if (!checkSecret(req, res)) return;
    const sid = req.headers["mcp-session-id"];
    let transport;
    if (sid && transports[sid]) {
      transport = transports[sid];
    } else if (!sid && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => { transports[id] = transport; },
      });
      transport.onclose = () => { if (transport.sessionId) delete transports[transport.sessionId]; };
      await buildServer().connect(transport);
    } else {
      res.status(400).json({ jsonrpc: "2.0", error: { code: -32000, message: "Sessão inválida" }, id: null });
      return;
    }
    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(500).json({ error: String(e) });
  }
});

async function sessionRequest(req, res) {
  if (!checkSecret(req, res)) return;
  const sid = req.headers["mcp-session-id"];
  if (!sid || !transports[sid]) { res.status(400).send("Sessão inválida"); return; }
  await transports[sid].handleRequest(req, res);
}
app.get("/mcp/:secret", sessionRequest);
app.delete("/mcp/:secret", sessionRequest);
app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Kanban MCP server (sessão) on :${PORT}`));
