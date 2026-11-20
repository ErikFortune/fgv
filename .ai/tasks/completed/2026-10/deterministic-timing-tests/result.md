# Result: `deterministic-timing-tests`

**Shipped:** the three load-sensitive tests in `ts-extras` and `ts-extras-mcp` are deterministic. Each now asserts the property it guarded, on a fake clock or on an outcome that tells the cases apart, never on elapsed wall-clock time. No production code changed.

Branch `deterministic-timing-tests` → `integration/asks`. PR: #745.

## The three tests

### `ts-extras` `md5Normalizer.browser.test.ts` "should handle large objects efficiently"

- **Root cause.** It asserted `computeHash` on a 1000-item object took under 300 ms. A unit test cannot measure that without also measuring how busy the machine is.
- **Fix.** Renamed it "should hash all of a large object, deterministically". It still uses the same large input, but now checks three things. The hash is well-formed. A copy built separately gets the same hash. Changing the **last** element changes the hash, and so does dropping it, which proves the whole input was consumed rather than a prefix. The time bound is gone because no meaningful version of it can be kept without a clock. A test of "linear in input size" would need timing too.
- **Proof it fails when broken.** I temporarily replaced the browser `Md5Normalizer` with one that hashes only the first 2000 characters of the normalized form. The test went red, then I restored the file.

### `ts-extras` `saferFetchRetry.test.ts` "an exhausted deadline fails with the attempt's own failure"

- **Root cause. Not load, and the brief's "real-timer deadline arithmetic" is only half of it.** The backoff uses full jitter, `random() * min(10_000, maxDelayMs = 5_000)`, and is compared against the remaining budget (~30 ms). Any `Math.random() < ~0.006` gives a backoff that fits, so the call retries. That is a 0.6 % coin flip on every run, independent of load. Load only makes it rarer, because it shrinks the budget. Reproduced: the original test with `Math.random` pinned to `0.001` fails with "Expected length: 1, Received length: 5".
- **Fix.** Jest fake timers fake only the clock and timers. `nextTick`, `queueMicrotask` and `setImmediate` stay real. With them the budget is exactly 30 ms when the retry is decided. `Math.random` is pinned to `0.0062`, which makes the backoff 31 ms, one more than fits. The call is awaited through `settledWithoutTime`. That helper resolves once the promise settles while the clock stays stopped. If the promise is still pending after 100 real event-loop turns, which means it is waiting on a timer, the helper rejects.
- **Proof it fails when broken.** Changing `delay <= remainingMs` to `delay <= remainingMs + 1` (an off-by-one) turns it red with "still pending with the clock stopped". `Math.min(delay, remainingMs)` (sleep up to the deadline) also turns it red. Both were restored.

### `ts-extras-mcp` `oauth.test.ts` "a connect that times out while saveCodeVerifier is pending …"

- **Root cause.** The real wait was the 300 ms connect deadline, armed on a real timer at connect start. It has to beat discovery and registration over loopback HTTP before the flow reaches `saveCodeVerifier`. On a busy machine discovery outlasts it. The connect then times out first, the auth flow is torn down, and `await provider.reached` never resolves, so Jest's 5 s timeout fails the test. A second real wait (300 ms after `release()`) made the "late redirect is refused" assertion pass vacuously if the flow had not finished.
- **Reproduced.** I put a 400 ms synchronous spin in the test auth server's metadata handler to simulate a stalled machine. The original test then fails exactly as observed: "Exceeded timeout of 5000 ms". The rewritten test passes under the same spin.
- **Fix.** `useFakeTimeouts()` fakes only `setTimeout`/`setInterval`. The clock, promise jobs, `nextTick` and `setImmediate` stay real, so loopback I/O and the SDK flow run normally. The deadline fires through `jest.advanceTimersByTime(300)` only after `provider.reached`. The post-release wait is now one `setImmediate` turn (`drained()`). From either paused step, the rest of the SDK's `auth()` is promise jobs with no I/O: `saveCodeVerifier` → `redirectToAuthorization`, or `tokens` → `state`. The job queue drains completely before an immediate runs. Real timers are restored in a `finally`, before `afterEach` closes servers.
- **Same pattern, same file.** The sibling `test.each` ("… parked before any interactive step", timeout and abort) had the identical deadline race, and got the identical fix.
- **Proof it fails when broken.** I temporarily changed the egress gate so `isOpen()` always returns true. All three parked-flow cases went red inside the single `drained()` turn: a redirect, or a `state` call, reached the consumer. That also proves one turn is enough. Restored afterwards.

## Sweep (brief § Sweep)

Grep over `libraries/*/src/test`: `Date.now()`/`performance.now()` diffs against a constant, `toBeLessThan(` on elapsed time, and real `setTimeout` waits ≥ 500 ms.

**Fixed (ts-extras / ts-extras-mcp):**

| file | assertion | fix |
|---|---|---|
| `ts-extras/…/saferFetchRetry.test.ts` "is clamped to maxDelayMs" | elapsed < 1000 ms | fake clock. The announced backoff is `retrying in 5ms`, and the second attempt runs after exactly 5 fake ms. Proved by removing the clamp. |
| same, "a Retry-After longer than the remaining budget fails now" | elapsed < 1000 ms | settles with the clock stopped. Proved by `Math.min(delay, remainingMs)`. |
| same, "retries do not extend the deadline" | elapsed < 1000 ms | fake clock with jitter pinned to 10 ms backoffs. It fails `timeout` / `overall` with `elapsedMs: 60` exactly. Proved by re-arming the overall timer per attempt. |
| same, "a caller abort during a backoff is answered during the backoff" | real 50 ms sleep, then elapsed < 500 ms | waits for the logged `retrying in 1000ms`, aborts, and must settle with the clock stopped. Proved by replacing `watch.delay` with a bare `setTimeout`. |
| `ts-extras/…/deadline.test.ts` "reports the unspent share of the overall deadline" | `remainingMs > 900` just after construction; `< 950` after a real 60 ms | fake clock; exactly 1000, then 940. Proved by dropping the elapsed term from `remainingMs`. |
| `ts-extras-mcp/…/oauth.test.ts` "closing never authorizes … promptly" | elapsed < 1000 ms | asserts the close ended on the 401 (that log line is present) and not on the termination bound (`did not finish within` absent) |
| `ts-extras-mcp/…/egress.test.ts` "a refused DELETE … promptly" | elapsed < `TERMINATE_TIMEOUT_MS` | same discriminator; the unused import was removed |
| `ts-extras-mcp/…/cancellation.test.ts` (4 sites), `httpFailures.test.ts` (2), `clientToolTurn.test.ts` (1) | elapsed < 2–5 s | removed. Each test's outcome already discriminates: `aborted` against a 30 s/60 s `timeout`, the server-side cancellation, or a `close()` that never resolves, which would leave the connect unsettled. A comment says so where it was not obvious. |

**Left alone in ts-extras / ts-extras-mcp, with reasons:**

- `ts-extras-mcp/…/terminate.test.ts`: `PROMPT_MS` (1000) bounds at 6 sites, and `ms >= TERMINATE_TIMEOUT_MS - 50` / `< TERMINATE_TIMEOUT_MS + PROMPT_MS` on a real 2 s hold. This file tests the termination **bound itself** over real loopback HTTP. A deterministic rewrite means fake timers over the real HTTP stack: the technique `oauth.test.ts` now proves out, but applied across the whole file. I left the file whole rather than converting half of it. **Follow-up.**
- `ts-extras/…/deadline.test.ts` "delay waits out the interval": a **lower** bound (`>= 30` for a 40 ms delay). Load only makes the wait longer, so this is not a load hazard. Its other tests race 5–20 ms timers against 1000 ms ones, and Node fires timers in expiry order, so they are ordering-based rather than duration-based.
- `ts-extras-mcp/…/realHttpServer.ts` `waitFor` and the `terminate.test.ts` polling loop: polls with a deadline, not assertions on elapsed time.
- `oauth.test.ts:595`: a real 200 ms wait, below the brief's ~500 ms threshold. It also sits behind `waitFor(... auth.requests.length > 0)`.

**Outside ts-extras / ts-extras-mcp: reported, not fixed (follow-up):**

- `ts-res/…/deltaGenerator.enumeration.test.ts:1155`: `duration < 2000`
- `ts-res/…/deltaGenerator.core.test.ts:599-602`: `duration < 5000`
- `ts-sudoku-lib/…/killerCombinations.test.ts:366,580,595`: `< 100`, `< 100`, `< 200` ms. These are the tightest in the repo and the likeliest to flake next. The sudoku packages are slated to leave the repo.
- `ts-sudoku-lib/…/hints/integration.test.ts:445`: `< 5000`
- `ts-sudoku-lib/…/anyPuzzle.test.ts:323`: `< 1000`
- `ts-sudoku-lib/…/sudokuXPuzzle.test.ts:583`: `< 100`

## Parallel-load run (acceptance 1)

- **Setup.** `rush rebuild` ran over the 31 projects outside `ts-extras-mcp`'s dependency closure. A full rebuild would `heft build --clean` the very `lib/` the suites execute from, so excluding that closure loads the machine without corrupting the test. The three sibling workers' gates were running at the same time. The machine has 4 cores, and load average was 23–27 throughout.
- **Run 1** (fully inside the rebuild): `rushx test` in `ts-extras` (3203 passed, 0 failed) and then in `ts-extras-mcp` (279 passed, 0 failed). Coverage thresholds were met: `not met` count 0.
- **Run 2** (mostly inside it; the rebuild ended near its close): the same, with the same counts.

## Gates

Recorded in `state.md` with counts.

## What the brief got wrong

- The `saferFetchRetry` failure is not a load effect. It is a ~0.6 % jitter coin flip on every run, with load only making it rarer. Fake timers alone would not have fixed it; pinning `Math.random` did.
- "Run each package's suite while a repo-wide rebuild runs in parallel" cannot be done literally. A full rebuild cleans the `lib/` the suites run from. The run used a rebuild of everything outside the two packages' dependency closure.
- No injectable clock seam was needed, so there is no production change and no `minor` change file. Both change files are `none`.
