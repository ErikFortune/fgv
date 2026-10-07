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
| `createCustomTransport(sdkTransport)` | `Result<IMcpTransport>` — wraps any pre-built SDK client transport (e.g. `InMemoryTransport` for tests against an in-process server), typed structurally as `IMcpSdkTransport`. It must be fresh (refused if it already has a `sessionId`, which would make the SDK skip `initialize`), and its `close()` must call `onclose`. The interface declares the `onclose` / `onerror` / `onmessage` slots the SDK assigns, so a consumer's own transport class can be written against it. Every transport handle is single-use. |
| `connectMcpSession({ transport, clientName?, clientVersion?, logger?, onClose?, timeoutMs?, signal? })` | `Promise<DetailedResult<IMcpSession, McpFailureReason>>` |
| `closeMcpSession(session)` | `Promise<Result<true>>` |
| `listMcpTools(session, options?)` | `Promise<DetailedResult<ReadonlyArray<IMcpToolDescriptor>, McpFailureReason>>` (follows the SDK's `nextCursor` for the full catalog) |
| `callMcpTool(session, name, args, options?)` | `Promise<DetailedResult<IMcpToolCallResult, McpFailureReason>>` (text-block projection; `isError: true` → failure with the tool's text verbatim, never swallowed) |
| `adaptMcpTools(session, { logger? })` | `Promise<DetailedResult<{ tools: ReadonlyArray<AiAssist.IAiClientTool>; skipped: ReadonlyArray<IMcpSkippedTool> }, McpFailureReason>>` |

**Per-request options (`IMcpRequestOptions`):** `timeoutMs` (SDK default 60 000), `signal`, `onProgress`, `resetTimeoutOnProgress`, `maxTotalTimeoutMs`, mapped onto the SDK's `RequestOptions`. On `connectMcpSession`, `timeoutMs` and `signal` bound the **whole** connect — transport start, `initialize`, and sending `notifications/initialized`, which the SDK's own request options do not cover — and a lost or failed connect starts closing the transport without waiting for it, so teardown can finish after the connect has returned. `timeoutMs` applies per request — per page in `listMcpTools`. An abort or a `timeoutMs` expiry sends the server `notifications/cancelled`, so the request does not run on as an orphan; a `maxTotalTimeoutMs` expiry does not (the SDK fails it locally without a cancellation). Adapted tools forward the turn's `signal` (`IAiClientTool.execute`'s context) to `callMcpTool`, so cancelling an `executeClientToolTurn` turn cancels the MCP request.

**Failure kinds (`McpFailureReason`, the `DetailedResult` detail):** the classification is total and keys on the SDK's error class, JSON-RPC code, HTTP status, the session's observed close and the identity of the call's own abort reason — never message text. Branch on `kind`; do not parse messages.

| kind | SDK signal |
|---|---|
| `tool-error` | `CallToolResult.isError: true` — message is the tool's text, unprefixed |
| `timeout` | `McpError` code `-32001` (`RequestTimeout`), including `maxTotalTimeoutMs` |
| `aborted` | the caller's signal fired first — decided by the identity of the abort reason this package issued, because the SDK reports an abort with the *timeout* code |
| `not-connected` | the session's close was observed: the SDK's `ConnectionClosed` (`-32000`) or untyped "Not connected", both raised only after `onclose` fires (a server's own `-32000` on an open session is `protocol`). During the handshake any `-32000` is `not-connected` |
| `session-expired` | `StreamableHTTPError` 404 on an established session (during the handshake a 404 is `transport`) |
| `unauthorized` | HTTP 401 / 403, or the SDK's `UnauthorizedError`; carries `status` when there was one |
| `protocol` | any other `McpError` — a JSON-RPC error from the server, carrying `code` — or a response that failed the SDK's result schema (zod's error, no `code`) |
| `transport` | the catch-all: any other HTTP status (carries `status`), network or child-process I/O failures, untyped SDK errors (including the handshake's protocol-version refusal) |
| `invalid-handle` | a session/transport handle not produced by this package, or a transport handle already used by an earlier connect |
| `invalid-options` | a `timeoutMs` / `maxTotalTimeoutMs` that is not a positive finite number ≤ 2³¹−1 (`setTimeout` would otherwise fire it after 1 ms); reported before anything is sent |

**Close observation:** `connectMcpSession({ onClose })` fires once when the connection closes, for any reason (including `closeMcpSession`); never for a failed connect; a throwing callback, or an `async` one that rejects, is contained and logged. Reconnect policy stays with the consumer — the package has no pool or reconnector. A Streamable-HTTP server restart is not a close; the next call reports it as `session-expired` when the server answers 404.

**Graceful degradation (load-bearing):** `adaptMcpTools` never fails the whole catalog over one bad schema. A tool whose `inputSchema` is outside the `JsonSchema.fromJson` subset (`pattern`, a *general* union, a remote or recursive `$ref`, a numeric `enum`, an untyped `{}`/… — the nullable spellings `type: [<type>, 'null']` and `anyOf`/`oneOf` `[T, {type:'null'}]`, local `$ref`/`$defs`, and a schema-valued `additionalProperties` on an object with no declared properties and no keyword constraining its key set (`patternProperties`, `propertyNames`, `unevaluatedProperties`, `dependentRequired`, `dependentSchemas`, `dependencies`, `min`/`maxProperties`) are in the subset and adapt fine; zod `.catchall()` shapes — declared properties plus a value schema — are still skipped) is **excluded** from `tools` (the model is never offered a tool whose args we can't validate), **surfaced structurally** on `skipped` (name + JSON-pointer reason + raw failing schema), and — when a `logger` is supplied — **NOISY-warned** with all three. The `samples/testbed` `mcp-probe` scenario points it at any MCP server and prints a compatibility report (configure via `MCP_PROBE_URL` or `MCP_PROBE_COMMAND`).

**Explicitly NOT in scope:** browser sibling (`@fgv/ts-web-extras-mcp`), MCP resources / prompts / sampling, OAuth/managed auth (static headers only), multimodal tool-result passthrough, cross-server tool-name namespacing. Widening `JsonSchema.fromJson`'s subset lives in `@fgv/ts-json-base` (its `CAPABILITIES.md` lists what is accepted; `docs/FUTURE.md` lists what is deferred and why). **Security:** `createStdioTransport` spawns a consumer-supplied command as a subprocess — a trust boundary; never source the command from untrusted input.

---

---

## Decision shortcuts

- **Making an MCP server's tools callable from an ai-assist tool-use conversation?** → `@fgv/ts-extras-mcp` (Node). `connectMcpSession` → `adaptMcpTools(session, { logger })` → hand `result.tools` (`AiAssist.IAiClientTool[]`) to `AiAssist.executeClientToolTurn({ ..., clientTools: result.tools })`. `adaptMcpTools` gracefully degrades: tools whose `inputSchema` is outside the `JsonSchema.fromJson` subset land in `result.skipped` (name + JSON-pointer reason + raw schema) and NOISY-warn rather than failing the catalog. Transports: `createStdioTransport({ command, args })` (spawns a subprocess — trust boundary), `createHttpTransport({ url, headers })`, or `createCustomTransport(sdkTransport)` for any SDK transport (e.g. `InMemoryTransport.createLinkedPair()` in tests). Bound or cancel calls with `callMcpTool(..., { timeoutMs, signal })`; branch on the failure's `McpFailureReason.kind`, never on its message text. Use the `samples/testbed` `mcp-probe` scenario (`MCP_PROBE_URL` / `MCP_PROBE_COMMAND`) to get a compatibility report for any server. **Don't hand-roll an MCP client or a JSON-Schema→client-tool adapter.**

---

## Recent additions

*Newest first. **Generated** — see the repo index; do not hand-edit inside the markers.*

<!-- BEGIN GENERATED: recent-additions -->

- **2026-10-04** — An MCP tool call can be bounded and cancelled — aborting an ai-assist turn now cancels the MCP request on the server — and every failure says what kind it was, so callers stop parsing messages. ([#722](https://github.com/ErikFortune/fgv/pull/722))
- **2026-08-22** — **Shipped:** `nullable: true` on every factory — the spelling OpenAI strict mode accepts for an absent-able field, where `optional(...)` is unsendable. ([#655](https://github.com/ErikFortune/fgv/pull/655))
- **2026-06-06** — Shipped `@fgv/ts-extras-mcp` (Node) — the MCP → ai-assist client-tools bridge: connect to an MCP server, discover its tools, and `adaptMcpTools` each into an `AiAssist.IAiClientTool` that drops into `executeClientToolTurn`. ([#469](https://github.com/ErikFortune/fgv/pull/469))

<!-- END GENERATED: recent-additions -->
