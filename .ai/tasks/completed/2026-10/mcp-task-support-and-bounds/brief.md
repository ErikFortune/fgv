# Brief: `mcp-task-support-and-bounds` — MCP task-support carry-through and bounded discovery/egress

Orchestrator-owned and frozen at kickoff. Put questions in `state.md`; the outcome goes in `result.md`.

**Origin:** personaility#689 and personaility#690 (fgv-asks). Read both issue bodies on ErikFortune/personaility.
**Base / PR target:** `integration/asks`. `ai-assist-client-tool-loop` (#697, PR #755) lands in parallel; it does not touch these surfaces, so expect only ledger conflicts.
**Packages:** `@fgv/ts-extras-mcp`, plus `@fgv/ts-extras` (the `safer-fetch` packlet only).

## Facts (verified on integration/asks)

- `listMcpTools` (`ts-extras-mcp/src/packlets/mcp/operations.ts:155`) loops over cursor pages until `nextCursor` is absent.
  - It has no page cap and no total-time cap.
  - The `IMcpRequestOptions` timeout applies **per page**.
- `IMcpSkippedTool` (`model.ts:764`) is `{ name, reason, schema }`. It has no discriminator.
- `IMcpToolDescriptor` does not carry the MCP tool's `execution` / `taskSupport` field. The SDK is `@modelcontextprotocol/sdk ^1.29.0`. Verify in the SDK's types whether its tool schema carries `execution.taskSupport`, and with what values.
- `SaferFetch.createGuardedFetch` (`ts-extras/src/packlets/safer-fetch/saferFetch.ts:1736`) refuses `maxResponseBytes`, along with other options (`GUARDED_FETCH_REFUSED_OPTIONS`, ~:1453). The reason given is that a guarded fetch never reads the body.

## Decisions

1. **#689 task support.**
   - Carry the tool's execution metadata onto `IMcpToolDescriptor` as `execution?: IMcpToolExecution`, holding `taskSupport?: 'forbidden' | 'optional' | 'required'` (use the SDK's actual vocabulary). Read it with a converter, never with a cast.
   - An unknown value is preserved as `undefined` and logged; it never fails discovery.
   - `adaptMcpTools` skips a tool whose `taskSupport` is `'required'`, because the client cannot drive MCP tasks. It records the skip structurally.
2. **Skip discriminator.**
   - Add `kind: 'schema' | 'wire' | 'task-support'` to `IMcpSkippedTool`, as a closed union declared once.
   - `'wire'` covers the existing refusal by the keyword-capability table, if that is distinguishable today; otherwise use `'schema'`.
   - Keep `reason` and `schema`.
   - Widening an interface that consumers construct means a change file `minor` prefixed `BREAKING:`.
3. **#690 egress bound.**
   - Lift `maxResponseBytes` out of the guarded-fetch refused set. When set, wrap the response body in a counting `ReadableStream` that errors the stream once the count exceeds the limit. The fetch still never buffers or reads the body itself.
   - The failure must be identifiable. Error the stream with an error whose message names `maxResponseBytes` and the limit; use the existing `'too-large'` reason vocabulary where an `Outcome` is produced.
   - The option is opt-in, with **no default cap**.
   - Mirror the change in the browser barrel if `createGuardedFetch` is exported there. It is: `index.browser.ts:89`.
   - Update the refusal message and TSDoc so they no longer claim the option is unsupported.
4. **#690 discovery bounds.**
   - Add `maxPages?: number` and `maxTotalMs?: number` to the `listMcpTools` options, in a new `IListMcpToolsOptions` that extends `IMcpRequestOptions`.
   - Exceeding either one fails, with a new `McpFailureReason` kind or a clearly reused one. Justify the choice in `result.md`. The failure is never a silent truncation.
   - Forward both options through `adaptMcpTools`, or through whatever composes discovery with adaptation.
   - Validate both: positive and finite, and `maxTotalMs` must not exceed the timer maximum. Use the existing timer-limit helper.
   - No default caps.
5. **Docs.** Update `ts-extras-mcp/CAPABILITIES.md`, `ts-extras/CAPABILITIES.md` (safer-fetch), and the READMEs where the surfaces are described. Add the change files.

## Required evidence

This is a security boundary, so see CODING_STANDARDS § authorization/ordering.
- A test against a real streaming server (follow the existing pattern) where the body exceeds `maxResponseBytes` and the stream errors **before** the whole body is delivered.
- A test where a body exactly at the limit passes.
- A test where a server pages forever and `maxPages` stops it.
- A test where a slow pager trips `maxTotalMs`.
- A test where a tool with `taskSupport: 'required'` is skipped with `kind: 'task-support'`, while `'optional'` is adapted.
- In `result.md`, list every place a limit is checked and what happens when it is exceeded part-way.

## Acceptance

- [ ] Run `rushx build`, `lint` and `test` (100% coverage) in both packages, with no warnings.
- [ ] `rush change --verify --target-branch origin/integration/asks` passes.
- [ ] Run a repo-wide `node common/scripts/install-run-rush.js rebuild` **and** `test`. The test run is required because this widens accepted and classified sets: a fixture in another package may pin the old skip shape.
- [ ] Ledger entries are written per `.ai/conventions/workflow/artifact-protocol.md`, using `#TBD` where the PR number is unknown.
- [ ] Do not spawn subagents. Commit before gating. Run the gate in the foreground, with logs under your worktree.
