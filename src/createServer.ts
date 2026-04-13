import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Principal } from "@dfinity/principal";

import { createOneBlockActor } from "./canisters/oneblock.js";
import { createDefundsActor } from "./canisters/defunds.js";

// Helper: serialize IC values (BigInt, Principal, Uint8Array, Optional) to plain JS
export function serialize(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value instanceof Principal) {
    return value.toText();
  }
  if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
    return Array.from(value as Uint8Array);
  }
  if (Array.isArray(value)) {
    return value.map(serialize);
  }
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = serialize(v);
    }
    return result;
  }
  return value;
}

export function toText(value: unknown): string {
  return JSON.stringify(serialize(value), null, 2);
}

export function createMcpServer(): Server {
  const server = new Server(
    {
      name: "icemcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ─── Tool definitions ──────────────────────────────────────────────────────

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      // ── OneBlock ────────────────────────────────────────────────────────
      {
        name: "oneblock_get_profile",
        description:
          "Get a OneBlock life-path profile by its unique ID string.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The profile ID (e.g. alice)" },
          },
          required: ["id"],
        },
      },
      {
        name: "oneblock_get_profile_by_principal",
        description:
          "Look up a OneBlock profile by the owner's Internet Computer principal.",
        inputSchema: {
          type: "object",
          properties: {
            principal: {
              type: "string",
              description: "The IC principal text (e.g. xxxxx-xxxxx-…-cai)",
            },
          },
          required: ["principal"],
        },
      },
      {
        name: "oneblock_search_profiles",
        description: "Search OneBlock profiles by display name.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Name search string" },
          },
          required: ["query"],
        },
      },
      {
        name: "oneblock_list_profiles",
        description: "List OneBlock profiles with pagination.",
        inputSchema: {
          type: "object",
          properties: {
            page_size: {
              type: "number",
              description: "Number of profiles per page (default 10)",
            },
            page_number: {
              type: "number",
              description: "Page number starting at 1 (default 1)",
            },
          },
        },
      },
      {
        name: "oneblock_get_profile_count",
        description: "Return the total number of registered OneBlock profiles.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "oneblock_get_default_profiles",
        description: "Return featured / default showcase profiles.",
        inputSchema: {
          type: "object",
          properties: {
            size: {
              type: "number",
              description: "How many profiles to return (default 10)",
            },
          },
        },
      },
      // ── Defunds ─────────────────────────────────────────────────────────
      {
        name: "defunds_get_all_grants",
        description:
          "Return all grant proposals from the Defunds charity platform.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "defunds_get_grant",
        description: "Return a single Defunds grant by numeric ID.",
        inputSchema: {
          type: "object",
          properties: {
            grant_id: {
              type: "number",
              description: "Numeric grant identifier",
            },
          },
          required: ["grant_id"],
        },
      },
      {
        name: "defunds_get_grant_voting_status",
        description:
          "Return the current voting status for a specific Defunds grant.",
        inputSchema: {
          type: "object",
          properties: {
            grant_id: { type: "number", description: "Grant ID" },
          },
          required: ["grant_id"],
        },
      },
      {
        name: "defunds_get_grant_comments",
        description: "Return community comments for a Defunds grant.",
        inputSchema: {
          type: "object",
          properties: {
            grant_id: { type: "number", description: "Grant ID" },
          },
          required: ["grant_id"],
        },
      },
      {
        name: "defunds_get_total_donations",
        description:
          "Return the total accumulated donations (in e8s) on Defunds.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "defunds_get_total_voting_power",
        description: "Return the total accumulated voting power on Defunds.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "defunds_get_public_groups",
        description:
          "Return all public community group funds on the Defunds platform.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "defunds_get_group",
        description: "Return a single Defunds community group by numeric ID.",
        inputSchema: {
          type: "object",
          properties: {
            group_id: { type: "number", description: "Group ID" },
          },
          required: ["group_id"],
        },
      },
      {
        name: "defunds_get_group_proposals",
        description: "Return all proposals for a specific Defunds group.",
        inputSchema: {
          type: "object",
          properties: {
            group_id: { type: "number", description: "Group ID" },
          },
          required: ["group_id"],
        },
      },
      {
        name: "defunds_get_all_proposals",
        description: "Return all group proposals across all Defunds groups.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "defunds_get_public_ai_agent_funds",
        description:
          "Return public AI-agent managed funds on the Defunds platform.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "defunds_get_voting_policy",
        description:
          "Return the global Defunds voting policy (minVotePercentage, minPowerPercentage, maxAmountPercentage).",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "defunds_get_exchange_rates",
        description:
          "Return current exchange rates used by the Defunds donation system.",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  }));

  // ─── Tool call handler ─────────────────────────────────────────────────────

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const a = (args ?? {}) as Record<string, unknown>;

    try {
      switch (name) {
        // ── OneBlock ──────────────────────────────────────────────────────
        case "oneblock_get_profile": {
          const actor = createOneBlockActor();
          const result = await (actor as any).getProfile(String(a.id));
          return { content: [{ type: "text", text: toText(result) }] };
        }

        case "oneblock_get_profile_by_principal": {
          const actor = createOneBlockActor();
          const result = await (actor as any).getProfileByPrincipal(
            String(a.principal)
          );
          return { content: [{ type: "text", text: toText(result) }] };
        }

        case "oneblock_search_profiles": {
          const actor = createOneBlockActor();
          const result = await (actor as any).searchProfilesByName(
            String(a.query)
          );
          return { content: [{ type: "text", text: toText(result) }] };
        }

        case "oneblock_list_profiles": {
          const actor = createOneBlockActor();
          const pageSize = BigInt(
            typeof a.page_size === "number" ? a.page_size : 10
          );
          const pageNum = BigInt(
            typeof a.page_number === "number" ? a.page_number : 1
          );
          const result = await (actor as any).getProfiles(pageSize, pageNum);
          return { content: [{ type: "text", text: toText(result) }] };
        }

        case "oneblock_get_profile_count": {
          const actor = createOneBlockActor();
          const result = await (actor as any).getProfileCount();
          return { content: [{ type: "text", text: toText(result) }] };
        }

        case "oneblock_get_default_profiles": {
          const actor = createOneBlockActor();
          const size = BigInt(typeof a.size === "number" ? a.size : 10);
          const result = await (actor as any).getDefaultProfiles(size);
          return { content: [{ type: "text", text: toText(result) }] };
        }

        // ── Defunds ───────────────────────────────────────────────────────
        case "defunds_get_all_grants": {
          const actor = createDefundsActor();
          const result = await (actor as any).getAllGrants();
          return { content: [{ type: "text", text: toText(result) }] };
        }

        case "defunds_get_grant": {
          const actor = createDefundsActor();
          const result = await (actor as any).getGrant(
            BigInt(Number(a.grant_id))
          );
          return { content: [{ type: "text", text: toText(result) }] };
        }

        case "defunds_get_grant_voting_status": {
          const actor = createDefundsActor();
          const result = await (actor as any).getGrantVotingStatus(
            BigInt(Number(a.grant_id))
          );
          return { content: [{ type: "text", text: toText(result) }] };
        }

        case "defunds_get_grant_comments": {
          const actor = createDefundsActor();
          const result = await (actor as any).getGrantComments(
            BigInt(Number(a.grant_id))
          );
          return { content: [{ type: "text", text: toText(result) }] };
        }

        case "defunds_get_total_donations": {
          const actor = createDefundsActor();
          const result = await (actor as any).getTotalDonations();
          return { content: [{ type: "text", text: toText(result) }] };
        }

        case "defunds_get_total_voting_power": {
          const actor = createDefundsActor();
          const result = await (actor as any).getTotalVotingPower();
          return { content: [{ type: "text", text: toText(result) }] };
        }

        case "defunds_get_public_groups": {
          const actor = createDefundsActor();
          const result = await (actor as any).getPublicGroups();
          return { content: [{ type: "text", text: toText(result) }] };
        }

        case "defunds_get_group": {
          const actor = createDefundsActor();
          const result = await (actor as any).getGroup(
            BigInt(Number(a.group_id))
          );
          return { content: [{ type: "text", text: toText(result) }] };
        }

        case "defunds_get_group_proposals": {
          const actor = createDefundsActor();
          const result = await (actor as any).getGroupProposals(
            BigInt(Number(a.group_id))
          );
          return { content: [{ type: "text", text: toText(result) }] };
        }

        case "defunds_get_all_proposals": {
          const actor = createDefundsActor();
          const result = await (actor as any).getAllProposals();
          return { content: [{ type: "text", text: toText(result) }] };
        }

        case "defunds_get_public_ai_agent_funds": {
          const actor = createDefundsActor();
          const result = await (actor as any).getPublicAIAgentFunds();
          return { content: [{ type: "text", text: toText(result) }] };
        }

        case "defunds_get_voting_policy": {
          const actor = createDefundsActor();
          const [minVote, minPower, maxAmount] = await (
            actor as any
          ).getVotingPolicy();
          return {
            content: [
              {
                type: "text",
                text: toText({
                  minVotePercentage: minVote,
                  minPowerPercentage: minPower,
                  maxAmountPercentage: maxAmount,
                }),
              },
            ],
          };
        }

        case "defunds_get_exchange_rates": {
          const actor = createDefundsActor();
          const result = await (actor as any).getExchangeRates();
          return { content: [{ type: "text", text: toText(result) }] };
        }

        default:
          return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  return server;
}
