# Result: `mcp-task-support-and-bounds`

**Shipped:** MCP tools that require task execution are skipped by `adaptMcpTools` with a structured `kind`, every skip says why in a closed `McpSkipKind`, a paged `listMcpTools` can be bounded by page count and total time, and a guarded fetch can cap the bytes a response delivers — each bound opt-in, and each failing loudly rather than truncating.

Resolves personaility#689 and personaility#690. Base `integration/asks`; PR #TBD.

## What shipped, per brief decision

1. **#689 task support.**
   - `IMcpToolDescriptor.execution?: IMcpToolExecution`, `{ taskSupport?: McpTaskSupport }`, with
     `McpTaskSupport = 'forbidden' | 'optional' | 'required'` — the SDK's own vocabulary (verified in
     `@modelcontextprotocol/sdk@1.29.0`'s `ToolExecutionSchema`).
   - Read with `Converters.jsonObject` and `Converters.enumeratedValue`, never a cast. A non-object
     blob or an unknown value is dropped and logged at `info` in fixed text; an `execution` with no
     `taskSupport` is dropped silently. See Deviations 1 for what the SDK does first.
   - `adaptMcpTools` skips a `'required'` tool, checked before the schema, with `kind: 'task-support'`
     and the declared schema. `'optional'`, `'forbidden'` and undeclared tools are adapted.
2. **Skip discriminator.** `IMcpSkippedTool.kind: McpSkipKind`, `'schema' | 'wire' | 'task-support'`,
   declared once in `model.ts`. `'wire'` is distinguishable today — the keyword-table admission is
   a separate step from the `fromJson` parse — so it is used. `reason` and `schema` are kept. Change
   file `minor`, `BREAKING:`.
3. **#690 egress bound.** `IGuardedFetchOptions.maxResponseBytes?` — opt-in, no default — is out of
   the refused set. A declared `Content-Length` over it rejects the call with a `'too-large'`
   `GuardedFetchError` (`bytesRead: 0`) and releases the body. Any other body is returned wrapped in
   a counting `ReadableStream` (`highWaterMark: 0`, so nothing is read ahead: the guarded fetch still
   never reads the body itself). Once the decoded count passes the cap, the stream cancels the upstream
   and then errors with a `'too-large'` `GuardedFetchError` whose message names `maxResponseBytes` and
   the limit. The browser barrel re-exports the same `createGuardedFetch`, so it carries the change
   with no edit. The refusal message and the TSDoc no longer claim the option is unsupported.
4. **#690 discovery bounds.** `IListMcpToolsOptions extends IMcpRequestOptions` adds `maxPages?` and
   `maxTotalMs?`, no defaults. Exceeding either fails with the new `'limit-exceeded'`
   `McpFailureReason`, `{ limit: 'maxPages' | 'maxTotalMs' }`, and the pages already read are discarded.
   `maxTotalMs` is validated with the existing `validateTimeoutMs` (positive, finite, ≤ 2³¹−1);
   `maxPages` must be a positive integer. Both fail as `'invalid-options'` before anything is sent.
   `adaptMcpTools` forwards them through a new `discovery?: IListMcpToolsOptions`.
5. **Docs.** `ts-extras-mcp` `CAPABILITIES.md` and `README.md`; `ts-extras` `CAPABILITIES.md`
   (safer-fetch; its README does not describe `createGuardedFetch`, so it is unchanged). Change files
   for `@fgv/ts-extras-mcp` (`minor`, `BREAKING:`), `@fgv/ts-extras` (`minor`) and `@fgv/testbed`
   (`none`).

## Why `'limit-exceeded'` is a new kind

- Not `'timeout'`. That kind means the SDK's per-request timeout (or a guarded fetch's headers
  deadline), and its consumer guidance is "the session is usable, retry may help". A page-count cap
  has no timeout analogue at all, and a total-time cap the caller set is a policy, not a slow request.
  Folding it into `'timeout'` would leave a caller unable to tell its own bound from the server's
  slowness — which is exactly what #690's interim stopgaps need to tell apart.
- Not `'invalid-options'`. That kind is a caller bug reported before anything is sent; this happens
  part-way through a valid listing.
- One kind, with the bound named in `limit`, rather than two kinds: a caller's reaction (the server is
  over a limit I set) is the same for both, and `limit` keeps them distinguishable.

## Where each limit is checked, and what happens part-way

| limit | checked at | when exceeded |
|---|---|---|
| `maxResponseBytes` | `createGuardedFetch` → `_validMaxResponseBytes` | not positive and finite: creation fails (`unknown` outcome → `Failure`) |
| `maxResponseBytes` | `_capBody`, on the final response's head, after the response-headers guard | declared `Content-Length` > cap: the call rejects with `GuardedFetchError` `'too-large'` (`bytesRead: 0`, `declared`), and the body is cancelled unread |
| `maxResponseBytes` | `_countingBody` `pull`, once per chunk the consumer asks for | count > cap: chunks already delivered stay delivered (≤ cap bytes in total); the crossing chunk is withheld; the upstream is cancelled (releasing the connection); then the stream errors with `'too-large'` (`bytesRead` includes the crossing chunk). Through MCP, the SDK's read fails and the request is `egress-blocked` / `'too-large'`, for an SSE or a JSON answer alike (pinned in `egress.test.ts`) |
| `maxPages`, `maxTotalMs` | `listMcpTools` → `_validateListingBounds`, before the deadline exists or any page is sent | `'invalid-options'`, nothing sent |
| `maxPages` | `_listPages`, after each page's tools are accumulated | page `maxPages` still carries a `nextCursor`: fail `'limit-exceeded'` / `maxPages`; no further page is requested; accumulated tools discarded. Exactly `maxPages` pages succeed |
| `maxTotalMs` | `_ListingDeadline` timer, on the signal every page is sent with | fires during a page: the page is aborted (the SDK sends `notifications/cancelled`; pinned), and its `'aborted'` failure is reported as `'limit-exceeded'` / `maxTotalMs` |
| `maxTotalMs` | `runSdkRequest`'s pre-send aborted check, before each page | fired between pages: the next page is never sent, and the failure is reported as `'limit-exceeded'` / `maxTotalMs` (pinned with a fake client whose page settles late) |
| `maxTotalMs` | — | a page that settled before the timer fired is kept; a listing whose last page settled first succeeds. A caller's abort that lands first stays `'aborted'`, and a page's own `timeoutMs` that fires first stays `'timeout'` — the deadline signal is `AbortSignal.any([caller, expiry])`, so the first abort's reason decides |

## Evidence tests

All in `libraries/ts-extras/src/test/unit/safer-fetch/guardedFetch.test.ts` and
`libraries/ts-extras-mcp/src/test/unit/bounds.test.ts` unless noted.

- Real streaming server, body over `maxResponseBytes`, stream errors **before the whole body is
  delivered**: `maxResponseBytes errors the body before the whole of it is delivered, and releases the
  connection`. The server holds back its last 7 KiB until the test calls `finish`, which it never
  does; the test also waits for the server to see the client close.
- Body exactly at the limit passes: `maxResponseBytes delivers a body of exactly the cap whole,
  keeping the url` (real server) and `a body of exactly the cap is delivered whole` (mock).
- Server pages forever, `maxPages` stops it: `maxPages stops a server that pages forever, after exactly
  maxPages requests` (real in-memory MCP server).
- Slow pager trips `maxTotalMs`: `maxTotalMs stops a slow pager, aborting the page in flight` (real
  server; also asserts the server saw the cancellation).
- `taskSupport: 'required'` skipped with `kind: 'task-support'`, `'optional'` adapted: `adaptMcpTools
  skips a 'required' tool with kind 'task-support', and adapts 'optional' and the rest`, plus `an
  adapted 'optional' tool is called normally` and `a required tool fails every plain call — which is
  why adaptMcpTools skips it` (`protocol`, `-32600`).

**Seen red before the fix.** Each was run against a deliberately reverted mutation of the source,
then the source was restored (`git status` clean of the mutation afterwards):

- Cap disabled (`_capBody` bypassed): five guardedFetch tests red — the real-server "errors before the
  whole body" and "declared Content-Length" tests, and the mock "withheld chunk", "lying
  Content-Length" and "Content-Length over the cap" tests.
- Off-by-one (`total >= limit`): both "exactly the cap" tests red (real server and mock).
- `maxPages` check disabled, deadline remap inverted, `'required'` check disabled: seven `bounds.test.ts`
  tests red — the `maxPages` forever-pager test, the `maxTotalMs` slow-pager test, the `'task-support'`
  skip test, the `adaptMcpTools` discovery-forwarding test, and the three caller-abort / per-page
  timeout tests that pin the deadline's classification.

The pre-existing fixtures that pinned the old skip shape (`shapes.test.ts` ×2, and by type the
`samples/testbed` probe test) went red on the widened `IMcpSkippedTool` as expected and were updated.

## Deviations from the brief

1. **An unknown `taskSupport` fails discovery through the real SDK.** The SDK parses every
   `tools/list` page against its own schema, whose `taskSupport` is a closed enum, so an unknown value
   fails the page as `protocol` before this package sees it (pinned: `task support outside the
   vocabulary`). The package's drop-and-log path is implemented and tested, but is reachable only for
   values that get past the SDK. Making it reachable would mean reading `tools/list` with the SDK's
   raw result schema, as `callMcpTool` does, and that would also skip the SDK's `cacheToolMetadata`,
   which feeds the `outputSchema` validation `callMcpTool` relies on and the SDK's own task-required
   guard. I did not do that; it is a design call for the orchestrator. Documented on the field's TSDoc
   and in `CAPABILITIES.md`.
2. **`adaptMcpTools` forwards a nested `discovery?: IListMcpToolsOptions`**, not two flat fields. It is
   a superset: it carries both bounds and, with them, discovery's `timeoutMs` and `signal`, which had
   no way in before.
3. **`maxPages` must be a positive integer**, stricter than the brief's "positive and finite".
4. **`samples/testbed` is touched**, outside the declared package surface. Its test constructs
   `IMcpSkippedTool` literals, which the required `kind` breaks; the probe also prints each skip's kind
   now, because its section header claimed every skip was a schema-subset skip.
5. **`GuardedFetchError`'s message changes for `'too-large'`** (it names `maxResponseBytes` and the
   limit), so that the failure is identifiable from a body-read error. Every other kind's message is
   unchanged.

## Observations for the orchestrator (not acted on)

- **SDK `cacheToolMetadata` is per page.** `client.listTools` clears and refills its output-schema
  validators and task-required set on every call, so after a multi-page `listMcpTools` the SDK knows
  only the last page's tools. A tool on an earlier page with an `outputSchema` is then called without
  the SDK's structured-content check, and a task-required tool on an earlier page is not refused by the
  SDK's guard (`adaptMcpTools` now skips it either way). Pre-existing; not in this stream's scope.
- **`maxResponseBytes` is per HTTP response.** Over MCP that includes the standalone `GET` event
  stream, which lives for the session, so its total over the session counts against the cap.
  Documented in both READMEs/CAPABILITIES; a per-message bound would need SSE parsing and is not
  offered.
- **`tools/list_changed` rate bound** (#690's third bullet) is not addressed: the issue says any one of
  its options closes it, and the brief did not ask for it.

## Inline review (code-reviewer rubric, applied by the author — not independent)

- P1: none found. No `any`; converters for the execution blob; all fallible paths return `Result`.
- P2, dispositioned: `_adaptOne` has two sequential `isFailure` checks. Kept: each maps to a
  different skip kind, and chaining with `withFailureDetail` leaves the detail typed optional, which
  would need a fallback branch that can never run.
- P2, applied: the deadline originally re-linked the caller's signal by hand with `?.` reads that left
  dead branches; replaced with `AbortSignal.any`, and the failure remap reads only `deadline?.expired`.
- P2, applied: the skip warning's wording no longer says "inputSchema cannot be adapted" for a
  task-support skip.
- P3: the log line for a dropped `execution` blob does not name the tool, matching the existing fixed-
  text convention for server-supplied values.

## Gates

See the gate section appended below after the run.
