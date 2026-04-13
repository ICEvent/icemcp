# icemcp

MCP (Model Context Protocol) server for the ICEvent ecosystem — exposes
[OneBlock](https://github.com/ICEvent/OneBlock) and
[Defunds](https://github.com/ICEvent/Defunds) canister services on the
[Internet Computer](https://internetcomputer.org) to any MCP-compatible AI client.

---

## Features

### OneBlock tools
| Tool | Description |
|------|-------------|
| `oneblock_get_profile` | Fetch a life-path profile by ID |
| `oneblock_get_profile_by_principal` | Look up a profile by IC principal |
| `oneblock_search_profiles` | Search profiles by display name |
| `oneblock_list_profiles` | Paginated list of all profiles |
| `oneblock_get_profile_count` | Total number of registered profiles |
| `oneblock_get_default_profiles` | Featured / showcase profiles |

### Defunds tools
| Tool | Description |
|------|-------------|
| `defunds_get_all_grants` | All grant proposals |
| `defunds_get_grant` | Single grant by ID |
| `defunds_get_grant_voting_status` | Voting status for a grant |
| `defunds_get_grant_comments` | Community comments on a grant |
| `defunds_get_total_donations` | Total accumulated donations |
| `defunds_get_total_voting_power` | Total accumulated voting power |
| `defunds_get_public_groups` | Public community group funds |
| `defunds_get_group` | Single group by ID |
| `defunds_get_group_proposals` | Proposals for a specific group |
| `defunds_get_all_proposals` | All proposals across all groups |
| `defunds_get_public_ai_agent_funds` | Public AI-agent managed funds |
| `defunds_get_voting_policy` | Global voting policy parameters |
| `defunds_get_exchange_rates` | Current donation exchange rates |

---

## Requirements

- Node.js ≥ 18
- npm ≥ 9

## Installation

```bash
npm install
npm run build
```

## Usage

### Stdio transport (recommended for AI clients)

Run the MCP server directly; it communicates over stdin / stdout:

```bash
node dist/index.js
```

### Claude Desktop integration

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "icemcp": {
      "command": "node",
      "args": ["/path/to/icemcp/dist/index.js"]
    }
  }
}
```

### npx (after publishing to npm)

```json
{
  "mcpServers": {
    "icemcp": {
      "command": "npx",
      "args": ["-y", "icemcp"]
    }
  }
}
```

---

## Deploying on Vercel

The repository includes a Vercel-ready HTTP handler (`api/mcp.ts`) that uses the
[MCP Streamable HTTP transport](https://modelcontextprotocol.io/specification/basic/transports)
in stateless mode — perfect for serverless functions.

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ICEvent/icemcp)

### Manual deploy

```bash
npm install -g vercel
vercel
```

The MCP endpoint will be available at:

```
https://<your-deployment>.vercel.app/mcp
```

### Connecting an AI client to the Vercel deployment

Use the `url` transport in your MCP client configuration:

```json
{
  "mcpServers": {
    "icemcp": {
      "url": "https://<your-deployment>.vercel.app/mcp"
    }
  }
}
```

---

## Architecture

The server uses:
- [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk) — MCP server framework
- [`@dfinity/agent`](https://github.com/dfinity/agent-js) — Internet Computer HTTP agent
- [`@dfinity/candid`](https://github.com/dfinity/agent-js) — Candid IDL encoding / decoding

All canister calls are **anonymous query calls** — no wallet or identity is required. Only publicly readable canister methods are exposed.

### Canister IDs (IC mainnet)
| Service | Canister ID |
|---------|------------|
| OneBlock profile | `nzxho-uqaaa-aaaak-adwxq-cai` |
| Defunds backend | `ixuio-siaaa-aaaam-qacxq-cai` |
