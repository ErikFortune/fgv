# Brief — `mcp-round-2a` (MCP fidelity and lifecycle)

**Orchestrator-owned. Frozen at kickoff.** Put questions and disagreements in `state.md`; do not edit
this file.

**Origin:** three PersonAIlity `fgv-ask`s, triaged as class C3 in
`.ai/tasks/active/personality-asks-2026-10/followups.md` (entries 13, 14 and 15). **Read each inbox
file** under `.ai/tasks/completed/2026-10/personality-intake/findings/inbox/`, not only the issue:

| entry | ask | inbox slug |
|---|---|---|
| 15 | personaility#674: terminate HTTP sessions on close | `2026-10-01-0043-mcp-terminate-http-session` |
| 14 | personaility#676: descriptor `title` / `outputSchema`, and `tools/list_changed` | `2026-10-01-0043-mcp-descriptor-title-list-changed` |
| 13 | personaility#675: keep resource links, `structuredContent` and media in tool results | `2026-10-01-0043-mcp-rich-tool-results` |

**Workflow shape:** `stream`. Branch `mcp-round-2a`, cut from `integration/asks` @ `279e1813` (which
carries #722 and #723); the PR goes onto `integration/asks`. **A second stream, `mcp-round-2b`
(#672 guarded egress, #677 OAuth), follows this one** and touches the same files, so it is not
concurrent. Note in `result.md` anything here that pre-empts or constrains it.

## Mission

Stop the package from losing what an MCP server sends: tool titles, output schemas, tool-list
changes, and every non-text result block. Close an HTTP session properly on the server. All three are
additive to the surface #722 just shipped.

## What the orchestrator believes — verify every line; do not build on it

Read from `integration/asks` @ `279e1813`. **Nothing was run.**

1. `_projectContent` (`operations.ts:104`) concatenates `text` blocks and turns every other block into
   `[<type> block]`. `structuredContent` is discarded. `IMcpToolCallResult` (`model.ts:405`) is
   `{ content: string }` only.
2. `_toDescriptor` (`operations.ts:90`) drops `title`, `outputSchema` and `_meta`.
3. `closeMcpSession` and every losing connect path call `client.close()` only (`session.ts`). The
   SDK's `StreamableHTTPClientTransport` is believed to expose `terminateSession()`, which sends the
   Streamable-HTTP `DELETE`. **Confirm it in the installed SDK (`^1.29.0`)**, along with what it does
   on a 405 and when no session id was assigned.
4. The SDK client is believed to accept a handler for `notifications/tools/list_changed` (e.g.
   `setNotificationHandler(ToolListChangedNotificationSchema, …)`), and the server advertises
   `capabilities.tools.listChanged`. Confirm both.
5. `McpCloseWatcher` (`session.ts`) already contains a consumer callback that throws or rejects, and
   logs through `errorText`. The same containment is the model for any new callback.
6. `adaptMcpTools` (`adapter.ts`) feeds `callMcpTool`'s `content` to the model as the tool result.

## Decisions already made — build these; argue in `state.md` only if one is wrong

These follow from the design rules in `CODING_STANDARDS.md` ("We build general capabilities"). Do
not ask the consumer to choose between them.

### #674 — terminate on close

- `closeMcpSession` on an **HTTP** session calls `terminateSession()` before `client.close()`. Stdio
  and custom transports are unchanged.
- **Best-effort and bounded.**
  - A 405, a network failure, or a server that never answers must not fail the close or delay it
    beyond a fixed bound of a few seconds (choose the constant, document it, and cover it with a
    test).
  - The close still resolves with the same result it does today, and `onClose` still fires exactly
    once.
  - A termination failure is logged at `detail`, never above `warn`, through `errorText`.
- **Not** on the losing connect paths that #722 made fire-and-forget. Those must stay unawaited, so
  that teardown can never stretch a connect past its deadline. Say in `result.md` whether a
  best-effort `DELETE` is still sent there.

### #676 — descriptor fields and tool-list changes

- `IMcpToolDescriptor` gains `title?: string` and `outputSchema?: JsonValue`.
  - `outputSchema` is carried verbatim as raw JSON, like `inputSchema`, so that it can later run
    through `JsonSchema.fromJson`; it is not parsed now.
  - `title` falls back to `annotations.title` when the tool has none, if the SDK types expose that.
    Say which.
  - **`_meta` stays out**: the requester's proposed shape does not ask for it.
  - Received strings must be valid single-line text. Converter-validate them; do not cast.
- `connectMcpSession` takes `onToolsChanged?: () => void | Promise<void>`.
  - It fires on `notifications/tools/list_changed`.
  - It is contained exactly as `onClose` is: a throw or rejection is logged, never propagated, and
    never unhandled.
  - It does **not** re-list on its own; the consumer calls `listMcpTools`.
  - It does not fire after close.
  - Register the handler before the handshake completes, so that a notification sent right after
    `initialize` is not lost.

### #675 — rich results

- `IMcpToolCallResult` gains:
  - `blocks: ReadonlyArray<McpContentBlock>`, a discriminated union by `type`:
    - `text` → `{ text }`.
    - `resource_link` → `{ uri, name?, title?, mimeType?, description? }`.
    - `resource`, an embedded resource:
      - for text, `{ uri, mimeType?, text }`;
      - for a blob, `{ uri, mimeType?, byteLength }`, with the data only when opted in (below).
    - `image` / `audio` → `{ mimeType, byteLength }`, with the data only when opted in.
    - Any other block type → `{ type: 'unknown', blockType }`. An unknown block never fails the call.
  - `structuredContent?: JsonValue`, when present and valid JSON.
- **Media data is opt-in.**
  - A per-call option (`includeMediaData?: boolean`, default `false`) adds `data` (base64, as the
    server sent it) to image, audio and blob blocks.
  - The default carries only `mimeType` and `byteLength`, so a large image does not ride every result
    by accident.
- **The text projection improves, and that is a deliberate value change:**
  - A `resource_link` projects to a line carrying its URI and name, rather than a placeholder. This
    is the requester's stated minimum bar.
  - An embedded text resource projects to its text.
  - Image, audio and unknown blocks keep their placeholder.
  - The change file says so with a `BREAKING:` prefix (an active surface, never on `main`, so
    `minor`).
- **Every block is converter-validated.** A malformed block becomes `unknown`, not a throw and not a
  failed call, and `structuredContent` that is not JSON is omitted.
  - Apply #723's lesson: no message built from a block echoes server text unescaped.
  - Apply #721's lesson: a received object with an own `__proto__` key must not silently lose data.
    The upstream `recordOf` / `jsonObject` defect is filed in `docs/TECH_DEBT.md`; refuse or flag it
    here rather than drop it silently, and say which.
- **The package does not follow links.** A `resource_link` URI is server-supplied, and following it is
  the consumer's decision. That fetch must go through their egress guard, which `mcp-round-2b`
  provides. Say so in TSDoc and in `CAPABILITIES.md`.
- `adaptMcpTools` keeps handing the model the text projection. Whether `blocks` should reach an
  ai-assist client tool's structured result is a question for `result.md`, not this stream.

## Order and scope

Each item lands as its own commit, in this order: **#674, #676, #675.** Test everything against a real
in-process MCP server through the #722 `createCustomTransport` seam, not a mocked client. Where the
SDK's in-memory transport cannot exercise an HTTP-only path (`terminateSession`, the `DELETE`), use a
real local HTTP server in the test, as #722's end-to-end tests do, or explain why not.

## Package surface

- `libraries/ts-extras-mcp`: source, tests, `etc/*.api.md`, `CAPABILITIES.md` and README.
- `common/changes/@fgv/ts-extras-mcp/*.json`, typed per `.ai/instructions/ACTIVE_DEVELOPMENT.md`
  § "How to type a change file".
- `docs/FUTURE.md`: retire the "Multimodal tool-result passthrough" entry, and any other this closes.
- **Do not edit:** `ts-extras`, `ts-json-base`, `ts-utils`, or
  `.ai/tasks/active/personality-asks-2026-10/followups.md` (the orchestrator owns it).

## Out of scope

- #672 (guarded egress) and #677 (OAuth): `mcp-round-2b`.
- #682 and the deferred #683 shapes (`JsonSchema`): a later stream.
- Following resource links, result-size caps (the requester caps at their own boundary), a reconnect
  or pool manager.

## Acceptance criteria

- [ ] Each numbered belief has a verdict, with evidence from the installed SDK where it applies.
- [ ] **Load-bearing (#674):** a server that answers the `DELETE` with 405, one that never answers,
      and one that drops the connection each leave `closeMcpSession` resolving within the stated
      bound, with `onClose` fired once. Prove it with timings, not just success.
- [ ] **Load-bearing (#676):** a `tools/list_changed` notification sent by a real in-process server
      reaches `onToolsChanged`. A throwing or rejecting `onToolsChanged` neither crashes nor leaks an
      unhandled rejection. Nothing fires after close.
- [ ] **Load-bearing (#675):**
      - the requester's spike cases each round-trip through a real server: `resource_link` ×2,
        embedded text resource, image, and `structuredContent` alongside text;
      - URIs and names survive;
      - media data is absent by default and present when opted in;
      - a malformed or unknown block never fails the call.
- [ ] A revert matrix in `result.md`: each protection reverted on its own, and the named test going
      red. Choose fixture values where the right and wrong answers differ.
- [ ] `rushx build`, `rushx lint` and `rushx test` (100% coverage) pass in `ts-extras-mcp` with **zero
      warnings**. Grade with `grep -ci warning`, not the exit code.
- [ ] `IMcpToolCallResult` and `IMcpToolDescriptor` widen, and the text projection changes value, so
      `node common/scripts/install-run-rush.js rebuild` **and** `install-run-rush.js test` pass
      repo-wide. `samples/testbed` pins MCP projections.
- [ ] `rushx fixlint` run; `change --verify --target-branch origin/integration/asks` passes.
- [ ] The `code-reviewer` agent run on your diff after the functional tests and before coverage
      closure, with its findings dispositioned in `result.md`.
- [ ] `/finalize-task` run: migrate to `.ai/tasks/completed/2026-10/mcp-round-2a/`, write the ledger
      entry (anticipating the merge; the orchestrator fills in the PR number), and make the
      capability-feed decision.

## Mechanics

- Work on branch `mcp-round-2a`, which already carries this brief. Push there. **Do not open a PR.**
- `rush` is not on PATH: use `node common/scripts/install-run-rush.js <cmd>` from the repo root.
- **Commit each step before running long gates**, and run every gate in the foreground. Push when the
  work is done, and confirm with `git log origin/mcp-round-2a -1`.
- Check-then-act windows: a close racing an in-flight call, a notification racing close, and the
  `DELETE` racing `client.close()`. List each `await` between a check and the act it guards in
  `result.md`, and say what re-checks after it.
- **Stop and surface**, with a final message of at most 300 words, if:
  - the SDK cannot send the `DELETE` without delaying close unboundedly;
  - `tools/list_changed` cannot be observed without replacing the SDK client;
  - the text-projection change breaks a consumer in a way that needs its owner's decision.

## Exit artifacts

- `state.md`: your working surface.
- `result.md`, covering:
  - what shipped, per ask;
  - each belief's verdict;
  - the block union, and the mapping from each SDK block type;
  - the check-then-act list;
  - the revert matrix;
  - the gate counts;
  - what this pre-empts or constrains for `mcp-round-2b`;
  - anything this brief got wrong.
