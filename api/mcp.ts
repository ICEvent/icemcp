import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "../src/createServer.js";

// Extend IncomingMessage to reflect the JSON body Vercel injects before the
// handler is called (the raw stream is already consumed at that point).
type VercelIncomingMessage = IncomingMessage & { body?: unknown };

/**
 * Create a fresh MCP server + stateless transport pair, connect them, and
 * return both so the caller can dispatch the request and clean up afterwards.
 *
 * Stateless mode (sessionIdGenerator: undefined) means no session is kept
 * across requests — each invocation is fully self-contained.  This is the
 * correct model for Vercel serverless functions where instances are ephemeral.
 */
async function createStatelessHandler() {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  return { server, transport };
}

export default async function handler(
  req: VercelIncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.method === "POST") {
    const { server, transport } = await createStatelessHandler();
    // Vercel pre-parses JSON bodies; pass the parsed body directly so the
    // transport does not attempt to re-read the already-consumed stream.
    await transport.handleRequest(req, res, req.body);
    res.on("finish", () => server.close());
    return;
  }

  if (req.method === "GET") {
    // SSE streaming endpoint — each long-lived connection gets its own server.
    const { server, transport } = await createStatelessHandler();
    await transport.handleRequest(req, res);
    res.on("finish", () => server.close());
    return;
  }

  res.writeHead(405, { Allow: "GET, POST", "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Method Not Allowed" }));
}
