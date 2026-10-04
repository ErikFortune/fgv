# mcp-client-cancellation — cancellable, classifiable MCP tool calls

**Shipped**: 2026-10-04 into `integration/asks` (PR number recorded in `meta.yaml` at open).
Packages: `@fgv/ts-extras-mcp`, `@fgv/ts-extras` (ai-assist).

## Summary

Four PersonAIlity asks retired three hub-side workarounds — a timeout race, a message-prefix check,
and reconnect-on-suspicion. An MCP call now takes `timeoutMs`, an `AbortSignal` and a progress
callback; every failure from `connectMcpSession`, `listMcpTools`, `callMcpTool` and `adaptMcpTools`
carries a total `McpFailureReason`; `connectMcpSession({ onClose })` reports a session's close; and
`createCustomTransport` lets a consumer run a session over any SDK transport, an in-memory pair
included. `IAiClientTool.execute` gained an optional context carrying the turn's signal, which the
MCP adapter forwards, so aborting an `executeClientToolTurn` turn cancels the request on the server.

## The one fact the design rests on

The MCP SDK (1.29.0) reports a caller's abort as `McpError(-32001 RequestTimeout)` — the timeout
code. A classifier keyed on codes would call every abort a timeout. Each call therefore links the
caller's signal to a private controller that aborts with a distinct reason object, and `aborted`
means "the SDK rejected with *that* object". Whichever of the abort and the timeout the SDK settled
with first decides — a test pins the case where an abort lands one microtask after a timeout.

## Files changed

- `libraries/ts-extras-mcp/src/packlets/mcp/` — `model.ts` (vocabulary, options, transport shape),
  `sdk.ts` (classifier, abort reason, request-option projection), new `request.ts`, `session.ts`
  (close watcher, connect options), `operations.ts`, `adapter.ts`, `transports.ts`, `index.ts`
- `libraries/ts-extras-mcp/src/test/unit/` — new `failures`, `cancellation`, `httpFailures`,
  `clientToolTurn` suites; `sdk`, `mcp`, `endToEnd`, `index` updated
- `libraries/ts-extras/src/packlets/ai-assist/` — `toolTypes.ts`, the continuation builder, two
  barrels; one test file
- `etc/*.api.md`, both `CAPABILITIES.md`, the MCP `README.md`, `docs/FUTURE.md`, two change files

## Decisions made during execution

- **Seam: accept a pre-built SDK transport** (typed structurally), not an exported in-memory pair —
  the pair's server half would have had to name the SDK's `Transport` type.
- **`unauthorized` ships now** — a refused static bearer token already yields HTTP 401.
- **`transport` is the catch-all**, not `unknown`; reasoning in `result.md`.
- **`not-connected` is decided by the observed close**, not by `-32000`, which servers also use as
  a generic error (from the `code-reviewer` pass).
- **`onClose` callback**, not a status read.
- **Gate-time review:** the whole connect is raced against the abort and a deadline (the SDK's
  connect awaits two steps its request options do not cover); timeouts are range-validated
  (`invalid-options`); transport handles are single-use; `execute` became a method signature.

## Followups

- None opened. What each later MCP ask can reuse is in `result.md` § *What this pre-empts*.

## Evidence

`result.md`: belief verdicts, the vocabulary's SDK mapping, the check-then-act list, the 22-row
revert matrix, the review dispositions, and § Gate counts (the gate-time run). `state.md` § Gates holds
the first run.
