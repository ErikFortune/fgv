# State: `safer-fetch-walk-chain`

Worker-owned. Brief: `brief.md` (frozen).

## Progress

- [x] Setup: branch at `499063733`, already contains `origin/integration/asks` (`84fc3cef4`)
- [x] Check-then-act enumeration, **before** (below, written before any code change)
- [x] Rewrite `_walk` / `_execute` (`97f01c699`)
- [x] Check-then-act enumeration, **after**
- [x] Revert matrix re-run (table in `result.md`)
- [ ] Gates
- [ ] Close-out

## Check-then-act enumeration — BEFORE (`saferFetch.ts` at `499063733`)

Line numbers are `libraries/ts-extras/src/packlets/safer-fetch/saferFetch.ts` at the base commit.
"Sync" means no `await` (and so no I/O, timer or caller code from outside the call) can interleave.

### `_walk` (L974–1050), one iteration of the `for (;;)` = one hop

| # | window | what is checked | what it guards | between check and act |
|---|---|---|---|---|
| W0 | hop-0 request built (L976–981) | — | reads `resolved.method/headers/body` once | sync with the start of the walk |
| W1 | L989 → L991 | `watch.attemptStarted()` re-arms the per-attempt headers deadline | the request guard call | sync |
| W2 | L991 (`_raced` pre-check, L341) | `watch.cause` — a stopped call starts no work | invoking `guards.request.check` | sync (the pre-check runs before the first `await` inside `_raced`) |
| W3 | L991 `await` → L1001 | request guard verdict | `checked` = the guard's returned request is what every later step uses | **one `await`**: the guard itself. `request` (the pre-guard object) is read again only for the `_blocked` message (L995), never acted on |
| W4 | L1002 → L1009 | `_checkScheme(checked.url)` — a replacement request cannot widen the scheme | the address guard sees `checked.url` | sync |
| W5 | L1009 (`_clearAddress` → `_raced` pre-check) | `watch.cause` | invoking `guards.address.check` | sync from W4 to the pre-check |
| W6 | `_clearAddress` `await` → its `_checkScheme(verdict.url)` | address guard verdict, then scheme on the normalized URL | `cleared.url` (the normalized URL) is what is requested | **one `await`**: the guard. The scheme re-check is sync after it |
| W7 | L1009 return → L1014 → L1022 → L1023 (`_connect`) | `_detectLoop(cleared.url, completed)` | the connect | microtask (promise resolution of `_clearAddress`) then sync; `cleared.value` is a local const, `completed` is not mutated in the window |
| W8 | `_connect` sync preamble → `_raced` pre-check → `transport.fetch(cleared.url, …, pinnedAddress)` | `watch.cause` | the wire | sync. The address guard is the last guard before the wire (no guard between W6 and W8) |
| W9 | inside `_connect` (unchanged; not in scope) | `headersReceived`, `_receiveHead`, `finish` (response guards) | final value | as before |
| W10 | L1023 return → L1037 `_nextHop` | hop cap, `Location` resolution, scheme of target, credential rewrite from **`checked`** (the request actually sent on this hop) | the next hop's request | microtask then sync |
| W11 | redirect-hop boundary: L1043 `completed.push` → L1048 `request = next.value` → L989 | — | next hop's W1/W2 | sync. `completed` is mutated **only** here, after every read of it for this hop; every guard is handed a copy (`[...completed, …]`), never the array |

Values read more than once in a hop: `request` (L993 twice, L995 in the failure message — a local
`let` reassigned only at L1048); `checked` / `checked.url` (L1002, L1009, L1023, L1037 — a local
const holding the guard's output); `cleared.value` / `.url` (L1014, L1016, L1022, L1023, L1025 —
a local const); `completed` (L993, L995, L1009, L1014, L1022, L1033, L1037 — mutated only at
W11). None is re-read from a caller-owned or guard-owned mutable source between check and use;
the only shared mutable state consulted after an `await` is `watch.cause`, and it is re-read by
every `_raced` pre-check.

Logging: `resolved.logger.detail` runs on the loop (L1016), connect (L1025) and next-hop (L1039)
failures only; not on request-guard, scheme or address-guard failures.

Escapes: a throw anywhere in `_walk` outside a `_capture` (e.g. a throwing `logger.detail`, or
`AbortSignal.any` missing in `_connect`) rejects `_walk`'s promise and is caught by the caller's
`captureAsyncResult` (`_execute` / `_walkGuarded`), which reports `_unexpected(message)`.

### `_execute` (L1151–1187)

| # | window | what is checked | what it guards | between |
|---|---|---|---|---|
| E1 | L1152 | `_resolveCallOptions(options)` | everything after | sync |
| E2 | L1158 | `resolveGuards(options)` (failure → `_unknown(message)`) | everything after | sync |
| E3 | L1164 | `_parseUrl(url)` | everything after | sync |
| E4 | L1169 | `new DeadlineWatch(…, options.signal)` — reads `options.signal` once | the walk | sync; E1–E4 all run in the caller's tick, before the first `await`, so `options` (caller-owned, mutable) is never read across an `await` |
| E5 | L1177 `await` `_runAttempt` under `captureAsyncResult` | — | — | the call itself |
| E6 | L1178 `watch.dispose()` | — | — | after E5 on both paths |
| E7 | L1179 | thrown → `_unexpected`; detail-less → `_withReason` | the caller's result | sync |

A throw at E1–E4 (sync) or E6 rejects `_execute`'s promise.

## Check-then-act enumeration — AFTER (`saferFetch.ts` at the rewrite)

**Shape: recursion over hops**, each hop a Result chain. `_walk` builds hop 0's request and calls
`_walkHop(request, completed, context)`; `_walkHop` runs the request guard and scheme re-check and
hands off to `_clearAndConnect` (address guard, loop detection, connect), which hands off to
`_settleHop` (final value, or `_nextHop` and a recursive `_walkHop`). `completed` is a fresh
`ReadonlyArray` per hop instead of one array mutated in place.

**Timing fact the mapping depends on** (`ts-utils` `result.ts`): `DetailedSuccess.onSuccess` calls
its callback synchronously with no `try`; `DetailedSuccess.thenOnSuccess` also calls its callback
**synchronously**, inside a `try`. So a `.thenOnSuccess` hung off an already-settled result adds no
`await` before the next stage starts. Only `.thenOnSuccess` on an `AsyncDetailedResult` (still
pending) waits.

| # | before (L) | after (L) | same? |
|---|---|---|---|
| W0 | 976–981 | 971–977, once per walk | yes |
| W1 | 989 → 991, sync | 1008 → 1011, sync | yes |
| W2 | `_raced` pre-check before the request guard | unchanged (`_raced` untouched) | yes |
| W3 | one `await` (the guard); `request` re-read only for the `_blocked` message | 1011–1015, identical; `checked` is the guard's output from here on | yes |
| W4 | 1002 → 1009 sync | 1018 `.onSuccess` (sync) → 1019 `.thenOnSuccess` on a settled `DetailedSuccess` → `_clearAndConnect` called synchronously → `_clearAddress` → `_raced` pre-check | yes, still sync |
| W5 | sync to the address guard's pre-check | as W4 | yes |
| W6 | inside `_clearAddress` (untouched) | 1037, identical | yes |
| W7 | `_clearAddress` resolves → 1014 loop → 1022/1023 `_connect`, sync | 1037 `await` → 1039 `.onSuccess` loop check (sync) → 1043 `.thenOnSuccess` on a settled result → `_connect` called synchronously | yes, still sync after the one `await` |
| W8 | `_connect` preamble → pre-check → transport | `_connect` untouched; reached as above. No guard between W6 and W8 | yes |
| W9 | inside `_connect` | untouched | yes |
| W10 | `await _connect` → 1037 `_nextHop`, sync | 1052 `.thenOnSuccess` on the pending `AsyncDetailedResult` → `_settleHop` → 1081 `_nextHop`. **Adds a few microtasks** between the connect settling and `_nextHop`. Nothing is checked or read from mutable state in them: `attempt`, `checked`, `completed` are locals. No timer can fire inside a microtask run, and a caller abort landing there is caught by the next hop's W2 pre-check — the same check that caught it before | equivalent |
| W11 | 1043 push → 1048 → 989, sync | 1082 `.thenOnSuccess` on a settled `_nextHop` result → `_walkHop` called synchronously with `[...completed, thisHop]` → 1008 → 1011. Sync | yes |

Values read more than once: unchanged — `request` (1013 ×2, 1015 message), `checked` (1018, 1037,
1049, 1081), `cleared` (1039 ×2, 1046, 1049 ×2), `completed` (every stage; now never mutated at
all, where before it was mutated only at W11). Headers for the next hop still come from `checked`
(1081), the request actually sent.

Logging: `_logFailure` on loop (1039), connect (1044) and next-hop (1078) failures only, with the
same text — same three sites as before.

### `_execute` / `_runCall`

| # | before | after | same? |
|---|---|---|---|
| E1–E3 | 1152, 1158, 1164, sync | 1208–1210, sync `.onSuccess` (no `try`); the guards failure maps through `_asOutcome`, which is exactly `_unknown(message)` | yes |
| E4 | 1169, sync, `options.signal` read once | 1215, inside the sync `.onSuccess`, still in the caller's tick | yes |
| E5–E6 | 1177–1178 | `_runCall` 1243–1244 | yes |
| E7 | `_unexpected` / `_withReason(ran.value)` | `_runCall` returns `_unexpected` / `ran.value`; `_execute` applies `_withReason` to the whole chain (1222) | see below |

### Escapes (thrown errors) — the one place the mapping is not line-for-line

Before, a throw inside the walk (outside a `_capture`) rejected `_walk` and reached the caller's
`captureAsyncResult`. After, a throw inside any stage after the request guard is caught by a
`thenOnSuccess` and becomes a `DetailedFailure` with `detail: undefined` and message
`_errorMessage(err)` — the same function `captureAsyncResult` uses. Traced per entry point:

- **buffered** (`saferFetch*`): `_runAttempt` sees `detail: undefined`; `isRetryableFailure(undefined)`
  is `false`, so no retry and no retry log line; `_execute`'s `_withReason` turns it into
  `_unexpected(message)` — identical to before.
- **guarded** (`createGuardedFetch`): `_walkGuarded`'s `ran` succeeds with the failure inside;
  `.onSuccess` passes it through; `_reasonOf` gives `_unexpectedReason(message)` — identical reason.

Existing tests pin both (`a logger that throws does not escape the Result contract`,
`contains a throwing logger as unknown rather than letting it escape`). A throw that still escapes
as a rejection — before the first stage hand-off, e.g. a request guard whose `name` getter throws
while its refusal is reported — goes through the old `ran.isFailure()` branch in both versions;
two new tests pin it (and keep those branches covered, which the rewrite had otherwise made
unreachable from the existing suite).

**Disclosed divergence (one, garbage input only).** `watch.dispose()` now runs inside a
`thenOnSuccess` callback. If it throws, the buffered call now resolves to an `'unknown'` failure
(via the outer `_withReason`) where before `_execute` rejected. `dispose()` can throw only via
`callerSignal.removeEventListener`, i.e. only when `options.signal` is not an `AbortSignal` (a JS
caller passing e.g. `{ aborted: true }`, which the constructor accepts without calling
`addEventListener`). The new behaviour is what the entry points document ("always returns a
`Result`"). A constructor throw (`{}` as `signal`) still rejects, as before, because the watch is
built in the synchronous prefix rather than inside the callback.

## Notes

- `_propagate` became unused and was removed (forced by the chaining).
- `saferFetchRetry.test.ts` untouched (owned by `deterministic-timing-tests`).
- Revert row S1 (scheme re-check after the request guard) was **green** against the existing
  suite: the address-guard path re-checks the scheme of the verdict URL, so dropping the first
  check still refused the request — after handing a `file:` URL to the address guard. Same on the
  base commit (the redundancy predates this stream). The existing test now also asserts the
  address guard is never asked; with that, S1 is red.
