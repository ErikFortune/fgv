# `mcp-task-support-and-bounds`: MCP task-support carry-through, skip kinds, and bounded discovery and egress

**Shipped 2026-10-26** onto `integration/asks` (PR #757).
Origin: personaility#689 and personaility#690 (fgv-asks).

---

## What it is

Two asks from the same consumer, both about what an MCP server can do to a client that trusts it too
far. #689: a tool that requires MCP task execution was adapted anyway, and every call to it failed
with `-32600`. #690: nothing bounded how many pages a server could list, for how long, or how many
bytes a response could send.

## What shipped

- **Task support (`@fgv/ts-extras-mcp`).** `IMcpToolDescriptor.execution?.taskSupport`
  (`'forbidden' | 'optional' | 'required'`), converter-read. `adaptMcpTools` skips a `'required'`
  tool; `'optional'` is adapted.
- **Skip kinds.** `IMcpSkippedTool.kind`: `'schema'`, `'wire'` or `'task-support'` (`McpSkipKind`).
- **Discovery bounds.** `listMcpTools(session, { maxPages?, maxTotalMs? })` — `IListMcpToolsOptions`,
  opt-in, no defaults. Exceeding either fails as the new `'limit-exceeded'` `McpFailureReason`
  (`limit` names the bound); nothing is truncated. `adaptMcpTools` forwards them via `discovery`.
- **Egress bound (`@fgv/ts-extras` safer-fetch).** `createGuardedFetch({ maxResponseBytes })`, opt-in.
  A declared `Content-Length` over the cap rejects the call; any other body is wrapped in a counting
  stream that cancels the upstream and errors `'too-large'` once the count passes the cap. Through
  MCP it surfaces as `egress-blocked` / `'too-large'`.
- **Testbed.** The `mcp-probe` report prints each skip's kind.

## What changed shape

- Through the real SDK, an unknown `taskSupport` fails the listing page as `protocol` — the SDK's own
  schema refuses it first — so the brief's "never fails discovery" holds only for values that reach
  the package. Left as a design call for the orchestrator.
- `adaptMcpTools` takes a nested `discovery` option rather than two flat fields.

## Where to look

- `result.md`: every place a limit is checked and what happens part-way, why `'limit-exceeded'` is a
  new kind, the evidence tests and which went red under mutation, deviations, observations (the SDK's
  per-page tool-metadata cache), and the gates.
- `state.md`: the SDK verification and the decisions taken in flight.
- Package docs: `libraries/ts-extras-mcp/CAPABILITIES.md`, `libraries/ts-extras/CAPABILITIES.md`.
