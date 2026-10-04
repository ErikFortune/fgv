# Brief — `mcp-client-cancellation`

**Orchestrator-owned. Frozen at kickoff.** Put questions and disagreements in `state.md`; do not edit
this file.

**Origin:** four PersonAIlity `fgv-ask`s, triaged as class C1 in
`.ai/tasks/active/personality-asks-2026-10/followups.md` (entries 16, 9, 8 and 10). **Read each inbox
file** under `.ai/tasks/completed/2026-10/personality-intake/findings/inbox/`, not only the issue:

| entry | ask | inbox slug |
|---|---|---|
| 16 | personaility#678: public transport-injection seam | `2026-10-01-0043-mcp-transport-injection-seam` |
| 9 | personaility#673: failure kinds; observing a session close | `2026-10-01-0043-mcp-failure-kind-close-observation` |
| 8 | personaility#671: per-call timeout and `AbortSignal` on `callMcpTool` | `2026-10-01-0042-mcp-call-timeout-abort` |
| 10 | personaility#684: pass the turn's `AbortSignal` to `IAiClientTool.execute` | `2026-10-01-0043-ai-assist-client-tool-execute-signal` |

**Workflow shape:** `stream`. It branches from `integration/asks`, and its PR goes onto
`integration/asks`. The asks batch reaches `release` together later.

## Mission

Make an MCP tool call **cancellable and classifiable**:

- a caller can bound and abort a call;
- the turn's abort reaches the tool;
- a failure says *what kind* of failure it was;
- a session's close is observable.

The requester runs the workarounds for all of these today: a hub-side timeout race, a message-prefix
check, and reconnect-on-suspicion. These asks retire those workarounds.

## What the orchestrator believes — verify every line; do not build on it

This is from reading `release` @ `e5a40969`. **Nothing was run.** The last cycle's briefs were
overturned in four of six streams, and this orchestrator was wrong twice this cycle in claims it had
labelled verified. Your job includes deciding whether these are right.

1. `callMcpTool(session, name, args)` (`operations.ts:159`) takes no options. It calls
   `client.callTool({ name, arguments })` through `sdk.ts`'s **narrowed** `ISdkClient` interface
   (`sdk.ts:105-111`), which declares no request options at all. The real SDK (`^1.29.0`, a direct
   dependency) is believed to accept `RequestOptions` (timeout, signal, progress, and
   reset-on-progress) as a later argument to `callTool`, `listTools` and `connect`. **Read the
   installed SDK to confirm the signature and the defaults** (the requester measured a fixed 60 s
   default).
2. Failures today are plain `Result` failures. `callMcpTool` prefixes transport and protocol failures
   with `callMcpTool '<name>':`, and leaves a tool's own `isError` text unprefixed, deliberately, so
   the model sees the server's words. The requester classifies by that prefix.
3. `closeMcpSession` calls `client.close()` only. The SDK client is believed to expose an `onclose`
   (and `onerror`) hook. Confirm this.
4. `McpTransport.fromHandle` (`transports.ts:54`) accepts only the package's own `McpTransport`
   instances. The package's own end-to-end test reaches the internal class directly. `docs/FUTURE.md`
   ("Transport-injection testability seam") records the gap.
5. `IAiClientTool.execute` is `(args: TParams) => Promise<Result<unknown>>`
   (`ts-extras/.../ai-assist/toolTypes.ts:185`), called once at
   `clientToolContinuationBuilder.ts:953`, where `IExecuteClientToolTurnParams.signal` is in scope.
   An optional second parameter is **additive for implementers**: a function of one parameter is
   assignable to it. There are about 14 implementers in-repo: `ts-agent-tasks` (four tool files),
   `ts-agent-memory`, `ts-extras-mcp` `adapter.ts`, and `samples/testbed`. **Verify that none breaks;
   `rush rebuild` is the gate.**

## The shared design element: the failure vocabulary

Entries 9, 8 and 11 (OAuth, a later stream) all depend on one **failure-kind vocabulary**. Design it
once, here, so that 11 can add `unauthorized` without reshaping it.

- **Candidate kinds** (the requester's list, unverified): `tool-error`, `timeout`, `aborted`,
  `not-connected` / `session-expired`, `protocol`, `transport`, `unauthorized`.
  - **Name what actually distinguishes them** in the SDK's error classes. Do not take the list on
    faith.
  - Decide whether `unauthorized` is in the vocabulary now (no producer yet) or added by its stream.
- **Shape:** the established fgv shape is a `DetailedResult<T, TDetail>` with a closed-union detail.
  `ts-extras-system-one`, on `integration/system-one-decisions`, is the most recent precedent (a
  `SystemOneFailureReason` union plus a total classifier). Reuse the pattern; do not invent a new one.
- **The model-facing invariant must survive:** a tool's own `isError` text reaches the model
  verbatim. Classifying a failure must not change the message `executeClientToolTurn` sends back.
- **Changing `callMcpTool`'s return type** from `Result` to `DetailedResult` is an API change on an
  active surface. Check how `adapter.ts` consumes it.

## Order and scope

Do them in this order; each lands as its own commit:

1. **#678, the transport seam (entry 16).** Let a consumer, and our own tests, drive a session
   against an in-memory server. The requester offered two shapes: accept a pre-built SDK transport,
   or export a `createInMemoryTransportPair`. **Your call.** The orchestrator's unverified lean is the
   second, because the first leaks the SDK's transport type across the boundary. Use the seam for
   every test in steps 2–4: those tests should run against a real in-process MCP server, not a mocked
   client.
2. **#673, the failure kinds and close observation (entry 9).**
   - The vocabulary, as designed above.
   - An observable close: an `onClose` callback, or a status read. The requester offered both;
     choose one.
   - Reconnect policy stays with the consumer. Do not build a pool or a reconnector.
3. **#671, per-call options on `callMcpTool` (entry 8).**
   - An optional options bag mapped onto the SDK's request options: timeout, signal, and progress if
     cheap.
   - Also on `listMcpTools`, and on `connectMcpSession` if the SDK supports it there.
   - A timed-out or aborted call returns the vocabulary's `timeout` / `aborted`, never `transport`.
4. **#684, the signal to `execute` (entry 10, in `ts-extras`).**
   - `execute(args, context?: { signal?: AbortSignal })`, passed the turn's signal at the one call
     site.
   - `adapter.ts` forwards it to `callMcpTool`'s new option.
   - Do not thread it into other implementers. That is their owners' choice, and the parameter is
     optional.

## Package surface

- `libraries/ts-extras-mcp` (source, tests, `etc/*.api.md`, `CAPABILITIES.md`, README).
- `libraries/ts-extras/src/packlets/ai-assist/` `toolTypes.ts` and
  `streamingAdapters/clientToolContinuationBuilder.ts` only, plus their tests and `etc/ts-extras.api.md`.
- `common/changes/@fgv/<pkg>/*.json` for each package touched, typed per
  `.ai/instructions/ACTIVE_DEVELOPMENT.md` § "How to type a change file". `ts-extras-mcp` and
  `ai-assist` are active surfaces that have never shipped on `main`, so a breaking change is `minor`
  with a `BREAKING:` prefix.
- `docs/FUTURE.md`: retire the transport-seam entry (and any others this stream closes).
- `.ai/tasks/active/personality-asks-2026-10/followups.md`: **do not edit.** The orchestrator owns it.

## Out of scope

- Every other MCP ask: #672 egress (needs a new safer-fetch primitive), #675 rich results, #676
  descriptors, #674 terminate-on-close, #677 OAuth. **Note** anything your vocabulary or options bag
  pre-empts for them.
- Threading the signal into `ts-agent-tasks` / `ts-agent-memory` tools.
- A reconnect or pool manager.
- **Concurrent stream:** `json-schema-fromjson-widening` runs at the same time on `ts-json-base`. It
  may update `ts-extras-mcp` **tests** that pin which tool schemas are skipped. If you both touch the
  same test file, whichever lands second merges. Do not edit `ts-json-base`.

## Acceptance criteria

- [ ] Each numbered belief has a verdict, with evidence from the installed SDK where it applies.
- [ ] The failure vocabulary is documented (TSDoc and `CAPABILITIES.md`), together with how each SDK
      error maps to a kind. **Load-bearing:** the classification is total, so every thrown or
      rejected thing becomes a `Result`. A test proves `timeout` and `aborted` are never reported as
      `transport`.
- [ ] **Load-bearing:** a tool's `isError` text still reaches the model verbatim. Prove it with an
      `executeClientToolTurn`-level test, not only a `callMcpTool` one.
- [ ] **Load-bearing:** an aborted turn aborts the in-flight MCP request. Prove it end to end against
      the in-memory server: the server sees the cancellation, or the request stops, rather than
      running on to the SDK's default timeout.
- [ ] A revert matrix in `result.md`: each protection reverted on its own, and the named test going
      red. Choose fixture values where the right and wrong answers differ.
- [ ] `rushx build`, `rushx lint` and `rushx test` (100% coverage) pass with **zero warnings** in
      `ts-extras-mcp` and `ts-extras`. Grade the output with `grep -ci warning`, not the exit code.
- [ ] **The `IAiClientTool` interface widens, so `node common/scripts/install-run-rush.js rebuild`
      repo-wide passes**, and so does `install-run-rush.js test` repo-wide, because classification
      changes what `callMcpTool` returns.
- [ ] `rushx fixlint` run; `change --verify --target-branch origin/integration/asks` passes.
- [ ] The `code-reviewer` agent run on your diff after the functional tests and before coverage
      closure. Findings dispositioned in `result.md`.
- [ ] `/finalize-task` run: migrate to `.ai/tasks/completed/2026-10/mcp-client-cancellation/`, write
      the ledger entry (anticipating the merge; the PR number is filled in by the orchestrator), and
      make the capability-feed decision.

## Mechanics

- Work on branch `mcp-client-cancellation`, created from `integration/asks` with this brief on it.
  Push there. **Do not open a PR.**
- `rush` is not on PATH: use `node common/scripts/install-run-rush.js <cmd>` from the repo root.
- Commit each step before running long gates. Run every gate in the foreground.
- **This is an authorization-adjacent, check-then-act surface** (an abort racing a call, a close racing
  a call). `CODING_STANDARDS.md` § "Authorization boundaries are the same blind spot" applies in
  spirit. List every `await` between a check and the act it guards in `result.md`, and say what
  re-checks after it.
- **Stop and surface**, with a final message of at most 300 words, if:
  - the SDK cannot cancel an in-flight request at all;
  - the vocabulary cannot be total without changing the model-facing `isError` message;
  - widening `IAiClientTool` breaks an implementer in a way that needs its owner's decision.

## Exit artifacts

- `state.md`: your working surface.
- `result.md`, covering:
  - what shipped, per step;
  - each belief's verdict;
  - the vocabulary and its mapping;
  - the check-then-act list;
  - the revert matrix;
  - the gate counts;
  - what this pre-empts for #672, #674, #675, #676 and #677;
  - anything this brief got wrong.
