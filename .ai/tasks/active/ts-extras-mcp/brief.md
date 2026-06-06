# Stream brief: `ts-extras-mcp` — MCP → ai-assist client-tools bridge

**Status:** commissioned 2026-06-06 (Erik). Integration branch: `ts-extras-mcp` (off `release`).
**Shape:** single multi-phase stream (size M). Implementation slice 1 below.
**Scoping source:** the 2026-06-06 MCP scoping pass (decision: GO). Builds on the partially-shipped FUTURE item "Client-defined tools for `@fgv/ts-extras/ai-assist` (function calling + MCP)" — layer 1 shipped via PR #447; this is layer 2.

---

## Goal

Ship `@fgv/ts-extras-mcp` (Node) — a Result-integration boundary that connects to MCP (Model Context Protocol) servers, discovers their tools, and **adapts each into an `IAiClientTool`** so it drops directly into the already-shipped `AiAssist.executeClientToolTurn` loop. Net effect: any MCP server's tools become callable across all four cloud providers with no per-provider work.

Develop on sub-branches off the `ts-extras-mcp` integration branch; PR into `ts-extras-mcp`. The cluster promotes to `release` when slice 1 is complete. **Never target `main`** — the client-tools surface is release-only active development and does not exist on main.

## Read first (ground yourself)

1. `.ai/tasks/completed/2026-06/ai-assist-client-tools/design.md` — esp. **§3.3**, which already sketches this exact package (name `@fgv/ts-extras-mcp`, ~6 primitives, the `mcpToolsToAiClientTools` adapter). Treat §3.3 as the baseline design and sharpen it.
2. `libraries/ts-extras/src/packlets/ai-assist/model.ts` — `IAiClientTool<TParams>`, `IAiClientToolConfig<TParams>` (the adapter's target type; `parametersSchema: ISchemaValidator<TParams>`, `execute: (args: unknown) => Promise<Result<unknown>>`). Also `…/ai-assist/index.ts` for exports and `…/streamingAdapters/clientToolContinuationBuilder.ts` for how `executeClientToolTurn` consumes client tools (it validates args via `parametersSchema.validate`, dispatches `execute`, `JSON.stringify`s the result, and fails fast on duplicate tool names).
3. `libraries/ts-json-base/src/packlets/json-schema-builder/fromJson.ts` — `JsonSchema.fromJson(rawJsonObject): Result<ISchemaValidator<JsonValue>>`. This is the MCP-schema bridge (its docstring names "an MCP tool boundary" as the use case). It REJECTS out-of-subset keywords (`$ref`, `oneOf`/`anyOf`/`allOf`, `not`, `if`/`then`/`else`, `pattern`, union `type` arrays) with a JSON-pointer path. Read its tests too.
4. The two existing integration-boundary package PAIRS as scaffolding templates: `libraries/ts-extras-webauthn/` and `libraries/ts-extras-transformers/` — copy their package.json shape, tsconfig, jest config, Heft rig, `sideEffects: false`, `etc/` api-extractor setup, README structure, and `rush.json` registration pattern. Your package follows the SAME shape.
5. `.ai/instructions/LIBRARY_CAPABILITIES.md` — the "Result-integration boundary — package shape convention" section (thin conversion + explicit NOT-in-scope list + no added opinion). MUST follow it.
6. `samples/testbed/` — its scenario registration (manual) and CLI dispatch (`--scenario`) + web mount, since the probe lives here.

## Upstream SDK

Wrap `@modelcontextprotocol/sdk` (official TypeScript SDK; pin `^1.29.0` — current stable; isolate the import so the announced v2 client-package rename is a one-file change). Add via `rush add -p @modelcontextprotocol/sdk@^1.29.0` from inside the new package dir (NEVER hand-edit package.json deps; NEVER use npm). Use the SDK's `Client`, `StdioClientTransport`, `StreamableHTTPClientTransport`. The SDK throws/rejects on failure — your job is the `captureAsyncResult` → `Result<T>` conversion. Use the SDK's in-memory transport test utilities (or mock the SDK) for tests — do NOT require a live MCP server in unit tests.

## Two LOAD-BEARING design constraints (Erik)

**Constraint 1 — graceful failure, but warn NOISILY with the failing schema.** When a discovered tool's `inputSchema` fails `JsonSchema.fromJson`, do NOT fail the whole catalog and do NOT silently drop the tool. Instead: (a) exclude that one tool from the adapted set (the model must never be offered a tool whose args we can't validate), AND (b) emit a NOISY warning via an injected `@fgv/ts-utils` `Logging.ILogger` that includes the tool name, the JSON-pointer reason from `fromJson`, AND the raw failing schema (so we can see exactly what subset feature to extend later). ALSO surface the failures structurally on the return value (e.g. the adapter returns `{ tools, skipped: [{ name, reason, schema }] }`) so callers/the probe can enumerate them. The whole point: pointing this at a new MCP server immediately shows every schema we can't yet handle, with the schema in hand to extend `JsonSchema.fromJson` additively.

**Constraint 2 — a probe.** Build a probe that hits an MCP server and reports ALL adaptation errors, so we can proactively assess/extend support for a server WITHOUT wiring it into an application. Implement as a **`samples/testbed` scenario runnable from the testbed CLI** (preferred — testbed has CLI dispatch), taking an MCP server spec via args (a stdio `command`+`args`, or an HTTP `url`). It connects, lists tools, runs the full catalog through the adapter, and prints a report: which tools adapted cleanly, and for each tool that did NOT, the tool name + failing schema + JSON-pointer reason. Diagnostic, not showcase — optimize for "run it against any MCP server, get a compatibility report."

## Slice 1 scope (build now)

- Package `@fgv/ts-extras-mcp` (`libraries/ts-extras-mcp/`), registered in `rush.json`, `sideEffects: false`. Deps: `@fgv/ts-utils` (peer `workspace:*` per convention), `@fgv/ts-extras` (for `IAiClientTool`), `@fgv/ts-json-base` (for `JsonSchema.fromJson`), `@modelcontextprotocol/sdk` (direct dep, webauthn-style).
- **Transport factories:** `createStdioTransport({ command, args?, env?, cwd? }): Result<…>` and `createHttpTransport({ url, headers? }): Result<…>`. (Both in the Node package; browser sibling DEFERRED — see below.)
- **Session lifecycle:** `connectMcpSession({ transport, clientName?, clientVersion?, logger? }): Promise<Result<IMcpSession>>` (wraps `new Client(...).connect()` / initialize handshake); `closeMcpSession(session): Promise<Result<true>>` (NOT `Result<void>` — repo anti-pattern).
- **Operations:** `listMcpTools(session): Promise<Result<…>>` (MUST loop on the SDK's `nextCursor` for the full catalog); `callMcpTool(session, name, args): Promise<Result<IMcpToolCallResult>>`. Project `CallToolResult` → text concat of text blocks; `isError: true` → `Result.fail(text)` (so layer 1 routes it as a provider-native error tool-result — do NOT swallow `isError`); non-text blocks → a structured summary string (multimodal passthrough out of scope).
- **Headline adapter:** `adaptMcpTools(session, { logger? }): Promise<Result<{ tools: ReadonlyArray<IAiClientTool>; skipped: ReadonlyArray<{ name: string; reason: string; schema: JsonObject }> }>>` (or equivalent satisfying Constraint 1). Each adapted tool's `parametersSchema = JsonSchema.fromJson(inputSchema)` and `execute: (args) => callMcpTool(session, name, args)` mapping `isError`→fail. Use `mapResults` / per-item helpers per repo Result conventions.
- The **probe testbed scenario** (Constraint 2).
- 100% test coverage (mock SDK / in-memory transport; fixture a server advertising a MIX of adaptable and un-adaptable tools to exercise the graceful-degrade + noisy-warn path).
- `LIBRARY_CAPABILITIES.md` entry + decision-shortcut line; package README with the explicit NOT-in-scope list and a stdio-transport security note (spawns a subprocess with consumer-supplied command — document the trust boundary).

## Explicitly DEFER (note as follow-ups, do not build in slice 1)

Browser sibling `@fgv/ts-web-extras-mcp`; MCP resources / prompts / sampling features; OAuth/managed auth (static headers only); multimodal tool-result passthrough; cross-server tool-name namespacing (duplicate names already fail loudly in `executeClientToolTurn`). Record these in the README / `docs/FUTURE.md`.

## Known follow-on lever (out of scope, name it)

The single biggest real risk is **schema-subset mismatch** — real MCP servers advertise `$ref`/`oneOf`/`pattern` etc. that `JsonSchema.fromJson` rejects. Slice 1 handles this via graceful degradation + the noisy warns (Constraint 1). The escalation lever is to **additively widen `JsonSchema.fromJson`'s supported subset** in `ts-json-base` (`$ref`/`$defs` resolution and `pattern` passthrough are the highest-value additions) — that is a separate small `ts-json-base` stream, commissioned based on what the probe surfaces against real servers. Do NOT widen `fromJson` in this stream.

## Process & gates

- Start with a SHORT design note (`.ai/tasks/active/ts-extras-mcp/design.md`) pinning key decisions (the `adaptMcpTools` return shape, the `CallToolResult` projection, the warn format, SDK version), then implement. Commit the design note with the code.
- Result pattern throughout; no `any`; factory pattern for fallible construction; error context via `withErrorFormat`.
- `rushx build` + `rushx lint` + `rushx test` (100% coverage) pass in the new package AND any package touched. Run `rushx fixlint` before final commit.
- Run the `code-reviewer` agent on the final diff BEFORE chasing the last coverage gaps; resolve/disposition findings; summarize in the PR description.
- **Worktree gotcha:** if running in an isolated git worktree nested under the repo, Rush's build-cache git-hashing may choke (`git hash .claude/worktrees/...`). If `rushx build`/`test` fails for that reason, temporarily set `"buildCacheEnabled": false` in `common/config/rush/build-cache.json` for the run and restore it before committing (do NOT commit that change).
- PR into the `ts-extras-mcp` integration branch. PR description: what shipped, the two constraints' implementation, validation results, code-reviewer summary, deferred-follow-ups list.
- If a genuine design fork not resolved by §3.3 + this brief appears, make the most defensible choice, document it prominently in the design note + PR description for orchestrator ratification, and proceed (do not block).

## Deliverables / report-back

A working, tested, reviewed slice-1 PR into `ts-extras-mcp`. Report: branch, PR number, what shipped, what was deferred, any decisions needing ratification, and the probe's usage (how to run it against a server).
