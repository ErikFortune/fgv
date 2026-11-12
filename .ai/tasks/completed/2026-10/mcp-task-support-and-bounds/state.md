# State: `mcp-task-support-and-bounds`

Worker-owned. Base `integration/asks` at `8ddcdc9d0` (the branch head at kickoff was `c25030b63`,
the brief commit on top of it).

## SDK verification (brief Facts, `execution` / `taskSupport`)

Checked against `@modelcontextprotocol/sdk@1.29.0`, `dist/cjs/types.js` and `dist/cjs/client/index.js`:

- `ToolExecutionSchema = z.object({ taskSupport: z.enum(['required', 'optional', 'forbidden']).optional() })`,
  and `ToolSchema` carries `execution: ToolExecutionSchema.optional()`. Absent means `'forbidden'`.
  The brief's vocabulary matches the SDK exactly.
- Because `client.listTools` parses each page against `ListToolsResultSchema`, a `taskSupport`
  outside that enum **fails the whole page** in the SDK, before this package sees it. Verified with a
  real in-memory server (`bounds.test.ts`, "task support outside the vocabulary"): the listing fails
  as `protocol`. The brief's "an unknown value is preserved as `undefined` and logged; it never fails
  discovery" therefore holds only for values that reach the package. The drop-and-log path is
  implemented and tested against a fake SDK client; I did not bypass the SDK's list schema to make it
  reachable, because `client.listTools` is also what feeds the SDK's output-schema validators and its
  own task-required guard (`cacheToolMetadata`). See `result.md` § Deviations.
- `client.callTool` refuses a tool cached as task-required with `McpError(InvalidRequest, …)`,
  i.e. `-32600` — the failure personaility#689 reports. Pinned by a test.
- Observed, not changed: `cacheToolMetadata` **clears** its caches on every `listTools` call, so after
  a multi-page `listMcpTools` the SDK knows the output schemas and task-required tools of the
  **last page only**. Pre-existing; out of scope here. Recorded in `result.md` for the orchestrator.

## Decisions taken in flight

- **Skip-kind check order.** `'task-support'` is checked first, before the schema: a task-required
  tool fails every plain call whatever its schema, so that is the more fundamental reason.
- **`'wire'` is distinguishable today.** The schema parse and the keyword-table admission are separate
  steps, so the adapter now runs them as two checks, each naming its kind. Imperative on purpose:
  the two failures carry different kinds, and a `DetailedResult` failure's `detail` is typed
  optional, which would need a fallback branch.
- **Failure kind for the listing bounds: a new `'limit-exceeded'`**, with `limit: 'maxPages' |
  'maxTotalMs'`. Reasoning in `result.md`.
- **`maxPages` must be a positive integer**, not just positive and finite: a fractional page cap has
  no meaning, and `Number.isSafeInteger` also refuses `Infinity`.
- **Forwarding through `adaptMcpTools`: a nested `discovery?: IListMcpToolsOptions`** rather than two
  flat fields. It forwards both bounds and, with them, the per-page `timeoutMs` and `signal`, which
  `adaptMcpTools` could not bound at all before. `logger` stays the adapter's own.
- **The deadline's signal is `AbortSignal.any([caller, expiry])`.** First abort wins, so "who aborted
  first" is read off `signal.reason`; no listener is left on a long-lived caller signal (pinned).
- **The counting stream has `highWaterMark: 0`**, so it reads upstream only when the consumer asks:
  the guarded fetch still never reads the body itself. It cancels upstream **before** erroring, so the
  connection is released by the time the caller sees the error.
- **`GuardedFetchError`'s message** for `'too-large'` names `maxResponseBytes` and the limit; every
  other kind keeps the fixed `guarded fetch failed: <kind>`.
- **The capped response is a new `Response`** (a platform body cannot be replaced). Status, status
  text and headers carry over through the constructor; `url` and `redirected` are copied as own
  properties. A response with no body is returned unchanged.

## Consumer sweep (widened `IMcpSkippedTool`, `McpFailureReason`, `IGuardedFetchOptions`)

`grep -rln` over `libraries/ tools/ samples/` outside the two packages:

- `samples/testbed` `mcpProbe` — **constructs `IMcpSkippedTool` literals** in its test, which the new
  required `kind` breaks; fixed, and the probe report now prints each skip's kind (its header claimed
  every skip was a schema-subset skip, which is no longer true).
- `libraries/ts-extras-re2` integration test — reads `skipped`, does not construct it; unaffected.
- `libraries/ts-agent-memory` — mentions `ts-extras-mcp` in comments only.
- No other implementer of `IGuardedFetchOptions`; no exhaustive switch over `McpFailureReason`.

## Review

No independent reviewer was spawned (the kickoff forbids it). I applied the `code-reviewer` rubric to
the diff inline; findings and dispositions are in `result.md`.
