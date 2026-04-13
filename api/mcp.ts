import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "../src/createServer.js";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.method === "POST") {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    // Vercel pre-parses JSON bodies; pass the parsed body directly so the
    // transport does not attempt to re-read the already-consumed stream.
    await transport.handleRequest(req, res, (req as any).body);
    res.on("finish", () => server.close());
    return;
  }

  if (req.method === "GET") {
    // SSE streaming endpoint (stateless: each connection creates its own server)
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    await transport.handleRequest(req, res);
    res.on("finish", () => server.close());
    return;
  }

  res.writeHead(405, { Allow: "GET, POST", "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Method Not Allowed" }));
}
