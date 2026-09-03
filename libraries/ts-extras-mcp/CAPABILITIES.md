# `@fgv/ts-extras-mcp` — MCP → ai-assist client-tools bridge (Node)

> **This file is authoritative for what ``@fgv/ts-extras-mcp`` provides and what not to hand-roll.**
> `README.md`, where present, is getting-started material. The always-loaded index at
> [`.ai/instructions/LIBRARY_CAPABILITIES.md`](../../.ai/instructions/LIBRARY_CAPABILITIES.md)
> routes here; it never duplicates this content.


---

[libraries/ts-extras-mcp](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras-mcp)

A Result-integration boundary over [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk) (`^1.29.0`, a direct dependency) that connects to an MCP (Model Context Protocol) server, discovers its tools, and **adapts each into an `AiAssist.IAiClientTool`** (from `@fgv/ts-extras`) so it drops directly into `AiAssist.executeClientToolTurn` — making any MCP server's tools callable across all four cloud providers with no per-provider work. All SDK imports are isolated to one file so the announced SDK v2 rename is a one-file change.

| Function | Return |
|---|---|
| `createStdioTransport({ command, args?, env?, cwd? })` | `Result<IMcpTransport>` |
| `createHttpTransport({ url, headers? })` | `Result<IMcpTransport>` |
| `connectMcpSession({ transport, clientName?, clientVersion?, logger? })` | `Promise<Result<IMcpSession>>` |
| `closeMcpSession(session)` | `Promise<Result<true>>` |
| `listMcpTools(session)` | `Promise<Result<ReadonlyArray<IMcpToolDescriptor>>>` (follows the SDK's `nextCursor` for the full catalog) |
| `callMcpTool(session, name, args)` | `Promise<Result<IMcpToolCallResult>>` (text-block projection; `isError: true` → `Result.fail`, never swallowed) |
| `adaptMcpTools(session, { logger? })` | `Promise<Result<{ tools: ReadonlyArray<AiAssist.IAiClientTool>; skipped: ReadonlyArray<IMcpSkippedTool> }>>` |

**Graceful degradation (load-bearing):** `adaptMcpTools` never fails the whole catalog over one bad schema. A tool whose `inputSchema` is outside the `JsonSchema.fromJson` subset (`$ref`/`oneOf`/`pattern`/a *general* union `type` — the nullable spelling `[<type>, 'null']` is in the subset and adapts fine/…) is **excluded** from `tools` (the model is never offered a tool whose args we can't validate), **surfaced structurally** on `skipped` (name + JSON-pointer reason + raw failing schema), and — when a `logger` is supplied — **NOISY-warned** with all three. The `samples/testbed` `mcp-probe` scenario points it at any MCP server and prints a compatibility report (configure via `MCP_PROBE_URL` or `MCP_PROBE_COMMAND`).

**Explicitly NOT in scope:** browser sibling (`@fgv/ts-web-extras-mcp`), MCP resources / prompts / sampling, OAuth/managed auth (static headers only), multimodal tool-result passthrough, cross-server tool-name namespacing. The headline follow-on lever — additively widening `JsonSchema.fromJson`'s subset (`$ref`/`$defs`, `pattern`) in `@fgv/ts-json-base` — is a separate stream commissioned from what the probe surfaces. **Security:** `createStdioTransport` spawns a consumer-supplied command as a subprocess — a trust boundary; never source the command from untrusted input.

---

---

## Decision shortcuts

- **Making an MCP server's tools callable from an ai-assist tool-use conversation?** → `@fgv/ts-extras-mcp` (Node). `connectMcpSession` → `adaptMcpTools(session, { logger })` → hand `result.tools` (`AiAssist.IAiClientTool[]`) to `AiAssist.executeClientToolTurn({ ..., clientTools: result.tools })`. `adaptMcpTools` gracefully degrades: tools whose `inputSchema` is outside the `JsonSchema.fromJson` subset land in `result.skipped` (name + JSON-pointer reason + raw schema) and NOISY-warn rather than failing the catalog. Transports: `createStdioTransport({ command, args })` (spawns a subprocess — trust boundary) or `createHttpTransport({ url, headers })`. Use the `samples/testbed` `mcp-probe` scenario (`MCP_PROBE_URL` / `MCP_PROBE_COMMAND`) to get a compatibility report for any server. **Don't hand-roll an MCP client or a JSON-Schema→client-tool adapter.**

---

## Recent additions

*Newest first. **Generated** — see the repo index; do not hand-edit inside the markers.*

<!-- BEGIN GENERATED: recent-additions -->

- **2026-08-22** — **Shipped:** `nullable: true` on every factory — the spelling OpenAI strict mode accepts for an absent-able field, where `optional(...)` is unsendable. ([#655](https://github.com/ErikFortune/fgv/pull/655))
- **2026-06-06** — Shipped `@fgv/ts-extras-mcp` (Node) — the MCP → ai-assist client-tools bridge: connect to an MCP server, discover its tools, and `adaptMcpTools` each into an `AiAssist.IAiClientTool` that drops into `executeClientToolTurn`. ([#469](https://github.com/ErikFortune/fgv/pull/469))

<!-- END GENERATED: recent-additions -->
