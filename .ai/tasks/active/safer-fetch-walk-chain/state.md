# State: `safer-fetch-walk-chain`

Worker-owned. Brief: `brief.md` (frozen).

## Progress

- [x] Setup: branch at `499063733`, already contains `origin/integration/asks` (`84fc3cef4`)
- [x] Check-then-act enumeration, **before** (below, written before any code change)
- [ ] Rewrite `_walk` / `_execute`
- [ ] Check-then-act enumeration, **after**
- [ ] Revert matrix re-run
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
