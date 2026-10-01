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
| `not-found-or-denied` | `task_stop: not-found-or-denied: …` — exactly a missing task (tested: denied root, hidden root, missing id) |
| `unsupported` | `task_stop: unsupported: …` (the root's stop policy does not permit the mode, or it is not a native root) |
| any other code | its code line **+** `; the stop may or may not have been accepted — if it was, its intentId is <id>: inspect it with task_stop_inspect before requesting it again` |
| no known code / a throw / a malformed result | `the request failed` / `the task writer failed` / `commit-indeterminate: …`, each with the same tail |

Every non-determinate case can follow an accepted stop: after the commit, `presentStop` reads every
target and can fail with a storage code, or `conflict` when the intent or policy moved while it
presented. A retry is harmless either way — a second stop of a mode already latched on the root is
refused `conflict` — but it would not tell the model the first one's id, hence the tail.

`not-found-or-denied` **can** follow a commit in one broker path (the root hidden between the commit
and the presentation's re-read). The line is then still true — the root is not visible now — and the
model could not inspect the stop anyway. `unsupported` is produced only before the writer section.

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

<!-- REVIEW, MATRIX, GATES: filled in below as they complete -->
