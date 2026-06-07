# Design note — `@fgv/ts-extras-mcp` slice 1

**Stream:** ts-extras-mcp (integration branch off `release`)
**Phase:** implementation slice 1
**Date:** 2026-06-06
**Status:** decisions pinned; implemented in this PR.

This note pins the key decisions called for in the brief (§Process & gates) and sharpens
design §3.3 of `ai-assist-client-tools`. It ships with the code.

---

## 1. Package shape

`@fgv/ts-extras-mcp` (Node), `libraries/ts-extras-mcp/`, `sideEffects: false`, version `5.1.0`
(lockstep). Scaffolding copied from `@fgv/ts-extras-transformers` (Heft dual-rig, jest 100%
gate, api-extractor, eslint flat config). Registered in `rush.json` with `versionPolicyName:
base-utils`, `tags: ["libraries"]`.

Dependencies:
- `@modelcontextprotocol/sdk@^1.29.0` — **direct dependency** (webauthn-style; the SDK is the
  thing we wrap).
- `@fgv/ts-utils` — peer + dev `workspace:*` (Result, Logging, mapResults).
- `@fgv/ts-extras` — peer + dev `workspace:*` (for `AiAssist.IAiClientTool`).
- `@fgv/ts-json-base` — peer + dev `workspace:*` (for `JsonSchema.fromJson`).

`@fgv/ts-utils`, `@fgv/ts-extras`, `@fgv/ts-json-base` are peer deps because the adapter's
return type (`IAiClientTool`, `ISchemaValidator`) crosses the boundary and consumers must
share the same instances — same convention `ts-extras-transformers` uses for `@fgv/ts-utils`.

### SDK-isolation seam (load-bearing)

ALL `@modelcontextprotocol/sdk` imports live in **one file**: `src/packlets/mcp/sdk.ts`. It
exports a minimal local projection (`ISdkClient`, `SdkTransport`) and three factory functions
(`makeClient`, `makeStdioTransport`, `makeHttpTransport`). The rest of the package is
SDK-agnostic and depends only on `./sdk`. The announced v2 client-package rename is therefore
a one-file change, and unit tests mock `./sdk` (no live server, no SDK internals). The single
`as unknown as` cast that bridges the real SDK `Client`/transport to the local projection lives
only in `sdk.ts`.

---

## 2. Public surface (the boundary primitives)

| Function | Signature |
|---|---|
| `createStdioTransport` | `(params: IMcpStdioTransportParams) => Result<IMcpTransport>` |
| `createHttpTransport` | `(params: IMcpHttpTransportParams) => Result<IMcpTransport>` |
| `connectMcpSession` | `(params: IConnectMcpSessionParams) => Promise<Result<IMcpSession>>` |
| `closeMcpSession` | `(session: IMcpSession) => Promise<Result<true>>` |
| `listMcpTools` | `(session: IMcpSession) => Promise<Result<ReadonlyArray<IMcpToolDescriptor>>>` |
| `callMcpTool` | `(session, name, args) => Promise<Result<IMcpToolCallResult>>` |
| `adaptMcpTools` | `(session, options?) => Promise<Result<IAdaptMcpToolsResult>>` |

`IMcpTransport` and `IMcpSession` are **opaque handles**. The interfaces expose only read-only
metadata (`transportKind`; `serverInfo`/client identity). The concrete classes that carry the
SDK objects are packlet-internal and not exported; the functions narrow the handle back to the
concrete class with a checked guard that fails loudly on a foreign handle (testable, no
`instanceof`-only defensive dead code).

`closeMcpSession` returns `Result<true>` (NOT `Result<void>` — repo anti-pattern).

---

## 3. `CallToolResult` projection (pinned)

`callMcpTool` projects the SDK `CallToolResult` to `IMcpToolCallResult { content: string }`:

- **text blocks** (`{ type: 'text', text }`) → concatenated with `\n`.
- **non-text blocks** (image / audio / resource / unknown) → a structured one-line summary
  `[<type> block]` (multimodal passthrough is explicitly out of scope per the brief).
- **`isError: true`** → `Result.fail(content)` — NOT swallowed, so layer 1's
  `executeClientToolTurn` routes it as a provider-native error tool-result. On success,
  `isError` is necessarily false so it is not carried on the success type.
- empty/absent `content` → empty string (success) / generic message (error).

The adapter's `execute` is `(args) => callMcpTool(session, name, args)` mapping the resolved
`{ content }` through (`isError` → fail is already handled inside `callMcpTool`).

---

## 4. `adaptMcpTools` return shape + Constraint 1 (graceful degrade, NOISY warn)

```ts
interface IAdaptMcpToolsResult {
  readonly tools: ReadonlyArray<AiAssist.IAiClientTool>;     // cleanly-adapted, model-offerable
  readonly skipped: ReadonlyArray<IMcpSkippedTool>;          // structurally surfaced failures
}
interface IMcpSkippedTool {
  readonly name: string;
  readonly reason: string;     // JSON-pointer reason verbatim from JsonSchema.fromJson
  readonly schema: JsonValue;  // the raw failing inputSchema (can be null / non-object), in hand for fromJson extension
}
```

When a discovered tool's `inputSchema` fails `JsonSchema.fromJson`:
1. The tool is **excluded** from `tools` (the model must never be offered a tool whose args we
   can't validate).
2. A **NOISY warning** is emitted on the injected `Logging.ILogger`:
   `mcp: skipping tool '<name>': inputSchema is outside the supported JSON Schema subset:
   <pointer reason>. Raw schema: <JSON.stringify(schema)>` — tool name + pointer reason + the
   full raw schema, so we can see exactly which subset feature to extend.
3. The failure is **surfaced structurally** on `skipped[]` so the probe / callers enumerate
   every un-adaptable tool with its schema in hand.

This never fails the whole catalog: `adaptMcpTools` succeeds with `{ tools, skipped }` even if
every tool is skipped. A tool whose `inputSchema` is absent/non-object also lands in `skipped`
(can't validate → can't offer). The only failure mode of `adaptMcpTools` is an upstream
`listMcpTools` failure (transport / protocol error).

Per-item adaptation uses a `mapResults`-style helper (`_adaptOne`) that always succeeds (it
returns an adapted-or-skipped discriminated record), so the aggregation never short-circuits —
graceful degradation is structural, not a swallowed error.

---

## 5. `listMcpTools` pagination

`listMcpTools` loops on the SDK's `nextCursor` until absent, accumulating the full catalog
across pages. The mock SDK in tests exercises a two-page catalog to cover the loop.

---

## 6. Probe (Constraint 2) — testbed CLI scenario `mcp-probe`

A diagnostic `samples/testbed` CLI scenario (`id: 'mcp-probe'`). It connects to an MCP server,
lists tools, runs the full catalog through `adaptMcpTools`, and prints a compatibility report:
which tools adapted cleanly, and for each skipped tool the name + JSON-pointer reason + raw
failing schema.

**Server spec via environment (decision needing ratification — see §8).** The testbed CLI
dispatch (`runTestbedCli --scenario <id>`) calls `scenario.cli.run(context)` with no
pass-through of trailing argv, and the CLI already resolves secrets from env vars. To stay
inside that contract without widening it, the probe reads its server spec from environment
variables:
- `MCP_PROBE_URL` (+ optional `MCP_PROBE_HEADERS` as `k=v,k=v`) → HTTP transport, OR
- `MCP_PROBE_COMMAND` (+ optional `MCP_PROBE_ARGS` whitespace-split, `MCP_PROBE_CWD`) → stdio.

The probe is structured for honest 100% coverage:
- `parseMcpProbeSpecFromEnv(env)` — pure, fully tested (http path, stdio path, missing-config
  failure, header parsing).
- `runMcpProbe(spec, deps, logger)` — pure orchestration over an injected `IMcpProbeDeps`
  (`connect` / `adapt` / `close`), fully tested with a fake deps object (clean catalog, mixed
  catalog with skips, connect failure, adapt failure, close failure-after-success).
- `formatMcpProbeReport(...)` — pure string formatting, fully tested.
- The scenario's `cli.run` glues `parseMcpProbeSpecFromEnv(process.env)` → default deps wired
  to `@fgv/ts-extras-mcp` → `runMcpProbe`. The default-deps literal (the only part that needs a
  live server / real transport) is the single `/* c8 ignore */` orchestration seam, consistent
  with testbed conventions (orchestration seams only).

The probe is added as a Node-only CLI scenario; `@fgv/ts-extras-mcp` is loaded via a
`webpackIgnore` dynamic import (same pattern as `local-summarization`) so the node-native MCP
SDK never enters the web bundle graph.

---

## 7. Deferred (follow-ups, recorded in README + docs/FUTURE.md)

Browser sibling `@fgv/ts-web-extras-mcp`; MCP resources / prompts / sampling; OAuth/managed
auth (static headers only at v0.1); multimodal tool-result passthrough; cross-server tool-name
namespacing (duplicate names already fail loudly in `executeClientToolTurn`). The headline
follow-on lever — additively widening `JsonSchema.fromJson`'s supported subset (`$ref`/`$defs`,
`pattern`) — is a separate `ts-json-base` stream, commissioned from what the probe surfaces
against real servers. NOT widened here.

---

## 8. Decisions needing orchestrator ratification

1. **Probe server spec via env vars, not trailing argv.** The brief says "via args"; the
   testbed CLI contract doesn't forward trailing argv to scenarios, and the established idiom is
   env-var resolution on the CLI. Env vars (`MCP_PROBE_URL` / `MCP_PROBE_COMMAND` …) are the
   most-defensible choice that honors the contract without widening `runTestbedCli`. If a true
   argv interface is wanted, that's a small `cli.ts` extension in a follow-up.
2. **Peer-dep classification of `@fgv/ts-extras` / `@fgv/ts-json-base`.** Treated as peers (like
   `ts-extras-transformers` treats `@fgv/ts-utils`) because `IAiClientTool` / `ISchemaValidator`
   instances cross the boundary. If the cluster prefers direct deps for intra-repo `@fgv/*`,
   this is a one-line package.json change.
