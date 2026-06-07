# Result — ts-extras-mcp

Shipped `@fgv/ts-extras-mcp` (Node) — the MCP → ai-assist client-tools bridge: connect to an MCP server, discover its tools, and `adaptMcpTools` each into an `AiAssist.IAiClientTool` that drops into `executeClientToolTurn`.

- **Slice 1** — package surface (stdio/http transports, session lifecycle, `listMcpTools` with `nextCursor` paging, `callMcpTool` with `isError`→`Result.fail`, and `adaptMcpTools` with graceful **+ NOISY schema-skip** degradation: un-adaptable `inputSchema` excluded, surfaced on `skipped[]` with name + JSON-pointer reason + raw schema, warned) + the `samples/testbed` `mcp-probe` scenario — **PR #469**.
- **End-to-end verification** — a real in-memory MCP server (real SDK `Server`/`Client`, initialize handshake, live `listTools`/`callTool`) covering all five `JsonSchema.fromJson`-rejected classes, asserting the warn contains the raw schema — **PR #471**. No production bug; closed the SDK-mocked fidelity gap.
- **Promoted to `release`** — **PR #479**.

Slice-2 follow-ups (browser sibling `@fgv/ts-web-extras-mcp`; resources/prompts/sampling; OAuth; multimodal passthrough; cross-server namespacing; and the headline **`JsonSchema.fromJson` subset-widening** lever) are deferred in `docs/FUTURE.md`. See `brief.md` + `design.md`.
