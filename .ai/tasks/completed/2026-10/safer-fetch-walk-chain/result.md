# Result: `safer-fetch-walk-chain`

**Shipped:** the safer-fetch hop walk is a recursion over hops, each hop a Result chain with no
stacked `isFailure`, and `_execute` is a synchronous validation chain followed by one
`thenOnSuccess` — same checks, in the same order, with the same messages and failure reasons.

Commits: `97f01c699` (the rewrite, two tests, change file), `71a980903` (one test strengthened,
`state.md` mapping), plus the close-out commit. PR: #TBD (`prs: []`).

## Shape

Recursion, not one long chain. `_walk` builds hop 0's request and calls `_walkHop`:

- `_walkHop` — re-arms the headers deadline, request guard, scheme re-check of the guard's
  replacement, then `_clearAndConnect`;
- `_clearAndConnect` — address guard, loop detection, connect, then `_settleHop`;
- `_settleHop` — the final value, or `_nextHop` and a recursive `_walkHop` with
  `[...completed, thisHop]`.

Why recursion: a single chain over six stages needs `checked` (the request guard's output) in four
of them, which forces either deep nesting or a carried tuple; splitting at the two natural seams
keeps each function to one screen and reads in check order. It also makes `completed` a fresh,
never-mutated array per hop, and mirrors `_runAttempt`'s existing "a retry is a self-call"
rationale. Depth is bounded by `maxRedirects`.

`_execute` validates options, guards and the URL and builds the `DeadlineWatch` in the synchronous
prefix (so `options` is still read only in the caller's tick), then hands off to the new `_runCall`
(capture, dispose, `_unexpected`). `_withReason` now wraps `_execute`'s whole chain, the one
boundary where an `Outcome` becomes the caller's result. `_propagate` became unused and was removed.

## Check-then-act

Full before/after tables are in `state.md`. Summary:

- **Before:** one `await` per guard (request, address) and one for the connect. Every other step
  between a check and the action it guards ran synchronously. `completed` was mutated only at the hop
  boundary, after every read of it, and guards got copies. The only shared mutable state read after
  an `await` was `watch.cause`, re-read by every `_raced` pre-check.
- **After:** the list holds line for line. `DetailedSuccess.thenOnSuccess` invokes its callback
  synchronously, so the hand-offs after the request guard, after the address guard and after
  `_nextHop` add no `await`. The one new interval is a few microtasks between the connect settling
  and `_nextHop`. Nothing is checked or read from mutable state there, no timer can fire inside it,
  and an abort that lands in it is caught by the next hop's pre-check, as it was before.
- **Thrown errors:** a throw after the first hand-off now becomes a detail-less failure instead of a
  rejection. Both entry points still report it as the same `'unknown'` reason and message, which was
  traced through `_runAttempt` (not retryable), `_withReason` and `_reasonOf`.
- **One disclosed divergence**, reachable only with garbage input. If `watch.dispose()` throws, the
  buffered call now resolves `'unknown'` where it used to reject. That can happen only when
  `options.signal` is a non-`AbortSignal`, such as `{ aborted: true }`.

## Revert matrix

Each row is a source patch, one named test run (`heft test --test-path-pattern … -t …`), and a
restore. Every row ran only its named test (or that test's `test.each` cases), and no row produced a `tsc` error. The script is in
the session scratchpad (`revert.py`). The R rows are `mcp-round-2b`'s, re-expressed against the new
code where the patched line moved. The S rows are new and target the ordering the rewrite encodes.

| # | protection | revert | named test | result |
|---|---|---|---|---|
| R1 | stopped watch starts no work | drop `_raced` pre-check | an abort between hops stops the walk before the next hop is guarded or sent | red |
| R2 | address guard on every hop | clear hop 0 only | runs the address guard on every hop, and refuses a hop to a private address | red |
| R3 | monotonic credential stripping | caller's headers when back on the origin | …stays gone on A → B → A | red |
| R4 | stream not cut off (two layers) | drop finisher `headersReceived` and success `dispose` | a stream that outlives the headers deadline is not cut off | red |
| R5 | headers deadline bounds the head guard | retire on arrival | the headers deadline also bounds a response-headers guard that never settles | red |
| R6 | caller's signal reaches the body | `watch.signal` only | an abort after return cancels the body mid-stream | red |
| R6b | no listener left on caller's signal | don't dispose on success | leaves no abort listener on the caller's signal… | red |
| R7 | late abort reported | drop post-walk `watch.cause` | an abort at any point after the last guard accepts… | **green — not isolated, as recorded in `mcp-round-2b`** |
| R8 | `Request` input refused | accept it | refuses a Request object, sending nothing | red |
| R9 | body-needing options refused | drop `timeoutMs` | refuses every option that needs the body read… | red |
| R10 | wrapper installed with consumer `fetch` | hand SDK the consumer's | a refused standalone GET is logged by kind… | red |
| R11 | `GuardedFetchError` → `egress-blocked` | skip branch | a refusal on a call classifies as egress-blocked… | red |
| R12 | interactive gate | always open | the SDK's background reconnect… never starts interactive authorization | red |
| R13 | `state` gated | forward always | after connect, a token that cannot be refreshed… | red |
| R14 | window closes after connect | leave open | same as R13 | red |
| R15 | `resource_metadata` validation | accept any | a resource_metadata that is $label is omitted | red (2 of 3) |
| R16 | static headers off-origin dropped | never drop | …static headers never reach the authorization server | red |
| R17 | server-authored text redacted | `unauthorized` only | a non-401 error whose body echoes the credentials… | red |
| R18 | non-http(s) authorization URL refused | accept any | inside the window, an authorization URL that is $label is still refused | red (3 of 3) |
| R19 | headers timeout → `'timeout'` | drop branch | a slow tool on a JSON-response server… timeout, not transport | red |
| R20 | guarded `unknown` not a refusal | drop from set | maps a guarded-fetch unknown (internal) failure… | red |
| R21 | `http:` only on loopback | accept any `http:` | …plain http to a remote host is still refused | red |
| R22 | forwarding facade, not `Proxy` | `Proxy` reading the facade | a frozen object-literal provider works through the gate | red |
| R23 | static headers via `Headers` | lowercase raw record | case-variant duplicate static headers… | red |
| R24 | case-variant duplicates refused | never refuse | createHttpTransport refuses case-variant duplicate header names | red |
| R25 | egress built inside capture | build before | a provider getter that throws fails createHttpTransport… | red |
| R26 | window closes on a failed parked connect | close on success only | a connect that $label while auth is parked… | red (both) |
| R27 | late redirect after pending `saveCodeVerifier` refused | same | …while saveCodeVerifier is pending: the late redirect is refused | red |
| S1 | scheme re-check of the request guard's replacement, before the address guard | drop it | a replacement request whose scheme is unsupported is refused | red (after strengthening, see below) |
| S2 | loop detection compares guard-cleared URLs | compare `checked.url` | catches a repeat that only a normalizing guard makes visible | red |
| S3 | headers deadline re-armed per hop | hop 0 only | the headers deadline is per attempt, so a later hop that never answers still times out | red |
| S4 | the cleared (normalized) URL is what is sent | send `checked.url` | a normalized verdict URL is what actually gets requested | red |
| S5 | the replacement request is what the address guard clears | clear the pre-guard URL | a replacement request is still address-checked before it is sent | red |

R22's first run missed its patch anchor because a comment sits between `return {` and the first
getter. The anchor was corrected and the row re-run: red.

**S1 was green against the existing suite**, on the base commit as well as after the rewrite (both
were verified). The address-guard path re-checks the scheme of the verdict URL, so dropping the
first check still refused the request, but only after handing a `file:` URL to the address guard.
The existing test now also asserts that the address guard is never asked. That makes S1 red, and
the strengthened test passes on the base commit.

## Tests

- Two new tests cover a request guard whose `name` getter throws while its refusal is being
  reported (buffered and guarded). That is a throw that still escapes the walk as a rejection, so it
  exercises the top-level `ran.isFailure()` branches in `_runCall` and `_walkGuarded`. The rewrite
  had left those branches unreachable from the existing suite. Both tests pass on the base commit:
  they pin behaviour and add none.
- One test was strengthened (S1 above). `saferFetchRetry.test.ts` is untouched.

## Gates

Run from the repo root, with logs in a per-worktree scratchpad directory. Graded by grep: every log
had 0 `not met|FAILURE|Operations failed|error TS` hits, and its only warning was the symlink notice.

- **NUL padding:** none in any log; byte counts matched with and without NULs.
- **ts-extras:** `rushx build` and `rushx lint` pass, and coverage is 100%. `saferFetch.ts` is at
  100/100/100/100.
- **`rush rebuild`:** 38 of 38 completed, exit 0. `etc/ts-extras.api.md` is unchanged, so there are
  no new `ae-*` warnings.
- **`rush test`:** three runs were needed.
  - Run 1: the known load-sensitive `md5Normalizer.browser` failed (708 ms against a 300 ms bound),
    which blocked every downstream project.
  - Run 2: ts-extras passed. ts-extras-mcp failed `cancellation.test`, "maxTotalTimeoutMs caps a call
    that progress would otherwise extend", with 70 ms against 80 ms. That test runs against an
    in-memory MCP server and does not touch safer-fetch, but it is **not** on the known
    load-sensitive list. 35 projects succeeded and `testbed` was blocked.
  - Run 3 (`--from @fgv/ts-extras-mcp`, which rebuilt its 18-project closure): 18 of 18 passed,
    exit 0.
  - Every project passed in at least one run.
- **`rush change --verify --target-branch origin/release`:** passes. The change file is typed
  `none`, with the comment "internal refactor, no behaviour change".
- **Docs scripts:** `verify-capability-docs.mjs` reports 0 failed, and
  `generate-capability-feed.mjs --check` reports 0 stale. This stream opts out of the feed with
  `headline: ''`.
- **Prettier:** 2.8.8, clean.

## What the brief got wrong

- "Each `mcp-round-2b` revert row … must still turn its test red": R7 cannot. That stream already
  recorded it as not isolated (a microtask-only window), and it stays green.
- It implies the matrix covers the walk's ordering. Only R1–R3 touch the walk at all, and R1's
  protection lives in `_raced`, outside it. So the matrix alone would not catch a stage moved inside
  the walk. That gap is why rows S1–S5 were added, and S1 showed one ordering (the scheme re-check
  before the address guard) that no test pinned.
