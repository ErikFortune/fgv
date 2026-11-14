**Shipped:** A host can let a model pause or cancel a task and its whole subtree and then watch the stop, a page of targets at a time — while releasing a stop and carrying it out stay the host's alone, and no tool's answers change with which other tools the host enabled.

# Result — `agent-tasks-i1d`

**I1d closes I1.** Artifacts stay in `.ai/tasks/active/agent-tasks-i1d/`; this family finalizes at
cluster close. Written 2026-10-01.

---

## What shipped

- **`createTaskTools({ …, stops?: ITaskStopToolOptions })`**, with
  `ITaskStopToolOptions = { writer, environment, enable: ReadonlyArray<StopMode> }`:
  - `enable` — the modes `task_stop` offers, converted (an unknown mode refuses the set), deduplicated
    and put in `allStopModes` order. Absent or empty: no stop tool.
  - `writer` must be the very object passed as `view` (build-time `===`), as for mutations and
    commands.
  - `environment: Pick<ITaskEnvironment, 'newOperationId'>` mints each stop's operation id.
- **`task_stop`** — `{ taskId, expectedRevision, mode }`, `mode` an enum of exactly the enabled modes.
  Calls the writer's `requestStop` with a minted operation id, which is the stop's `intentId`.
- **`task_stop_inspect`** — `{ taskId, intentId, after? }`. Calls the view's `inspectStop`.
- **Result** of both: `ITaskStopToolResult` — `{ intentId, taskId, mode, state, counts, targets,
  remaining, nextAfter?, restrictedWorkRemains }`, each target `ITaskStopToolTarget` —
  `{ taskId, state, confirmedRevision?, violation? }`.
- **`fixedTaskToolNames`** gains `task_stop` and `task_stop_inspect`; the pinning test now builds every
  mutation group **and** both stop modes.
- **Files:** `tools/stopTools.ts` (new), `tools/taskTools.ts`, `tools/schemas.ts`,
  `tools/commandTools.ts` (the reserved list; the `stop-active` comment I1c left pointing here),
  `tools/index.ts`, `types/tools.ts`. Nothing in `broker/`, `storage/` or `converters/` changed —
  in particular none of `converters/builtinKinds.ts`, `types/trackedCommands.ts` or
  `broker/commands.ts` (owned by `agent-tasks-tracked-commands`).
- **Tests:** `tools/stops.test.ts` (real broker, end to end — native tree and an external child),
  `tools/stopBoundary.test.ts` (scripted writer), additions to `factory.test.ts` and
  `requestCapture.test.ts`; helper `stoppingTools` in `toolFixtures.ts`.

## The decision this slice exists to take — which stop operations a model may reach

| operation | model tool | decision |
|---|---|---|
| `inspectStop` | `task_stop_inspect` | **offered** with the stop tools |
| `requestStop` | `task_stop` | **offered**, opt-in per `StopMode` |
| `releaseStop` | — | **a model must not reach this** |
| `reconcileStop` | — | **a model must not reach this** |

**`inspectStop` — offered.** It is a read on `IBoundTaskView` ("reading it performs no effect"), and
the broker already projects it for the principal: the root must be visible, only visible targets are
listed, source evidence is gone, and a hidden unconfirmed target shows only as
`restrictedWorkRemains`. It is offered only beside `task_stop`, because a model has no other way to
learn an intent id (below), so a lone inspect tool would be one the model could not use.

**`requestStop` — offered, per mode.** It is the conservative operation: it persists an intent and
freezes admission over the subtree, and **dispatches nothing**. Its authority is the policy's `stop`
on the root, asked at every call. The modes are a separate opt-in because they are not equally
reversible: a pause holds until the host releases it; a cancel whose root is terminal cannot be
released at all (`_releasable`). A host can offer a model the brake without the irreversible one.
The root must also carry a `stopPolicy` that permits the mode, which a model cannot set (`task_create`
has no `stopPolicy` field, and a created task defaults to `none`) — so a model can stop only trees the
host declared stoppable.

**`releaseStop` — not offered.** Releasing un-freezes admission over the **whole** captured subtree,
including targets this principal cannot see, and for a pause with blockers standing it is the host
*accepting a partial stop* (`stopRequests.ts`, `releaseStop` remarks). A model sees only the projected
subset, so it cannot make that judgement on the facts it is shown. And there is no way to confine it
to the model's own stops: `IStopResult` does not carry `requestedBy`, so a tool cannot tell a stop the
model requested from one another principal requested, and making `release-stop` policy-only would
let a model lift any stop its principal may release. Holding state across calls to remember "my
stops" is the thing I1c refused to do for command keys. So: a model may apply the brakes; only the
host lifts them. Stated in `task_stop`'s description ("A stop cannot be released with these tools").

**`reconcileStop` — not offered, for I1c's reason and one more.** It is the host's pump: it dispatches
stop commands to external sources, reads them, and resolves uncertain dispatches. I1c excluded
`resolveCommands` because the pump's timing and repetition are the host's scheduling, and that applies
unchanged. `limit` bounds one pass's effects, but nothing bounds how many passes a model makes in a
turn, so a model-driven pump makes the model the scheduler of external effects. The additional
reason: T9 separates acceptance from dispatch on purpose ("nothing is dispatched here"), so a host can
let a model *record* a stop without letting it *send* one; collapsing the two into one model surface
would remove that choice. The model is told the stop is pending until the host carries it out.

**What a model therefore can and cannot do, stated as shipped properties:** request a stop of an
offered mode on a visible, stoppable root it is authorized to stop; read any stop whose root it can see
and whose id it holds. Never release a stop, never drive dispatch, never choose an operation id.

## The `stop-active` coherence answer — keep `conflict`, always

**Every tool answers a latch as `conflict`, whether or not the host enables the stop tools.** No tool's
output depends on which other tools the host enabled. Reasons:

- **A latch can come from a stop the principal cannot see.** A task is latched by any latching stop
  whose root is the task *or an ancestor*. T9's M1 finding removed the root and intent from the freeze
  refusal for exactly this reason. Saying `stop-active` would tell a model that *some* ancestor —
  possibly hidden — was stopped, which is more than `task_stop_inspect` would show it (that needs the
  root visible and the intent id held).
- **The disclosure would not be usable.** Even told `stop-active`, a model holding no intent id cannot
  inspect the stop (see the TECH_DEBT entry below), so the extra word buys nothing it can act on.
- **A model that requested a stop already knows.** It has the intent id from `task_stop` and inspects
  it directly.

Tested: `stops.test.ts` › *a creation under a stopped parent reads as conflict, identically with and
without the stop tools* — the two answers are compared as strings, and neither mentions a stop or a
latch. The command tools' `rejectionCodes` comment now states this instead of deferring to I1d.

**A registered command named like a stop** (I1c's routed question): a host may offer one beside the
stop tools. A command `cancel` is one task's own command under `command` authority; a stop is a cascade
under `stop`. They are different operations, and the latch refuses whatever a command would do that a
stop forbids (a move to `running`, or out of the stopped set). Not refused by name: tool names are the
host's.

## `intentId` reaches the model — and why that is safe when operation ids are withheld elsewhere

I1b withholds a receipt's operation id so that "a model can neither replay another principal's receipt
nor occupy a key a host pump would mint". Neither risk exists here:

- **The model never supplies an operation id to any tool.** Every tool mints its own for every call.
  An intent id is accepted by exactly one tool, `task_stop_inspect`, and only as the name of a stop to
  *read*; there is no tool through which it could be used as a key.
- **It grants no access.** `inspectStop` requires the root to be visible and answers a missing intent
  exactly as a hidden root (`not-found-or-denied`). Knowing an intent id lets a model read nothing its
  principal could not read.
- **It is the model's own request's id**, minted by the tool for this call. Other ids stay withheld:
  each target's command key (`operationId`) and `attempt` are stripped from the result — the model
  could not use a key, and the attempt counts the host's retries against a source.

The id is also told on an unknown outcome (below), as I1b tells a creation's would-be task id.

## What bounds `targets`, and how omissions are named

**Paging, exactly as `task_query` pages tasks.** A page is at most `budget.context.maxItems` targets
(20 by default) in the stop's own order (root first, then breadth-first — captured at acceptance and
never changed). `remaining` counts the visible targets after the page; when any remain, `nextAfter`
names the page's last target and `task_stop_inspect({ …, after })` continues. **Nothing is dropped:**
every visible target is on some page, and `counts` (visible targets by state, over the whole stop)
lets a model see blockers without paging at all.

The continuation is a target id, not an index: the visible subset can change between pages (a target
hidden since), so an index would silently skip or repeat. A continuation that is not a visible target
**now** — hidden since, or never a target — fails as `cursor-stale` ("query again without it"), and the
two read alike, so `after` discloses nothing about hidden targets. Each page is a fresh read: states
can move between pages, which the counts on each page reflect.

The answer is also bounded before it is read: the target list is converted with a bound of
`defaultMaxStopTargets` (1,000, T9's capture bound) and each task once.

## What the model is told when `capacity` is present

**Nothing about capacity.** `ICapacityFailure` is host capacity information (T8b's model, with figures
of the repository). The tool logs `stop <id> met a capacity refusal on '<dimension>'` at `warn` and
drops it; the model sees the affected target's own state (`unavailable` — "a fresh attempt could not be
admitted") and the stop's `blocked` state, which say everything it can act on. Without a logger it is
simply dropped. Note that through the broker `capacity` cannot reach these tools at all — only
`reconcileStop` sets it, and that is not model-reachable — but any `IBoundTaskView` may be passed, so
the converter accepts it and the presenter withholds it (tested with a scripted writer).

## Known and unknown outcomes of `task_stop`

| failure | the model is told |
|---|---|
| `unsupported` | `task_stop: unsupported: …` (the root's stop policy does not permit the mode, or it is not a native root) — the only known outcome |
| any other code, `not-found-or-denied` included | its code line **+** `; the stop may or may not have been accepted — if it was, its intentId is <id>: inspect it with task_stop_inspect before requesting it again`. A denied root, a hidden root and a missing id read alike: the same line, differing only in the would-be id (tested) |
| no known code / a throw / a malformed result | `the request failed` / `the task writer failed` / `commit-indeterminate: …`, each with the same tail |

Every non-determinate case can follow an accepted stop: after the commit, `presentStop` reads every
target and can fail with a storage code, or `conflict` when the intent or policy moved while it
presented. A retry is harmless either way — a second stop of a mode already latched on the root is
refused `conflict` — but it would not tell the model the first one's id, hence the tail.

`not-found-or-denied` **can** follow a commit in one broker path (the root hidden between the commit
and the presentation's re-read) — layer-1 P2-1 found it, and it is why that code carries the tail too.
Tested through the real broker with a policy that hides the root the moment it authorizes the stop:
the model is told the intent id, and the stop is persisted. `unsupported` is produced only before the
writer section.

## Every check-then-act window in the diff

| window | what was read or decided before | what re-checks after |
|---|---|---|
| factory build → every call | the offered modes, the writer `===` view | nothing about authority is captured: building asks the policy nothing (tested with the policy's call log), touches neither writer nor environment (proxies that throw on access), and every call asks the writer, which asks the policy then (revoked-after-build refused, granted-later allowed — tested) |
| `execute` args → mint → request | schema-validated args; the request built by the broker's own `stops.request` converter from named fields and the minted id — never by spreading `args` | the writer re-converts the request and does its own W1 (T9) |
| request built → `await writer.requestStop` | `expected = { taskId, intentId, mode }` — **scalar copies captured before the call** (the I1b-10 / I1c-25 rule) | the result converter checks `intentId`, `rootId` and `mode` against those copies; a writer rewriting the request in place is tested for each of the three fields, answering honestly for the rewrite — each reads as unknown |
| inspect args → `await view.inspectStop` | `expected = { taskId, intentId }` from the converted args | the result must be for that stop and root (a mode is not asked, so not checked) |
| one page → the next page | the previous page's last target id (`nextAfter`) | a fresh `inspectStop` each page; `after` must be a visible target **now**, else `cursor-stale` |
| broker: W1–W14 (T9) | | unchanged; the tool adds no window of its own between authorization and commit |

## The binding members the packlet reaches

**Eight**, asserted exactly with the recording proxy while every tool runs (`stops.test.ts` ›
*requestStop and inspectStop are the seventh and eighth…*): `createTracked`, `execute`, `inspect`,
`inspectStop`, `query`, `reassign`, `requestStop`, `updateTracked`. Asserted untouched:
`changeScopes`, `reparent`, `completeList`, `archive`, `reconcileListCompletions`, `resolveCommands`,
`registerExternal`, `createTaskList`, `releaseStop`, `reconcileStop`. I1c's assertion (six, with every
stop method untouched when the stop tools are not offered) stands unchanged.

## Revert matrix — run on final source

**Final run:** `perf/mutationMatrix.js --pkg <git-archive copy of 1abeb60f, node_modules symlinked>`.
It covered every I1d row (`I1d-1` to `I1d-21`), the three I1c rows this slice re-pointed
(`I1c-14/18/19`), and `I1b-19/20/21`, which guard the minting the mutation tools now share.
**27 rows, 56 red tests; 0 UNVERIFIED, 0 at `0 red`; runner exit 0.** It was not run alongside
any rebuild. `--check` on the final tree finds every pattern exactly once. The six storage rows
`M13 M20 M23 M34 M39 M49` stay UNVERIFIED; they predate this slice and are routed in
`docs/TECH_DEBT.md`.

An earlier run on `37181bde` (22 rows) is superseded. Three things changed after it:

- `I1d-16`'s mutant failed lint ("comparing to itself"). It now mutates to `=== undefined`.
- Copilot rounds 1 and 2 added `I1d-20` and `I1d-21`.
- Round 3 moved the mutation tools' minting into `toolSupport.ts`.

Per-row notes:

- **I1d-2 is paired, and its schema half is masked.** The tool converts the model's ids with a strict
  object converter after the schema. Reverting the schema closure alone leaves that converter
  refusing a surplus field, so the row reverts both. As with I1c-2, the pair shows that at least one
  of the two is load-bearing; it does not prove each half separately. The closure is also pinned on
  the wire by the literal schema assertions.
- **I1d-4 goes red on one test only:** the in-place rewrite of `taskId`. Every other test of a wrong
  root also fails the root-first check (I1d-20), which by itself refuses a result whose first target
  is not its root. The two checks back each other up. The rewrite test isolates `rootId` by listing
  only the rewritten root as a target.
- **I1d-6 is red on the in-place rewrite test.** That test answers honestly for the rewritten request,
  and lists only the rewritten root, so the identity check is the only check that can refuse it.
  Layer-1 P2-2 found the `taskId` case non-discriminating; it was fixed before this run.
- **I1d-8 is broad by nature.** Spreading a target leaks its key and attempt into every end-to-end
  result, so 5 tests go red.

| row | verdict | suites that went red (first three) |
|---|---|---|
| I1d-1 task_stop execute trusts its arguments | 3 red | execute re-validates its arguments with no harness in front › task_stop: malformed values are the model’s to fix, and reach nothing<br>execute re-validates its arguments with no harness in front › task_stop: the model cannot name an operation id, an intent, a principal, a scope or a policy<br>task_stop — a model requests a stop, and the host carries it out › only the offered modes are accepted, and the refusal reaches nothing |
| I1d-2 task_stop_inspect execute trusts its arguments (schema closure and the strict id conversion both reverted) | 1 red | execute re-validates its arguments with no harness in front › task_stop_inspect: surplus fields and malformed ids fail, and reach nothing |
| I1d-3 a stop result's intent id is not checked | 3 red | a writer’s or view’s answer is checked, and says no more than a fixed line › a result for another stop or root is a malformed answer for an inspection<br>a writer’s or view’s answer is checked, and says no more than a fixed line › a result for another stop, root or mode — or malformed — is an unknown outcome for a request<br>a writer’s or view’s answer is checked, and says no more than a fixed line › a writer that rewrites the request in place cannot move what its result is checked against |
| I1d-4 a stop result's root is not checked | 1 red | a writer’s or view’s answer is checked, and says no more than a fixed line › a writer that rewrites the request in place cannot move what its result is checked against |
| I1d-5 a stop request's result may be of another mode | 2 red | a writer’s or view’s answer is checked, and says no more than a fixed line › a result for another stop, root or mode — or malformed — is an unknown outcome for a request<br>a writer’s or view’s answer is checked, and says no more than a fixed line › a writer that rewrites the request in place cannot move what its result is checked against |
| I1d-6 the result is checked against the request object the writer was handed | 1 red | a writer’s or view’s answer is checked, and says no more than a fixed line › a writer that rewrites the request in place cannot move what its result is checked against |
| I1d-7 a result listing a target twice is accepted | 1 red | a writer’s or view’s answer is checked, and says no more than a fixed line › a result for another stop, root or mode — or malformed — is an unknown outcome for a request |
| I1d-8 a target's command key and attempt reach the model | 5 red | task_stop — a model requests a stop, and the host carries it out › a stop is recorded and frozen, nothing is dispatched, and the host pump then confirms it<br>task_stop — a model requests a stop, and the host carries it out › an external child is sent its stop by the host pump, and the model sees it confirmed<br>what the model is told of a stop result › a capacity refusal is never told: the model sees the target states; the host gets the dimension<br>(and 2 more) |
| I1d-9 a capacity refusal reaches the model | 1 red | what the model is told of a stop result › a capacity refusal is never told: the model sees the target states; the host gets the dimension |
| I1d-10 a denial is a known outcome, though it can follow the commit (layer-1 P2-1) | 3 red | a writer’s or view’s answer is checked, and says no more than a fixed line › only a refusal of the stop itself is a known outcome — a denial can follow the commit<br>task_stop — a model requests a stop, and the host carries it out › a root hidden after the stop committed reads as not found — and the model is still told the intent id<br>task_stop — a model requests a stop, and the host carries it out › a stop the policy denies reads exactly as a hidden task and a missing id, and nothing is written |
| I1d-11 every classified failure of a stop request is a known outcome | 5 red | a writer’s or view’s answer is checked, and says no more than a fixed line › only a refusal of the stop itself is a known outcome — a denial can follow the commit<br>task_stop — a model requests a stop, and the host carries it out › a root hidden after the stop committed reads as not found — and the model is still told the intent id<br>task_stop — a model requests a stop, and the host carries it out › a second stop of a latched mode is refused; the first stands and is inspected by its own id<br>(and 2 more) |
| I1d-12 an unknown outcome does not tell the model the intent id | 8 red | a writer’s or view’s answer is checked, and says no more than a fixed line › a result for another stop, root or mode — or malformed — is an unknown outcome for a request<br>a writer’s or view’s answer is checked, and says no more than a fixed line › a writer that rewrites the request in place cannot move what its result is checked against<br>a writer’s or view’s answer is checked, and says no more than a fixed line › a writer that throws or rejects is an unknown outcome, and what it threw goes to the host<br>(and 5 more) |
| I1d-13 a page of targets is not bounded | 1 red | task_stop_inspect — paging the targets › targets come a page at a time, in the stop’s order; nothing is dropped and the counts are whole |
| I1d-14 a continuation that is not a visible target silently starts again from the top | 1 red | task_stop_inspect — paging the targets › continuing after a target hidden since, or never a target, reads alike: start again |
| I1d-15 counts are over the page, not the whole stop | 1 red | task_stop_inspect — paging the targets › targets come a page at a time, in the stop’s order; nothing is dropped and the counts are whole |
| I1d-16 the stop writer need not be the view | 1 red | createTaskTools › refuses a stop opt-in whose writer is not the view, or that names an unknown mode |
| I1d-17 the offered modes are not converted | 1 red | createTaskTools › refuses a stop opt-in whose writer is not the view, or that names an unknown mode |
| I1d-18 task_stop offers every mode, not only the ones enabled | 3 red | stop tools reach the outbound request only when opted into › opted into — Gemini: both stop tools are function declarations with their complete sanitized schemas<br>stop wire schemas › task_stop emits a closed schema whose mode is exactly the modes offered<br>task_stop — a model requests a stop, and the host carries it out › only the offered modes are accepted, and the refusal reaches nothing |
| I1d-19 the stop tool names are not reserved | 2 red | command tools › a generated name may not be a fixed tool’s, whether or not that tool is offered<br>command tools › the reserved names are exactly the fixed tools the factory builds — a renamed or added tool cannot go stale |
| I1d-20 a result whose targets are empty or not led by the root is accepted (Copilot round 1) | 1 red | a writer’s or view’s answer is checked, and says no more than a fixed line › a result for another stop, root or mode — or malformed — is an unknown outcome for a request |
| I1d-21 a satisfied result over unconfirmed work is accepted (Copilot round 2) | 1 red | a writer’s or view’s answer is checked, and says no more than a fixed line › a result for another stop, root or mode — or malformed — is an unknown outcome for a request |
| I1c-14 the command writer need not be the view | 1 red | command tools › refuses a malformed offer, and a writer that is not the view |
| I1c-18 a minting failure's host text reaches the model | 3 red | ids the host mints › an environment that fails, throws or mints a malformed id fails the call, and names nothing<br>what the host supplies fails as the host’s, and names nothing › an environment that fails, throws or mints a malformed id fails the call before anything is sent |
| I1c-19 a minted operation id is not converted | 3 red | ids the host mints › an environment that fails, throws or mints a malformed id fails the call, and names nothing<br>what the host supplies fails as the host’s, and names nothing › an environment that fails, throws or mints a malformed id fails the call before anything is sent |
| I1b-19 a minting failure's host text reaches the model | 4 red | ids the host mints › an environment that fails, throws or mints a malformed id fails the call, and names nothing<br>ids the host mints › without a logger, a minting failure is still reported to the model as a fixed line<br>what the host supplies fails as the host’s, and names nothing › an environment that fails, throws or mints a malformed id fails the call before anything is sent |
| I1b-20 a minting throw escapes the tool | 1 red | ids the host mints › an environment that fails, throws or mints a malformed id fails the call, and names nothing |
| I1b-21 a minted id is not converted | 1 red | ids the host mints › an environment that fails, throws or mints a malformed id fails the call, and names nothing |

## Review

### Layer 1 — `code-reviewer`, before coverage closure

The authorization-boundary questions were put to it directly: every check-then-act window, free-text
channels, intent-id disclosure, the determinate/unknown split, paging, build-time behaviour, the
release/pump/`stop-active` decisions, and test discrimination.

**No P1. Three P2, all fixed. P3s applied or dispositioned.**

- **P2-1 (fixed): `not-found-or-denied` can follow the commit.** `presentStop` re-reads the root, and
  answers not found if it was hidden after the commit. The model would have been told "not found"
  for a stop that froze a tree. Now only `unsupported` is a known outcome. Tested through the real
  broker with a policy that hides the root the moment it authorizes the stop. Matrix row `I1d-10`.
- **P2-2 (fixed): one rewrite-test case could not discriminate.** The `taskId` case's answer listed
  `[a, a]`, which the duplicate check would refuse anyway. It now lists only the rewritten root.
- **P2-3 (fixed): operation-id minting was copied three times.** It is now `mintOperationId` in
  `toolSupport.ts`. Copilot round 3 noticed that the mutation tools' copy had survived; it now goes
  through the helper too. `I1c-18/19` were re-pointed, and `I1c-14`'s pattern was extended because
  `_stops` repeats its guard.
- **P3 applied:**
  - The paging "nothing is dropped" claim is now scoped to one stop as it stands.
  - "Blocked" was corrected to the target state `unavailable`.
  - "An empty list offers neither tool."
  - `environment` must mint **unguessable** ids, because `task_stop_inspect` treats an intent id as
    the name it reads by.
  - A weak name-regex test was dropped; the exact-name assertions carry it.
- **P3 dispositioned:**
  - The `cursor-stale` line says "query again", which is slightly off for an inspection. It is kept:
    it is honest, and fixed text.
  - A stale revision over-warns ("may have been accepted"). That is the harmless direction, and it
    follows from the code rule.
  - A host wanting an inspect-only stop surface must still pass a writer. Recorded here, not built.

### Layer 2 — Copilot

The first round was requested by an `@copilot review` comment and an API request. Each later round
used a comment plus a request.

| round | on | findings | outcome |
|---|---|---|---|
| 1 | `58c27c5d` | **medium:** the result converter accepted an empty target list, or one not led by the root; **low ×2:** `CAPABILITIES.md` and `result.md` still called `not-found-or-denied` determinate | fixed in `1fa3a477` (root-first check, both shapes tested, `I1d-20`), with the duplicate-target fixture led by the root in `d8428c63` |
| 2 | `d8428c63` | **medium:** two malformed-answer fixtures were not led by the root, so they failed for the wrong reason; **overview:** a `satisfied`/`settled` result over unconfirmed or hidden work was accepted; **low ×2:** the stale row range in the ledger and `state.md` | fixed in `95212ab4`. A presentation never overstates; this mirrors the persisted intent's invariant. Covers `satisfied` and `settled`. `I1d-21` |
| 3 | `95212ab4` | **no new findings.** Two listed as previously missed: the mutation tools' own minting copy (medium, a refactor), and "not yet stopped" in `task_stop_inspect`'s description (low; a hidden target can be permanently blocked) | both fixed in `1abeb60f` |

**Loop stopped at 3 rounds on diminishing returns.** Rounds 1 and 2 each found a real gap in how the
tool trusts a writer's answer: a malformed target list, then an overstated stop. This is the class
this boundary predicts. Round 3 found nothing new, and its two missed items were a refactor and a
wording, not a correctness defect. Every review thread is answered and resolved. CI `build` is green
on every head from `faa63b84` to `1abeb60f`.

## Routed beyond this slice

- `docs/TECH_DEBT.md` **[P3]**, new: *A model can name only the stops it requested: a bound view
  cannot list a task's stops.*
- `docs/TECH_DEBT.md`, *integer ranges on the wire*: fired again and not taken. `task_stop` adds a
  seventh `expectedRevision`.
- `docs/TECH_DEBT.md`, *generated tool names avoid the fixed names*: annotated. I1d added its two
  names.
- **I1 is complete.** All four slices have shipped. The plan's I1 heading, the I1d status line and
  the ledger entry are written as shipped in this PR. Nothing is owed to I2 or P1 from this slice
  beyond the routed entry above.

## Gates

The package gates and the matrix ran on the final source, `1abeb60f`. The repo-wide rebuild and the
verifiers ran on `d575f0d8`. Every later commit changes only `ts-agent-tasks`, mostly its tool code
and tests. The exported surface (`etc/ts-agent-tasks.api.md`) is unchanged since that rebuild, no
other package consumes the tool code, and CI's `build` runs the whole repo on every head.

| gate | result |
|---|---|
| `rush change --verify --target-branch origin/integration/agent-tasks-v1` | change file found, typed `minor` |
| `rushx build` (package) | clean, **zero warnings**; `etc/ts-agent-tasks.api.md` updated and checked in |
| `rushx lint` / `fixlint` | clean; `fixlint` changes nothing; prettier via the pre-commit hook |
| `rushx test` (package) | **95 suites, 2,212 tests passed, 0 failed; 100 % statements, branches, functions, lines; zero `c8 ignore`** |
| `rush rebuild` (repo-wide) | 37 operations, exit 0, no build warnings (4 min 26 s). The one "Warning" is Rush's standing note on a git-tracked symlink |
| repo-wide `rush test` | **not run.** Nothing outside this package changes what it accepts or classifies; the new surface is opt-in and new |
| `verify-capability-docs.mjs` | 24/24 documented, 75 reflexes, 0 failed |
| `generate-capability-feed.mjs --check` | 0 stale |
| `verify-esm-entrypoints.mjs` | 24 checked, 0 failed |
| `verify-bundler-resolution.mjs` | 20 checked, 0 failed |
| `verify-tarball-exports.mjs` | 26 packages, 205 paths, 0 failed |
| revert matrix | 27 rows, 56 red tests, 0 UNVERIFIED, 0 `0 red`, on `1abeb60f` (above) |
| CI `build` | green on every head, including `1abeb60f` |

