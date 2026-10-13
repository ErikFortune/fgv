# Result — `mcp-round-2a` (MCP fidelity and lifecycle)

Branch `mcp-round-2a`, cut from `integration/asks` @ `a6076e07`. Commits, in order:

| commit | what |
|---|---|
| `87de3380` | #674: terminate Streamable-HTTP sessions on close |
| `6b8949a0` | #676: descriptor `title` / `outputSchema`, `onToolsChanged` |
| `91131e23` | #675: rich tool results |
| `review fixes` | code-reviewer findings (see below) |
| `test pin` | the R4 revert-matrix row's test |

Package surface touched: `libraries/ts-extras-mcp` (source, tests, `etc/ts-extras-mcp.api.md`,
`CAPABILITIES.md`, `README.md`), three change files under `common/changes/@fgv/ts-extras-mcp/`, and
`docs/FUTURE.md`. Nothing in `ts-extras`, `ts-json-base` or `ts-utils` was edited.

## What shipped, per ask

### #674: terminate on close

- On an `'http'` session, `closeMcpSession` now calls the SDK transport's `terminateSession()`
  before `client.close()`.
- Termination is best-effort and bounded. It races a fixed `TERMINATE_TIMEOUT_MS = 2000`
  (`session.ts`, documented).
- The `client.close()` that follows the bound aborts a `DELETE` that is still pending, because the
  `DELETE` runs on the transport's own abort signal. Its later rejection is absorbed.
- A failure or an expired bound is logged once, at `detail`. The text goes through `errorText`, and
  then through `printable`, because a `StreamableHTTPError` message carries the server's HTTP reason
  phrase.
- At most one `DELETE` is sent per session, however many closes run, concurrent or sequential.
- Stdio and custom transports close exactly as before. This includes a custom transport that is
  itself a `StreamableHTTPClientTransport`, which a test pins.
- **Losing connect paths send no `DELETE`.** The `DELETE` has to come before the close, because
  closing aborts it. Sending one would therefore hold the close behind a server round trip, and #722
  keeps those closes unawaited.
  - A connect that lost before `initialize` was answered has no session id, so there is nothing to
    terminate.
  - A connect that lost after it (an abort or deadline during `notifications/initialized`) leaves
    the server's session to expire on the server's own idle timeout.
  - The `_connectWithin` TSDoc says so.

**Measured timings.** These come from `terminate.test.ts` on loopback. The assertions use a
`PROMPT_MS` of 1000 ms and a bound window of `[1950, 3000)` ms. Observed values were well inside
both.

| server's answer to the `DELETE` | close resolves | `onClose` |
|---|---|---|
| real SDK `StreamableHTTPServerTransport` (200, and `onsessionclosed` fires with the id) | < 1000 ms | once |
| 405 | < 1000 ms, nothing logged | once |
| never answers | ≥ 1950 ms and < 3000 ms; the held `DELETE` sees its connection closed | once |
| drops the connection | < 1000 ms, one `detail` line | once |
| 500 | < 1000 ms; `detail` called, `info`, `warn` and `error` not called | once |

### #676: descriptor fields and tool-list changes

- **`IMcpToolDescriptor.title?`** is the tool's own `title`, or else `annotations.title`. The SDK
  1.29 `ToolSchema` exposes both, so the fallback is used.
  - Each is taken only when it passes the package's `line` converter: `singleLine()` (non-empty, no
    `\p{Cc}`) plus a constraint that rejects U+2028 and U+2029.
  - A title that fails is dropped, never altered.
- **`IMcpToolDescriptor.outputSchema?`** is the raw JSON, carried verbatim and not parsed.
  - It is omitted, with the refusal logged at `info` in fixed text, when the value is not JSON or
    holds an own `__proto__` key.
- `_meta` stays out.
- **`connectMcpSession({ onToolsChanged })`**:
  - The handler is registered with `client.setNotificationHandler(ToolListChangedNotificationSchema,
    …)` before `connect`. It is registered only when the callback is supplied, so other sessions are
    unchanged.
  - The callback is contained by a shared `invokeContained`, which `onClose` now uses too: a throw,
    a rejection, and a thenable whose `then` throws are each logged at `error`, never propagated and
    never unhandled.
  - It does not re-list.
  - The closed check runs at delivery time.
  - **A notification that lands before the session is handed out is held.** It is then delivered
    once, on a `setTimeout(0)` after `arm`. That is after `connectMcpSession` has returned, so the
    callback can use the session handle. I chose this over dropping the notification, which would
    also have been defensible: a consumer cannot have listed before connect returned.
  - The SDK's `listChanged` client option was not used. It re-lists by itself, and it is set up
    only when the server advertises the capability.

### #675: rich results

- **The SDK's default `CallToolResultSchema` had to go.** Its `content` is a closed five-way zod
  union, so one unknown or malformed block rejects the whole `tools/call` response. "An unknown
  block never fails the call" cannot hold through it.
  - `callMcpTool` now passes the SDK's generic `ResultSchema` (`SDK_RAW_RESULT_SCHEMA` in `sdk.ts`),
    and this package validates the result itself.
  - The SDK still validates `structuredContent` against a cached `outputSchema`. That check runs in
    `Client.callTool` whatever result schema is passed.
- **`IMcpToolCallResult` gains `blocks` and `structuredContent?`.**
- **`callMcpTool` takes `IMcpCallToolOptions`**, which is `IMcpRequestOptions` plus
  `includeMediaData?`. `listMcpTools` keeps `IMcpRequestOptions`.
- **The text projection changes value.** This is flagged in the change file with a `BREAKING:`
  prefix and typed `minor`, because the surface has never been on `main`.
  - A `resource_link` projects to `[resource_link: <uri> (<name>)]`, or to `[resource_link: <uri>]`
    when it has no name.
  - An embedded text resource projects to its text.
- **The package does not follow links.** The TSDoc on `IMcpResourceLinkBlock`, the README and
  `CAPABILITIES.md` all say so.
- `docs/FUTURE.md`'s "Multimodal tool-result passthrough" entry is retired.
- `adaptMcpTools` still hands the model `content`.

## The block union and the SDK mapping

| SDK block (1.29 `ContentBlockSchema`) | `McpContentBlock` variant | required (else `unknown`) | optional (dropped if invalid) | projection |
|---|---|---|---|---|
| `text` | `IMcpTextBlock { text }` | `text`: string | — | its text |
| `resource_link` | `IMcpResourceLinkBlock` | `uri`: line | `name`, `title`, `mimeType`: line; `description`: string | `[resource_link: <uri> (<name>)]` |
| `resource` with `resource.text` | `IMcpEmbeddedTextResourceBlock { uri, mimeType?, text }` | `resource`: object; `uri`: line | `mimeType`: line | its text |
| `resource` with `resource.blob` | `IMcpEmbeddedBlobResourceBlock { uri, mimeType?, byteLength, data? }` | `uri`; `blob`: base64 | `mimeType` | `[resource block]` |
| `image` / `audio` | `IMcpImageBlock` / `IMcpAudioBlock { mimeType, byteLength, data? }` | `mimeType`: line; `data`: base64 | — | `[image block]` / `[audio block]` |
| any other type, or a missing or invalid required field | `IMcpUnknownBlock { blockType? }` | — | `blockType`: line, ≤ 64 characters | `[<blockType> block]` / `[unknown block]` |

How the edge cases are handled:

- **Base64.** The standard or URL-safe alphabet is accepted, with optional padding and no
  whitespace.
  - A length that is ≡ 1 mod 4 is malformed.
  - `byteLength` is ⌊unpadded × 3 / 4⌋.
  - `data` is carried only with `includeMediaData: true`, exactly as it was sent.
- **The SDK's own `Server`** refuses to send URL-safe base64; a non-SDK server can still send it.
- **Unreadable `content`.** `content` that is absent is `[]`. Content that is not an array, or
  cannot be read (a throwing index getter, a revoked Proxy), is `[{ type: 'unknown' }]`.
- **Unreadable blocks.** A block that cannot be inspected is `unknown`. If its `type` could be read,
  the block keeps `blockType`.
- **Dispatch.** Blocks are dispatched by a `switch` over the validated type, not by
  `discriminatedObject`. That function indexes its table with the server's string, so
  `type: "constructor"` would reach `Object` and throw. A test pins `constructor`, `toString`,
  `__proto__` and `hasOwnProperty`.

### The #723 and #721 lessons

- **No server string is echoed unvalidated.**
  - The projection uses only strings that passed `line`.
  - The converters' own failure messages quote the value (and `field` serializes the whole object),
    so they are never surfaced; only `.orDefault()` is used.
  - The refusal log lines are fixed text.
  - The termination log line is escaped with `printable`. That function is now shared from
    `request.ts` with the adapter's skip warning, which used to have its own private copy.
- **`__proto__`: refuse.** A `structuredContent` or `outputSchema` holding an own `__proto__` key at
  any depth is omitted whole and the refusal is logged. Block objects are not affected, because only
  their named fields are read.
  - **The refusal has a limit I could not close inside this stream.** The SDK parses `tools/list`
    with its own `ListToolsResultSchema`. A scratch run against 1.29.0 showed that parse **already
    drops** a `__proto__` key at an `outputSchema`'s top level, and among its `properties` names,
    before this package sees it. A key nested deeper survives the parse and is refused.
  - `inputSchema` has the same exposure, and it predates this stream: it still goes through plain
    `jsonValue`.
  - Closing both needs `tools/list` read with the generic schema. That would bypass the SDK's
    `cacheToolMetadata`, which feeds its `outputSchema` validation and task-required checks.
    **Proposed TECH_DEBT entry for the orchestrator** (`docs/TECH_DEBT.md` was outside this stream's
    surface).

## Belief verdicts (SDK `@modelcontextprotocol/sdk` 1.29.0, installed)

1. **Confirmed.** Source at `a6076e07` matched: `_projectContent` concatenated text, gave
   `[<type> block]` for everything else, and dropped `structuredContent`; `IMcpToolCallResult` was
   `{ content }`.
   - **But the claim is incomplete.** The SDK's default result schema failed the whole call before
     `_projectContent` ever ran for any block type outside its union. The old placeholder path was
     reachable only for well-formed known types.
2. **Confirmed.** `_toDescriptor` dropped `title`, `outputSchema` and `_meta`.
3. **Confirmed, with one correction.** `terminateSession()` exists
   (`client/streamableHttp.js:431`).
   - With no session id it returns without sending anything.
   - A 405 is treated as success.
   - Any other non-2xx status throws a `StreamableHTTPError`, after calling `onerror`.
   - **The correction:** the `DELETE` uses the transport's own abort signal. Against a server that
     never answers it hangs until `close()`, so the bound had to be enforced here.
4. **Confirmed.**
   - `Protocol.setNotificationHandler(schema, handler)` exists. Errors in the handler are caught and
     sent to `onerror`.
   - `McpServer` registers `tools: { listChanged: true }` (`server/mcp.js:64`) and calls
     `sendToolListChanged()` when a tool is added or changed after connect (`mcp.js:646`, `651`).
     The tests use that.
   - The SDK's own `listChanged` option (`client/index.js:120`) re-lists, and is gated on the
     capability. Not used.
5. **Confirmed.** `McpCloseWatcher` contained throws and rejections through `errorText`. That
   containment is now `invokeContained`, shared with `onToolsChanged`.
   - The brief's wording "a consumer callback that throws or rejects" is slightly off: the callback
     is the consumer's, and the watcher contains it.
6. **Confirmed.** `adaptMcpTools`' `execute` returns `called.content`, and still does.
7. **Confirmed.** `captureResult` is total and `classifySdkError` is total. The pre-aborted-signal
   refusal still happens before the transport is claimed. Neither property changed.

## Check-then-act windows

| window | check | `await`s between check and act | what re-checks after |
|---|---|---|---|
| close racing an in-flight call | none: a call may be made or in flight while `terminate()` runs | the `DELETE` (≤ 2 s), then `client.close()` | The SDK fails in-flight requests on close, after `onclose`, so they classify `not-connected`. **Accepted gap:** the server may fail an in-flight call when the `DELETE` lands, before the transport closes. That call then reports the server's answer (`protocol` / `session-expired`). Documented on `closeMcpSession`; not tested, because which answer comes back is the server's choice. |
| the `DELETE` racing `client.close()` | `_terminating` memo (one attempt per session) | `Promise.race([terminating, bound])` | The close always comes after the race settles. A `DELETE` still pending is aborted by that close, and its rejection is absorbed by the `.then` that mapped it to `{ failed }`. It is never logged twice (test R4). |
| concurrent closes | `_terminating ??=` with no `await` before the assignment | — | The second close awaits the same promise. `client.close()` runs twice and is idempotent (`Protocol.close` on an undefined transport). |
| notification racing close | `closeWatcher.closed` in `McpToolsChangedWatcher.notify` | the SDK's `Promise.resolve().then(handler)` microtask between receipt and our handler | The check runs inside the handler, at delivery. A late transport delivery after close is a no-op (test). |
| notification held before `arm` | `_pending` | `setTimeout(0)` | `notify()` runs again and re-checks `closed`. A close before the deferred delivery drops it (test). |
| notification during a failed connect | `_armed` false | — | Never armed, so nothing is scheduled and nothing fires. |
| a `DELETE` on an already-closed HTTP session | none, on purpose | — | `StreamableHTTPClientTransport` calls `onclose` only from its own `close()`, so an HTTP session's watcher closes only through `client.close()`, which runs after `terminate()`. See code-reviewer P2-2. |

## Revert matrix

Each protection was reverted on its own, in the compiled `lib/`, and the named suites were re-run.
The script is `revert.py` in the scratchpad; it is not committed. **20 of 20 go red.** R4 was green
on the first pass. That exposed that a successful `DELETE` clears the SDK's session id, so the memo
matters only after a failed `DELETE`. I added a test for that case, and R4 now goes red.

| row | protection reverted | tests that go red |
|---|---|---|
| R1 | `DELETE` before close | 7 (every `terminate.test` DELETE case, including the real SDK server's `onsessionclosed`) |
| R2 | 2 s bound | never answers; no-logger silent `DELETE` |
| R3 | HTTP kind only | custom `StreamableHTTPClientTransport` sends no `DELETE` |
| R4 | one attempt per session | after a failed `DELETE`, a second close makes no second attempt |
| R5 | failure logged at `detail` (mutated to `warn`) | logged at detail and never at warning or above |
| R6 | no delivery after close | late transport delivery; held notification dropped on close |
| R7 | pre-arm notification held | sent straight after `initialize` is delivered once |
| R8 | held notification deferred (mutated to synchronous) | delivered after the session is returned; dropped on close |
| R9 | throw contained | a throwing callback is contained and logged |
| R10 | title falls back to `annotations.title` | fallback; not-one-line dropped |
| R11 | title single-line | not-one-line dropped |
| R12 | `__proto__` refused | `outputSchema` nested `__proto__`; `structuredContent` top and nested; no-logger refusal |
| R13 | generic result schema (mutated back to the SDK default) | 12 (every hand-driven-peer block test, and the `structuredContent` wire tests) |
| R14 | media data opt-in | no data by default; audio and blob opt-in |
| R15 | decoded `byteLength` (mutated to `data.length`; fixture 12 characters vs 8 bytes) | 4 |
| R16 | `resource_link` projects URI and name | 5, including the adapted tool and the `isError` message |
| R17 | U+2028/U+2029 refused | forging projection; descriptor title |
| R18 | `blockType` ≤ 64 | forging projection (65 vs 64 `x`) |
| R19 | `blockType` kept when other fields are unreadable | a block that cannot be inspected |
| R20 | content-array read captured | throwing index getter and revoked Proxy |

## code-reviewer (layer 1)

The pass ran after the functional tests and before coverage closure. It found no P1.

| finding | disposition |
|---|---|
| P2-1: `toContentBlocks` read array elements outside the capture; a throwing index getter or a revoked Proxy rejected `callMcpTool` | **Fixed.** The whole read is captured. Two tests added (R20). |
| P2-2: `terminate()` does not skip an already-closed connection | **Not taken.** The scenario cannot happen: `StreamableHTTPClientTransport` calls `onclose` only from its own `close()` (`client/streamableHttp.js:286`). An HTTP session's watcher therefore closes only through `client.close()`, which follows `terminate()`. A guard would be an untestable branch. |
| P3-1: descriptor titles used bare `singleLine()`, which admits U+2028/U+2029 | **Fixed.** `line` is shared from `content.ts`. Test added (R17). |
| P3-2: the projection is still untrusted server text | **Fixed (docs).** `IMcpToolCallResult` TSDoc says so. No length cap: the requester caps at their own boundary, and the brief puts result-size caps out of scope. |
| P3-3: concurrent closes untested | **Fixed.** Test added. |
| P3-4: a call racing the `DELETE` window | **Accepted and documented** (check-then-act table). No "closing" flag: it would make `not-connected` arrive before the transport has actually closed, which contradicts the kind's documented meaning. |
| P3-5: real timers in the bound tests | **Kept.** The tests prove that a real `DELETE` is aborted by a real close, which fake timers would not exercise. Margins: 50 ms under, and 1000 ms over, the bound. |

## Gates

Each gate was graded by `grep -ci error` and `grep -ci warning` on its log, not by exit code.

| gate | errors | warnings |
|---|---|---|
| `rushx build` (ts-extras-mcp) | 0 | 0 |
| `rushx lint` (ts-extras-mcp) | 0 | 0 |
| `rushx test` (ts-extras-mcp): 100% statements, branches, functions and lines; 183 tests | 0 | 0 |
| `rushx fixlint` | run; no changes | — |
| `install-run-rush.js rebuild` (4 min 20 s) | 0 | 1: Rush's "Detected 1 Git-tracked symlinks" (`.agents/skills`, pre-existing); not a build warning |
| `install-run-rush.js test` (10 min 13 s, exit 0, no `fail` lines) | 0 | 1: the same symlink notice |
| `change --verify --target-branch origin/integration/asks` | 0 | 0 |

`samples/testbed` (`mcpProbe`) uses `listMcpTools` and `adaptMcpTools` only, and pins no call
projection. No other package imports `callMcpTool`.

## For `mcp-round-2b` (#672 guarded egress, #677 OAuth)

- **Resource links are the egress hook.** `IMcpResourceLinkBlock.uri` is the server-supplied URI
  that 2b's guard is for. This stream reports the URI and never fetches it. The TSDoc points
  consumers at a guarded fetch.
- **`closeMcpSession` now makes an HTTP request (the `DELETE`).** If 2b routes HTTP through a
  guarded `fetch`, or adds OAuth headers, the `DELETE` must take the same path. The SDK issues it with
  the transport's `_fetch` and `_commonHeaders()`, so a guard injected as the transport's `fetch`
  option, or an `authProvider`, covers it automatically. A 401 on the `DELETE` is logged at `detail`
  and does not fail the close, whereas an `UnauthorizedError` from the SDK's auth flow would be. 2b
  should decide whether termination may trigger an auth refresh. Today it cannot block the close
  for more than 2 s either way.
- **`McpSession` now carries the HTTP transport and the logger.** 2b's per-session state can live
  beside them.
- **`sdk.ts` gained `terminateHttpSession`, `onToolListChanged` and `SDK_RAW_RESULT_SCHEMA`.** It is
  still the single SDK import site.

## Open question for the orchestrator (not this stream's to decide)

- **Should `blocks` reach an ai-assist client tool's structured result?** `adaptMcpTools` returns
  `content`, a string, from `execute`. Carrying images to a model would need an ai-assist
  multimodal tool-result shape that does not exist today. That is an `@fgv/ts-extras` change, and
  its own stream.

## What the brief got wrong

- **Belief 1** missed that the SDK's result schema, not `_projectContent`, decided what survived. An
  unknown block failed the whole call at the SDK, so "unknown → `unknown` block" required replacing
  the result schema. The brief's acceptance line was not achievable as framed.
- **Belief 3** missed that the `DELETE` rides the transport's own abort signal. The bound therefore
  has to come from this package, and the close is what cancels the request.
- **"Refuse or flag `__proto__`"** is only partly achievable for `outputSchema`, because the SDK's
  list parse drops some such keys first. See the limit above.
- **The brief's `blocks` shape** puts `name?` on `resource_link`. MCP requires `name`, but keeping it
  optional lets a link with an invalid name survive with its URI, which is the requester's minimum
  bar. Kept as the brief specified.
