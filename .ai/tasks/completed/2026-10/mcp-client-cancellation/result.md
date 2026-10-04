# Result — `mcp-client-cancellation`

**Shipped:** an MCP tool call is now cancellable and classifiable — `callMcpTool` / `listMcpTools`
take a timeout, an `AbortSignal` and a progress callback; every failure carries a total
`McpFailureReason`; a session's close is observable through `onClose`; consumers can drive a
session against an in-process server through `createCustomTransport`; and `IAiClientTool.execute`
receives the turn's signal, which the MCP adapter forwards, so aborting a turn cancels the MCP
request on the server.

Branch `mcp-client-cancellation`, from `integration/asks`. Packages: `@fgv/ts-extras-mcp`,
`@fgv/ts-extras` (ai-assist).

## What shipped, per step

| step | ask | commit | what |
|---|---|---|---|
| 1 | personaility#678 | `7873d86b` | `createCustomTransport(t: IMcpSdkTransport): IMcpTransport`, `McpTransportKind` (+`'custom'`). The e2e suite drives the in-memory server through it; the internal-class import is gone. `docs/FUTURE.md` entry retired. |
| 2 | personaility#673 | `94c04327` | `McpFailureReason`; `connectMcpSession` / `listMcpTools` / `callMcpTool` / `adaptMcpTools` return `DetailedResult<T, McpFailureReason>`; total classifier `classifySdkError` in `sdk.ts`; `onClose` on `connectMcpSession` (`McpCloseWatcher`). |
| 3 | personaility#671 | `cee54a20` | `IMcpRequestOptions { timeoutMs, signal, onProgress, resetTimeoutOnProgress, maxTotalTimeoutMs }` on `callMcpTool` / `listMcpTools`; `timeoutMs` / `signal` on `connectMcpSession`. All applied by one helper, `request.ts` `runSdkRequest`. |
| 4 | personaility#684 | `6478fe28` | `IAiClientTool.execute(args, context?: IAiClientToolExecuteContext)`; `executeClientToolTurn` passes `{ signal }`; the MCP adapter forwards it to `callMcpTool`. |
| — | docs | `626e950c` | `CAPABILITIES.md` (both packages), `README.md`, change files. |
| — | review | `b8a120c4` | `code-reviewer` findings (below). |

Seam choice (step 1): **accept a pre-built SDK transport**, not `createInMemoryTransportPair`. The
pair's server half must be an SDK `Transport` for `server.connect` to accept it without a cast, so
that shape would have to *name* the SDK type in its public return — it leaks more, not less. The
structural three-method `IMcpSdkTransport` names no SDK type (method-parameter bivariance admits the
SDK's `send(message: JSONRPCMessage)`), and admits transports the package never wrapped (legacy
SSE, WebSocket, a consumer's own).

Close-observation choice (step 2): **an `onClose` callback**, not a status read. A pool needs to
learn of the close when it happens; a status read is derivable from the callback, not the reverse.

## The failure vocabulary and its SDK mapping

`McpFailureReason` is a closed `kind` union with per-kind payload, following the
`SaferFetch.FetchFailureReason` precedent. It is the `detail` of every `DetailedResult` the package
returns. Classification keys on error class, JSON-RPC code, HTTP status, the session's observed
close and the identity of our own abort reason — never message text.

| kind | produced by (SDK 1.29.0) |
|---|---|
| `tool-error` | `CallToolResult.isError: true`. Message = the tool's text, unprefixed. |
| `timeout` | `McpError` `-32001` (`RequestTimeout`) — the SDK's `timeout` and `maxTotalTimeout`. |
| `aborted` | The SDK rejected with **this call's** abort reason (identity), or the signal was already aborted when the call was made. |
| `not-connected` | Session's close observed: SDK `ConnectionClosed` (`-32000`) or untyped `Error('Not connected')`, both raised only after `onclose` fires (`protocol.js` `_onclose` calls `this.onclose?.()` before failing the response handlers). During the handshake, `-32000`. |
| `session-expired` | `StreamableHTTPError` 404 on an established session. |
| `unauthorized` | HTTP 401/403 (`StreamableHTTPError` / `SseError`, carries `status`), or `UnauthorizedError`. |
| `protocol` | Any other `McpError` (carries `code`), including a server's own `-32000` on an open session; or a response that failed the SDK's result schema (`$ZodError` / `ZodError`, no `code`). |
| `transport` | Catch-all: other HTTP statuses (carries `status` when ≥ 100), fetch / child-process I/O failures, any other untyped throw — including the handshake's plain-`Error` protocol-version refusal. |
| `invalid-handle` | A session/transport handle not produced by this package. |

**`unauthorized` ships now**, not in the OAuth stream: it has a producer today. A static bearer
token refused by the server yields `StreamableHTTPError(401)` (the transport raises
`UnauthorizedError` only when an `authProvider` is configured, which this package never does) —
proven against a real loopback HTTP server. #677 adds an `authProvider` and reuses the kind
unchanged; `UnauthorizedError` is already mapped.

**The fallback is `transport`, not `unknown`.** This deviates from `FetchFailureReason`, whose
catch-all is `unknown`. Reasoning: every failure the SDK *diagnoses* arrives typed (an `McpError`,
an HTTP-status error, `UnauthorizedError`, a schema error); what arrives untyped comes from beneath
the protocol (fetch, the socket, the child process), and the consumer's action for it is the same
as for a transport failure — treat the session as suspect. The one known non-transport member of the
residue is the handshake's protocol-version refusal, documented in the TSDoc.

**Two SDK limits stated in the TSDoc.** A server answering with the SDK's reserved `-32001` is
indistinguishable from the SDK's own timeout. And the `maxTotalTimeoutMs` cap, when it trips inside
`_onprogress`, fails the request without sending `notifications/cancelled`.

## Each belief's verdict

1. **Partly wrong.** `callMcpTool(session, name, args)` with no options at `operations.ts:159`, and
   the narrowed `ISdkClient` declaring no request options — **right**. `RequestOptions` on
   `callTool`, `listTools` and `connect` — **right**: `callTool(params, resultSchema?, options?)`
   (the options are the *third* argument, after a result schema), `listTools(params?, options?)`,
   `connect(transport, options?)` (`client/index.d.ts` l.155, 431, 539). The fields are `onprogress`,
   `signal`, `timeout`, `resetTimeoutOnProgress`, `maxTotalTimeout`, plus task fields.
   `DEFAULT_REQUEST_TIMEOUT_MSEC = 60000` (`shared/protocol.d.ts` l.57) — the requester's 60 s is
   right. **What the brief did not know:** the SDK reports an abort *as a timeout*. `cancel(reason)`
   wraps any non-`McpError` reason in `new McpError(ErrorCode.RequestTimeout, String(reason))`
   (`protocol.js` ~l.685). A classifier keyed on the code reports every abort as `timeout`; this is
   why `aborted` is decided by identity.
2. **Right.** Transport failures were prefixed `callMcpTool '<name>':`; `isError` text unprefixed
   (`withErrorFormat` wrapped only the capture). Both behaviours are kept; the prefix is no longer
   the only signal.
3. **Right, with a correction.** `closeMcpSession` called only `client.close()`. `onclose` and
   `onerror` exist on `Protocol` (`protocol.d.ts` l.251, 257). Two facts matter for the design: the
   SDK calls `onclose` *before* failing in-flight requests, so a throwing consumer callback would
   leave them unsettled forever (hence containment); and `Client.connect` runs `void this.close()`
   on any handshake failure, so `onclose` fires for a failed connect (hence arm-after-success).
4. **Right.** `fromHandle` accepted only `instanceof McpTransport`; the e2e test imported the
   internal class; `docs/FUTURE.md` recorded the gap.
5. **Right, with a correction.** `execute` at `toolTypes.ts:185`, one call site at
   `clientToolContinuationBuilder.ts:953` with `signal` in scope. The widening is additive for
   implementers *and* for callers holding `execute` as a one-parameter function type. ~14
   implementers confirmed by grep (four `ts-agent-tasks` tool files, `ts-agent-memory`
   `memoryTools.ts`, the MCP adapter, seven `samples/testbed` scenarios plus test doubles); none
   changed and the repo-wide rebuild is green. **Correction:** the new type also had to be
   re-exported through `ai-assist/model.ts` and `ai-assist/index.ts`, two files outside the brief's
   surface list (one line each).

Brief claim outside the numbered list: the precedent "`ts-extras-system-one`, on
`integration/system-one-decisions` … a `SystemOneFailureReason` union plus a total classifier" does
not exist as code. That branch holds only the design (`docs/design/system-one-decisions/design.md`
§ `SystemOneFailureReason`, a flat string list). The code precedent used is
`ts-extras/src/packlets/safer-fetch/failureReason.ts`.

## Check-then-act list

Every `await` between a check and the act it guards, and what re-checks after it.

| where | check | await in between | act | what makes it safe |
|---|---|---|---|---|
| `request.ts` `runSdkRequest` | `callerSignal.aborted` | none — listener attached synchronously after | link listener → SDK request | An abort after the check fires the listener; an abort landing before the SDK's `request()` runs is caught by the SDK's own `throwIfAborted()` inside its executor, which rejects with our reason. |
| `request.ts` | (classification) | `await` of the SDK request | `aborted` vs other | No re-read of `signal.aborted`. `aborted` iff the SDK rejected with this call's reason object — the SDK's settlement order decides. Revert R1 shows a re-read misreports a timeout followed one microtask later by an abort. |
| `request.ts` | listener removed in `finally` | settle → `finally` microtasks | — | An abort in that window makes the SDK send a redundant `notifications/cancelled` for a finished request; the spec lets servers ignore it. Commented. |
| `operations.ts` `_classify` | `closeWatcher.closed` | none after the rejection | `not-connected` | The SDK sets `onclose` → watcher before rejecting in-flight requests, so the flag is already true for any close-caused failure. |
| `session.ts` `connectMcpSession` | watcher attached to `client.onclose` | `await` handshake | `closed` check, `signal.aborted` check, `arm(onClose)` | All three run synchronously after the handshake's `await`, so no close can land between check and arm. A close during the handshake → `not-connected`, callback never armed. |
| `session.ts` | `signal.aborted` after handshake success | `await client.close()` | return `aborted` | The abort landed after `initialize` answered but before the SDK returned (it awaits `notifications/initialized`), so the SDK cancelled nothing. We close what it opened; the watcher is unarmed, so `onClose` does not fire. Nothing acts after the close's `await`. |
| `McpCloseWatcher.notifyClosed` | `_closed` | none | call listener | Exactly once; a throw is contained (`captureResult`) and logged. An `async` listener's rejection is not observed — documented. |
| `listMcpTools` | per page | `await` per page | next page | Each page runs through `runSdkRequest`, so the caller's signal is re-linked per page: an abort during a page cancels it, and an abort landing after a page settled is caught by the next page's pre-check without sending. Either way no further page is requested (tested for the in-flight case; the between-pages case is the same pre-check R3 pins). |

## Revert matrix

Each protection reverted alone (scripted: edit, `rushx test`, restore), with the tests that went red.
Fixture values were chosen so the right and wrong answers differ — e.g. the race test aborts one
microtask *after* the timeout settled, the -32000 test uses a live session that must stay usable,
the 404 tests run the same status through both phases.

| # | protection reverted | red tests |
|---|---|---|
| R1 | abort by identity → re-read `signal.aborted` | `an abort that lands after the timeout has settled the request is still timeout` |
| R2 | per-call controller → caller signal straight to SDK | `aborting an in-flight call returns aborted promptly…`, `an abort during the handshake fails aborted`, `aborting the turn cancels the in-flight MCP request on the server`, listener-removal test |
| R3 | pre-aborted check | `a signal already aborted fails aborted without sending anything`, `…without starting the handshake` |
| R4 | `-32001` → `timeout` | 7: classifier unit, `timeoutMs fails timeout — not transport, not aborted…`, timeout+signal, timeout-then-abort race, progress-without-reset, `maxTotalTimeoutMs`, connect timeout |
| R5 | `isError` text unprefixed | 2 mocked, `a tool's isError result is tool-error, with the tool's text verbatim…`, **`a tool's isError text reaches the model verbatim`** (executeClientToolTurn level) |
| R6 | throwing `onClose` contained | both containment tests (the in-flight call no longer settles) |
| R7 | close-during-handshake check | `fails not-connected, and never reports the close, when the connection closes during the handshake` |
| R8 | untyped error on closed session → `not-connected` | classifier unit, `a call on a closed session is not-connected, not transport` |
| R9 | `-32000` decided by observed close | classifier unit, `a server -32000 on an open session is protocol, and the session stays usable` |
| R10 | 404 → `session-expired` only once a session exists | classifier unit, `a 404 during the handshake is transport` (real HTTP) |
| R11 | caller listener removed on settle | `the listener on the caller signal is removed once the call settles` |
| R12 | adapter forwards the turn signal | `aborting the turn cancels the in-flight MCP request on the server` |
| R13 | abort after `initialize` answered | `an abort landing after the handshake answered fails aborted, closes the client…` |
| R14 | schema rejection by both zod class names | classifier unit, `a malformed tools/call result is protocol, with no code` (real peer) |
| R15 | builder passes `{ signal }` (ts-extras) | `the turn's signal reaches execute — the same object, not a copy` |
| R16 | `listMcpTools` forwards its options | `listMcpTools honours timeoutMs`, `an abort during pagination fails aborted and requests no further page` |

R14 is not hypothetical: the first implementation matched only `'ZodError'`, and the real-peer test
caught that the installed zod 4 core names its error `'$ZodError'`.

## Load-bearing acceptance, and the test that proves each

- **Total classification; `timeout` / `aborted` never `transport`.** `classifySdkError` ends in an
  unconditional `transport` return, so every value has a kind; the "is total" unit test feeds a
  string and `undefined`. `timeoutMs fails timeout — not transport, not aborted` and the abort tests
  assert exact details against a real server.
- **`isError` text reaches the model verbatim.** `clientToolTurn.test.ts` drives
  `executeClientToolTurn` with a real adapted MCP tool and asserts the `client-tool-result` is exactly
  `refuses (callId=…): <server text>`, with a fixture containing quotes, a newline and a colon.
- **An aborted turn aborts the in-flight request end to end.** Same file: the server's handler
  observes `extra.signal` abort with reason `request aborted by the caller`, well under the 60 s
  default.

## code-reviewer pass (after functional tests, before coverage closure)

No P1. Findings and dispositions:

- **P2 — server `-32000` reported `not-connected`.** Fixed: decided by observed close (R9).
- **P2 — schema-rejected responses reported `transport` while TSDoc said `protocol`.** Fixed by
  class name (R14); TSDoc now states the protocol-version refusal is `transport`.
- **P3 — `maxTotalTimeoutMs` sends no cancellation.** TSDoc exception added.
- **P3 — abort after `initialize` answered still returned a live session.** Fixed (R13).
- **P3 — late abort sends a redundant cancellation.** Benign per spec; commented.
- **P3 — `async` `onClose` rejection escapes.** Documented rather than wrapped: wrapping would defer
  the callback past the SDK's failure of in-flight requests.
- **P3 — remap dropped `transport.status` on a closed session.** Resolved by the -32000 fix: only
  the untyped residue is remapped; HTTP-status classifications keep their status (unit-tested).
- **P3 — tests.** Listener-removal test now asserts the identical function; real-server connect
  timeout/abort tests assert `onClose` never fires. The ts-extras `if (result.isFailure()) return;`
  after `toSucceed()` style matches the surrounding file; kept.

## Gate-time review (orchestrator's independent pass)

No P1. Every finding applied, in `332c5f58`.

- **P2 — `connectMcpSession` could hang.** Confirmed against SDK 1.29.0 `client/index.js`
  ~285–321: `Client.connect` awaits `transport.start()` and then
  `this.notification('notifications/initialized')` outside the request options it passes to
  `initialize`. Over Streamable HTTP that notification is a fetch POST whose only signal is the
  transport's own controller. **Fix:** `_connectWithin` (`session.ts`) races the whole SDK connect
  against the per-call abort (rejecting with the per-call abort reason, so `aborted` still comes from
  identity) and a `timeoutMs` deadline (SDK default 60 000 when omitted, rejecting with the SDK's own
  timeout `McpError`). Losing closes the client, which aborts the transport's in-flight fetch. The
  close watcher is unarmed at that point, so `onClose` is not called. The post-settle abort check
  is kept for an abort that lands after the race resolved but before the session is handed out.
  **Tests:** `httpFailures.test.ts` gains a real loopback server that answers `initialize` and
  never answers the `notifications/initialized` POST. With `timeoutMs: 150` the connect fails
  `timeout`; with an abort at 100 ms it fails `aborted`. Both settle in under 5 s, the server
  observes its held POST closed (the fetch was aborted), and `onClose` never fires. Revert rows R17,
  R18.
- **P3-1 — `ae-unresolved-link`.** Neither `{@link AiAssist.IAiClientTool}` nor
  `{@link IAiClientTool}` resolves inside the `AiAssist` namespace: both produce a new warning,
  which I checked by building each. The reference is now a code span (`IAiClientTool.execute`).
  `etc/ts-extras.api.md`'s warnings are identical to base (diffed `sort | uniq -c` of every
  `Warning:` line: 383 = 383).
- **P3-2 — timeout validation.** `timeoutMs` and `maxTotalTimeoutMs` must be positive, finite and
  ≤ 2³¹−1, or the call fails before anything is sent. No existing kind fit — `protocol` is the
  server's, `invalid-handle` is about handles — so a new kind, **`invalid-options`**, was added.
  `Infinity`, `0`, negatives, `NaN` and `2³¹` are refused on call, list and connect; `2³¹−1` is
  accepted. On connect the check runs before the handle is claimed, so a bad option does not burn
  the transport. Revert row R19.
- **P3-3 — single-use transports.** `McpTransport.claim()` marks a handle consumed at connect;
  reuse fails `invalid-handle` before a client is built or the transport touched. A failed connect
  still consumes it, because the SDK may have started and closed the transport. `createCustomTransport`
  now returns `Result<IMcpTransport>` and refuses a transport whose `sessionId` is set (detectable:
  `sessionId` was added to the structural `IMcpSdkTransport`). The TSDoc on `createCustomTransport`
  and `IMcpSdkTransport` states both runtime obligations: no pre-set `sessionId` (the SDK would skip
  `initialize`), and `close()` must call `onclose`. Tests cover a mocked double connect, a
  failed-then-reused handle, a real in-memory double connect asserting `start` ran once, and the
  `sessionId` refusal. Revert rows R20, R21.
- **P3-4 — `-32000` during the handshake.** The `McpFailureReason` table now says any `-32000`
  during the handshake is `not-connected`, whoever raised it. `CAPABILITIES.md` says the same.
- **P3-5 — method signature.** `IAiClientTool.execute` is now
  `execute(args, context?): Promise<Result<unknown>>`. Two test sites in `ts-extras-mcp` read
  `execute` unbound (a lint hazard once it is a method) and now wrap it in an arrow. Every
  implementer compiles: the repo-wide rebuild is green (see `state.md` § Gates).

## What this pre-empts for the other MCP asks

- **#677 OAuth** — `unauthorized` (with `status`) and the `UnauthorizedError` mapping already exist;
  the stream adds an `authProvider` to `createHttpTransport` and no kind.
- **#674 terminate-on-close** — `closeMcpSession` and `onClose` are where a `DELETE` of the HTTP
  session would hang; `session-expired` already names the server-side expiry it would avoid.
- **#672 egress** — `createCustomTransport` admits an SDK transport built over a guarded fetch
  (`StreamableHTTPClientTransport`'s `fetch` option) without a new seam; the safer-fetch primitive is
  still needed.
- **#675 rich results** — `tool-error` is defined by `isError`, independent of content projection;
  a richer projection does not reshape the vocabulary.
- **#676 descriptors** — none.

## Gate counts

See `state.md` § Gates.

## What the brief got wrong

- Belief 1 missed that the SDK reports an abort with the timeout code — the single fact the whole
  `aborted` design rests on.
- The `ts-extras-system-one` precedent is a design doc, not code.
- The ai-assist surface needed two barrel files beyond the two named.
- The orchestrator's lean (`createInMemoryTransportPair`) leaks more of the SDK than the
  alternative, for the reason above.

## Deviation: four tests use a mocked client

The brief asks that steps 2–4 be tested against a real in-process server. Four tests are not: R7's
(a close landing inside the handshake), R13's (an abort landing after `initialize` answered but
before `connect` returned) and R5's two mocked `isError` projections. The first two stage an
interleaving inside the SDK's `connect` that a real server cannot produce deterministically; the
mocked client is the only way to put the event in that window. Every other step 2–4 protection has
a real-server test, and R5 also has the two real ones (`failures` and the `executeClientToolTurn`
level).
