# Brief: `mcp-round-2b` (guarded MCP egress and OAuth)

**Orchestrator-owned. Frozen at kickoff.** Put questions and disagreements in `state.md`, and leave
this file unchanged.

**Origin:** two PersonAIlity `fgv-ask`s, triaged in
`.ai/tasks/active/personality-asks-2026-10/followups.md` (entries 12 and 11). Read each inbox file
under `.ai/tasks/completed/2026-10/personality-intake/findings/inbox/`, not only the issue:

| entry | ask | inbox slug |
|---|---|---|
| 12 | personaility#672: a guarded, non-buffering fetch for `createHttpTransport` (requester's P1) | `2026-10-01-0042-mcp-http-fetch-address-guard` |
| 11 | personaility#677: OAuth `authProvider` passthrough, and an `unauthorized` kind that carries the resource-metadata URL (P2) | `2026-10-01-0043-mcp-oauth-auth-provider` |

**Workflow shape:** `stream`. Branch `mcp-round-2b`, cut from `integration/asks` at `42b5822b`. That
base carries #722, #723 and #728 (`mcp-round-2a`). The PR goes onto `integration/asks`.

**Read `mcp-round-2a`'s handoff before anything else.** It is the section "For `mcp-round-2b`" in
`.ai/tasks/completed/2026-10/mcp-round-2a/result.md`. It names the `DELETE` on close as an HTTP
request your egress and auth changes must also cover.

**This is a security boundary, and part of it is an authorization surface.** Read
`CODING_STANDARDS.md` § "Native-boundary packages…" and § "Authorization boundaries are the same blind
spot…" before you start. Expect a long review loop, and enumerate check-then-act windows as described
there.

## Mission

Give a consumer two things.

- **A way to send every MCP HTTP request through the same SSRF protection as the rest of their
  egress.** This must work without buffering, because Streamable HTTP and SSE responses are
  long-lived streams.
- **A way to reach MCP servers that require OAuth 2.1.**

Do both as extensions of the existing primitives, not as workarounds in the consumer.

## What the orchestrator believes (verify every line; do not build on it)

These were read from `integration/asks` at `42b5822b`, with SDK `@modelcontextprotocol/sdk` 1.29.0
installed. **Nothing was run.**

1. `createHttpTransport` (`transports.ts`) validates the URL scheme and calls `makeHttpTransport(url,
   headers)` (`sdk.ts`). That passes only `requestInit.headers` to `StreamableHTTPClientTransport`.
2. The SDK transport accepts `fetch?: FetchLike` (`shared/transport.d.ts`:
   `(url: string | URL, init?: RequestInit) => Promise<Response>`) and `authProvider?:
   OAuthClientProvider`. It uses `fetch` for every request, including the `DELETE` in
   `terminateSession()` and the standalone `GET` SSE stream.
3. **safer-fetch** (`libraries/ts-extras/src/packlets/safer-fetch/`, an *established* surface, not on
   the active list):
   - Its public entry points (`saferFetchJson`, `saferFetchBytes`, `saferFetchText`) all buffer the
     body.
   - The hop walk is private to `saferFetch.ts`: `_execute`, `_runAttempt`, `_walk`, `_connect`,
     `_clearAddress` and `_nextHop`.
   - `rewriteForRedirect` (`redirect.ts`) strips `sensitiveHeaders` on a cross-origin hop, and does
     so monotonically.
   - `IAddressGuard` runs on every hop.
   - `IFetchTransport.fetch` returns the platform `Response`.
   - `pinnedAddress` is reserved, and no shipped guard pins. **DNS rebinding is therefore an open,
     documented residual today.**
4. `FetchFailureReason` carries URLs. The package's own guidance is "never echo `FetchFailureReason`
   to an untrusted caller."
5. The SDK's `UnauthorizedError` carries no fields. The transport keeps the `WWW-Authenticate`
   `resource_metadata` URL in a private `_resourceMetadataUrl`, parsed by
   `extractWWWAuthenticateParams` (`client/streamableHttp.js:319`). Check whether the SDK exports
   that function or exposes the value in any other supported way.
6. `McpFailureReason` already has `{ kind: 'unauthorized'; status? }` (#722), and `ts-extras-mcp`
   already depends on `@fgv/ts-extras`.
7. `docs/FUTURE.md` has an "OAuth / managed auth" entry (around line 420) that this stream retires in
   part.

## Decisions already made (build these; argue in `state.md` only if one is wrong)

### #672: a streaming guarded fetch in safer-fetch

Build a new **sibling entry point in `@fgv/ts-extras` safer-fetch**, not a wrapper in
`ts-extras-mcp`. SSRF policy belongs in one primitive, and every non-MCP consumer that streams needs
the same thing.

- **Shape.** `createGuardedFetch(options): Result<GuardedFetch>`, where `GuardedFetch` is
  `(url: string | URL, init?: RequestInit) => Promise<Response>`.
  - That is structurally the SDK's `FetchLike`, so it can be handed to any fetch-shaped consumer.
  - Name it as you see fit, within safer-fetch's naming rule (`index.ts` comment).
  - Export it from **both** barrels, like `saferFetchJson`.
- **Options** are a subset of `ISaferFetchOptions`:
  - `addressGuard` is **required, with no default**, as for every safer-fetch entry point.
  - `requestGuard?`, `responseHeadersGuard?`, `redirectPolicy?` (default `'reject'`),
    `maxRedirects?`, `sensitiveHeaders?`, `headersTimeoutMs?` and `transport?`.
  - **No** `timeoutMs` covering the body, **no** `maxResponseBytes`, **no** `responseBodyGuard`,
    **no** `retry`. Each of these needs the body read, or would retry a non-idempotent `POST`.
  - Say so in the TSDoc, in safer-fetch's "what it does not protect against" style.
- **Validation happens once, at create time.** Bad options fail there as a `Result`, never per call.
- **The hop walk is reused, not copied.** Refactor `saferFetch.ts` so that one walk serves both the
  buffered and the streaming paths:
  - address guard per hop;
  - request guard;
  - redirect rewrite with monotonic credential stripping;
  - loop detection;
  - headers deadline.

  The buffered entry points must behave **identically**. Prove that with the existing safer-fetch
  suite passing unchanged, and add no `c8 ignore`.
- **The response is returned unread.** It is the final hop's platform `Response`, with its body
  stream intact.
  - The response-headers guard runs on the head.
  - The headers deadline covers connect through headers only. Once headers arrive, its timer is
    cleared, so a stream that lives for an hour is not cut off.
- **Cancellation.**
  - `init.signal` must stop guard evaluation, the connect, a redirect walk in progress, and the body
    stream after return.
  - An already-aborted signal must fail before any guard runs or any request is sent.
- **Request inputs.** These are the shapes the SDK actually sends; verify which those are.
  - **Headers:** a `Headers` object, an array of pairs, or a plain record. Normalize them, lowercased.
  - **Body:** `string`, `Uint8Array` or absent. Anything else (a `ReadableStream`, `FormData`)
    fails.
  - **Methods:** those in `SaferFetchMethod`.
  - A `Request` object as the first argument is out of scope unless the SDK passes one; fail on it if
    it does not.
- **Failure contract.**
  - `GuardedFetch` must **reject**, because fetch-shaped callers expect a rejection.
  - It rejects with an exported error class, for example `GuardedFetchError extends Error`. The class
    carries the `FetchFailureReason` for the consumer's own logs.
  - Its `message` is fixed text, so the URL and guard detail never reach a message by default.
  - Document that the `reason` holds URLs.
- **Custom credential headers.** Requests usually carry credentials in custom headers such as
  `x-api-key`, which `fetch` does not strip on a cross-origin redirect. Two things handle them:
  - `redirectPolicy` defaults to `'reject'`;
  - `sensitiveHeaders` exists for the case where hops are allowed.
  - Document that a caller allowing redirects must list its custom credential headers.
  - Decide whether `mcp-session-id` belongs in the defaults. Record the decision.
- **The DNS-rebinding residual stays documented, not closed.** Pinned connect is a separate stream.
  Do not imply otherwise anywhere.

### #672: wiring it into `ts-extras-mcp`

- `IMcpHttpTransportParams` gains `fetch?: McpFetch`.
  - `McpFetch` is a package-owned alias of the fetch shape above, so that `createGuardedFetch`'s
    result fits it. A general `fetch` option, rather than a guard-only one, also serves the
    requester's "metered or pinned egress path".
  - Make the README, `CAPABILITIES.md` and the TSDoc lead with `createGuardedFetch` plus
    `blockPrivateNetworks` as **the** recommended value. Say plainly that an unguarded `fetch` gets
    no protection.
- **Every HTTP request the package makes goes through it.** That means the `POST`s, the standalone
  `GET` SSE stream and #728's termination `DELETE`. Prove each with a test that counts calls through
  an injected fetch against a real local server.
- **Classification.**
  - A `GuardedFetchError` from any call becomes a new `McpFailureReason` kind, for example
    `{ kind: 'egress-blocked'; reason: FetchFailureReason['kind'] }`.
  - It carries only the reason's **kind**, never its URL-bearing payload.
  - It is distinct from `transport`, because it is a configuration refusal and retrying cannot help.
  - Verify how the SDK surfaces a rejected `fetch` (as-is, wrapped, or as `onerror`) at connect, on a
    call, and on the SSE `GET`.
  - Update the kind table in `model.ts`.
- **Termination.** A `DELETE` that is blocked or that fails stays best-effort: it is logged at
  `detail`, the close still resolves, and the 2 s bound still holds.

### #677: OAuth

- `IMcpHttpTransportParams` gains `authProvider?`. Its type is the SDK's `OAuthClientProvider`,
  exported under a package name, for example `McpOAuthClientProvider`.
  - `sdk.ts` stays the **single SDK import site**.
  - Confirm that api-extractor resolves the type, and that the `.api.md` shows it.
- **`unauthorized` gains `resourceMetadataUrl?: string`.**
  - It holds the `resource_metadata` URL from `WWW-Authenticate`, when the server sent one.
  - It is validated as an `https:` (or `http:`) URL on a single printable line, and omitted
    otherwise. Never echo it unvalidated.
  - If the SDK offers no supported way to read it, parse the response's `WWW-Authenticate` yourself
    in the package's fetch wrapper. It must be the same wrapper whether or not the consumer supplied
    `fetch`.
  - Do not reach into `_resourceMetadataUrl`. Record which route you took.
- **A helper around the SDK's `auth()` flow is out of scope.** It is "welcome, not required". Add a
  `docs/FUTURE.md` entry with its shape.
- **The interactive flow must never run on a path the consumer did not start.** Verify whether the SDK
  calls `authProvider.redirectToAuthorization` (or any token refresh) from:
  - `terminateSession()`;
  - the standalone SSE `GET`;
  - a `listChanged`-triggered request.

  Where it can, either prevent it or document exactly when it happens. Close must never wait on an
  interactive authorization. The 2 s bound covers it, but say so.
- **Secrets.** Tokens, client secrets and authorization codes never reach a log line, a failure
  message, or a `McpFailureReason`. Prove it with a test that greps every log line and failure
  message from an OAuth round trip for the token values.

## Order and scope

Land each part as its own commit, in this order:

1. the safer-fetch refactor, with no behaviour change;
2. the streaming guarded fetch;
3. the MCP `fetch` wiring and classification;
4. OAuth.

Test the MCP side against a **real local HTTP server**, as #728's `terminate.test.ts` does. Use a real
SDK `StreamableHTTPServerTransport` where the behaviour is the SDK's. For OAuth, use the SDK's own
server-side auth helpers if they exist; otherwise use a minimal local authorization server, and say
which.

## Package surface

- **`libraries/ts-extras`:** `src/packlets/safer-fetch/**`, its tests, `etc/ts-extras.api.md`,
  `CAPABILITIES.md`, and both barrels.
- **`libraries/ts-extras-mcp`:** source, tests, `etc/*.api.md`, `CAPABILITIES.md` and `README.md`.
- **`common/changes/@fgv/ts-extras/*.json` and `common/changes/@fgv/ts-extras-mcp/*.json`.** Type
  them per `ACTIVE_DEVELOPMENT.md` § "How to type a change file". safer-fetch is on `main`, so an
  additive change there is `minor`. Anything breaking needs to stop and ask.
- **`docs/FUTURE.md`:** retire or update the OAuth entry, and add the `auth()` helper entry.
- **`.ai/instructions/LIBRARY_CAPABILITIES.md`:** a decision shortcut for the streaming guarded fetch.
  The router has a size gate: run `verify-capability-docs.mjs`.
- **Do not edit:** `ts-utils`, `ts-json-base`, or `.ai/tasks/active/personality-asks-2026-10/`. The
  orchestrator owns the latter.

## Out of scope

- **Pinned connect (closing DNS rebinding):** document it only.
- **The `auth()` helper:** a `FUTURE.md` entry only.
- **Following `resource_link` URIs:** still the consumer's call. Point them at the new primitive in
  the TSDoc instead.
- Browser-specific address guarding beyond what safer-fetch already says.

## Acceptance criteria

- [ ] Each numbered belief has a verdict, with evidence from the installed SDK or the source.
- [ ] **Load-bearing (refactor):** the existing safer-fetch suite passes unchanged.
- [ ] **Load-bearing (streaming), each case named and tested:**
  - [ ] An SSE response delivers its first event **before** the server ends the stream. This proves
    the body is not buffered.
  - [ ] The address guard runs on every hop, and a hop to a private address is refused.
  - [ ] A custom credential header listed in `sensitiveHeaders` is gone from a cross-origin hop and
    stays gone on an `A → B → A` chain.
  - [ ] An aborted signal stops each phase: during guard evaluation, during connect, between hops and
    mid-stream.
  - [ ] A stream that outlives `headersTimeoutMs` is not cut off.
- [ ] **Load-bearing (MCP egress):** every request kind (`POST`, the SSE `GET` and the termination
  `DELETE`) goes through the injected fetch, and a guard refusal classifies as the new kind on
  connect, on a call and on close. Close still resolves within the bound.
- [ ] **Load-bearing (OAuth):**
  - [ ] An OAuth-protected local server is reachable with a test `authProvider`.
  - [ ] A missing or expired token yields `unauthorized` with `resourceMetadataUrl` when the server
    sent one.
  - [ ] No token or secret value appears in any log line or failure message.
  - [ ] Termination never triggers `redirectToAuthorization`, or `result.md` documents exactly when
    it can.
- [ ] `result.md` has a check-then-act table: every `await` between an authorization or guard
  decision and the act it guards, and what re-checks after it. This is a security and authorization
  surface, so the table is the main review aid.
- [ ] `result.md` has a revert matrix: each protection reverted on its own makes its named test go red.
- [ ] `rushx build`, `rushx lint` and `rushx test` (100% coverage) pass with **zero warnings** in both
  `ts-extras` and `ts-extras-mcp`. Grade with `grep -ci warning`.
- [ ] `install-run-rush.js rebuild` **and** `install-run-rush.js test` pass repo-wide. The change
  widens a shared surface, and the refactor touches every safer-fetch consumer.
- [ ] `rushx fixlint` has been run, and `change --verify --target-branch origin/integration/asks`
  passes.
- [ ] Format with the repo's prettier (2.8, the `rush-prettier` autoinstaller), **not** a global
  `npx prettier` (3.x), which reflows untouched files and Markdown tables.
- [ ] The `code-reviewer` agent has been run on your diff after the functional tests and before
  coverage closure, and its findings are dispositioned in `result.md`.
- [ ] `/finalize-task` has been run: migrate the task, write the ledger entry (the orchestrator fills
  in the PR number), and make the capability-feed decision.

## Mechanics

- Work on branch `mcp-round-2b`, which already carries this brief. Push there. **Do not open a PR.**
- `rush` is not on PATH. Use `node common/scripts/install-run-rush.js <cmd>` from the repo root.
- **Commit each step before running a long gate**, and run every gate in the foreground. When the
  work is done, push and confirm with `git log origin/mcp-round-2b -1`.
- **Stop and report**, in a final message of at most 300 words, if:
  - the hop walk cannot be shared without changing the buffered entry points' behaviour;
  - the SDK swallows a rejected `fetch` such that a guard refusal cannot be classified;
  - the SDK can start an interactive authorization from a path the consumer did not initiate, and
    you cannot prevent it;
  - any decision above would need a breaking change to safer-fetch.

## Exit artifacts

- `state.md`: your working surface.
- `result.md`, covering:
  - what shipped, per ask;
  - each belief's verdict;
  - the new option and failure shapes;
  - the check-then-act table;
  - the revert matrix;
  - the gate counts;
  - what the DNS-rebinding residual now is;
  - anything this brief got wrong.
