**Shipped:** A host can opt a model into creating, updating and reassigning agent tasks — task_create, task_update and task_reassign beside the read tools, over the same principal-bound writer — authorized per call, with every id minted by the tool and every receipt checked before the model sees it.

# Result — `agent-tasks-i1b`

**I1b does not close the stream.** I1c and I1d follow; artifacts stay in
`.ai/tasks/active/agent-tasks-i1b/`, and this family finalizes at cluster close. Written 2026-09-29.

---

## What shipped

- **`createTaskTools({ view, renderer?, budget?, logger?, mutations? })`.** New optional
  `mutations: ITaskMutationToolOptions = { writer, environment, enable }`:
  - `enable: ReadonlyArray<TaskMutationToolGroup>` — `'tracked'` adds **`task_create`**
    (`createTracked`) and **`task_update`** (`updateTracked`); `'reassign'` adds **`task_reassign`**
    (`reassign`). Tools come in a fixed order whatever the order or repetition of `enable`.
  - `writer: IBoundTaskWriter` — must be **the very object passed as `view`** (build-time `===`).
  - `environment: Pick<ITaskEnvironment, 'newTaskId' | 'newOperationId'>` — mints every id the
    writer needs that the model must not supply. Usually the host's `TaskEnvironment`.
- **`task_inspect` now returns `revision`** (`ITaskInspectResolvedToolResult.revision`).
- **Types:** `TaskMutationToolGroup`, `allTaskMutationToolGroups`, `ITaskMutationToolResult`
  (`{ taskId, revision, disposition }`), `ITaskMutationToolOptions`.
- **Files:** `tools/mutationTools.ts` (new), `tools/writerAnswers.ts` (new), `tools/toolSupport.ts`
  (new — I1a's failure path moved here unchanged in behaviour so both tool families share it),
  `tools/schemas.ts`, `tools/taskTools.ts`, `tools/presentation.ts`, `types/tools.ts`. Largest file in
  the packlet is `mutationTools.ts` at ~300 lines; nothing in `storage/` was touched.

Nothing in `broker/` changed. The tools reach exactly five members of the binding: `query`,
`inspect`, `createTracked`, `updateTracked`, `reassign` (asserted with a recording proxy while
every tool runs — `mutations.test.ts` › *the tools reach only the writer members they name*).

## The revision decision — widen the read surface

`ITaskMutationIdentity` requires `expectedRevision`, and I1a exposed none. **Chosen: option 1.**
`task_inspect` returns the revision the view read (the projected envelope's, which T5's projector
contract already pins to the stored revision), and `task_update` / `task_reassign` require it back
as `expectedRevision`. The writer refuses a stale one twice — before authorization's related reads
and again inside the serialized writer section (`runCatalogMutation`) — as `conflict`.

- **Against option 2 (the tool reads, then writes).** The tool would read the current revision and
  supply it, so the writer's precondition would compare the tool's own read against itself. A host
  change landing between the model's inspection and its call would be silently overwritten: the
  model decided on state it never saw, and the window between the tool's read and its write would
  be the only one left checked — which is last-write-wins with extra steps. **Nothing** would detect
  a concurrent host mutation of the state the model reasoned about. Rejected.
- **Against option 3 (refuse the shape).** The argument for refusing was that the model cannot
  observe a revision. That was a gap in one read result, not in the model: the broker's precondition
  is already end to end, and the projector already carries the revision to the view. Closing the gap
  costs one integer on a surface the model is already reading. Refusing would have left the
  opt-in's whole purpose unimplemented to avoid a one-field change. Rejected.
- **Cost, stated.** A field on a shipped read surface (I1a's `ITaskInspectResolvedToolResult`); the
  only in-repo consumer assertion that pinned the result's keys (`reads.test.ts`) now includes it. A
  stale inspection is the model's to refresh, which is where it belongs: the refusal tells it to
  inspect again.
- **What the revision discloses.** Only the number of semantic changes to a task the principal can
  already read. No page carries it (a page has no repository generation by T5's design, and this
  slice did not add one); it is per-task, on a task the view authorized.

## The opt-in shape, and default construction

- **Default is off.** `factory.test.ts` › *builds exactly task_query and task_inspect* asserts the
  names for `createTaskTools({ view })` **and** for an empty `enable`; `publicSurface.test.ts` does
  the same through the package root; `requestCapture.test.ts` › *disabled: a writer passed as the
  view still offers exactly the two read tools* asserts the **names in the outbound body** for
  Anthropic and OpenAI. Names, never counts.
- **Opting in is not authorizing.** The factory's own tests build the tools over a writer and an
  environment that throw on any access; building succeeds, so nothing is asked, minted or cached at
  build time. `mutations.test.ts` › *capability checks are live*: a policy denying everything when
  the tools are built, then allowing, decides each call as it runs; a grant revoked after build is
  refused at the next call.
- **Why `writer === view`.** Reads and writes then go through one binding — one principal, scope
  set, projector and policy — so the revision the model reads is the one the writer checks, and a
  task the model can see is judged by the same policy that decides the write. A mismatched pair is
  refused at build time even with nothing enabled. The two-parameter form was kept (rather than
  "pass a writer instead of a view") so a mutation opt-in is visible at the call site; the check
  costs one comparison.
- **Unknown groups are refused** (`execute`, `stop`, `changeScopes`, a non-array).

## Where every id comes from

| id | minted by | what refuses a model-supplied one |
|---|---|---|
| `operationId` (every call) | `environment.newOperationId()`, re-converted through the renderer's id converter | every mutation schema is closed: `operationId` fails as a surplus property in `execute` (and in the harness before it). Tested for all three tools, plus a round trip through ai-assist with `operationId: 'complete-list-r1'` — the key T5's pump mints — refused before `execute` |
| new task `taskId` (`task_create`) | `environment.newTaskId()`, re-converted | `task_create`'s schema has no `taskId`; a supplied one fails as surplus |
| existing task `taskId` | the model — it names the task to change | the writer's visibility check; hidden and foreign ids refuse identically |

**Why the new task's id is minted too.** `createNative` answers an existing id it cannot see with
`not-found-or-denied`, and an unused id with success. A model choosing ids could therefore probe
for hidden tasks by attempted creation. With minting, the model never names a new id; a host
environment that collides with a hidden task gets the same refusal as any unseen task (tested).

**Why every call mints fresh.** T5's pump-key finding was a caller's operation id occupying a key
the pump would later mint. The model can name no key at all. The consequence — a retry is never a
replay — is handled by the unknown-outcome wording below. An environment that repeats an operation
id gets `conflict` on the second use, never another operation's receipt (tested).

## What the model may name as a responsible party

`task_create.responsibility` and `task_reassign.responsibility` are constrained by, in order: the
closed wire schema (`{ namespace, key }`), the broker's converter (`namespace` an identifier, `key`
one bounded line), and **the host's policy, asked at execution with `targetResponsibility`** — for
`create` and for `reassign`. Nothing else: responsibility grants no visibility (T5), so naming a
party gives it nothing (tested: bob's view cannot see a task reassigned to bob). Tested: a forged
`system/root` party is refused by a policy that denies it while `agent/ada` succeeds, and the policy
was asked with exactly those parties; a party outside the identifier syntax never reaches the policy.
`responsibility` on `task_reassign` is **required and nullable**: `null` unassigns, omission is an
argument error — never an accidental unassignment.

## What a model cannot reach, asserted by absence

- **No schema** (all five walked key by key) has `principal`, `scope`, `scopes`, `consumer`,
  `subscription`, `actor`, `binding`, `operationId`, `kind`, `recovery`, `initialObservation`,
  `lifecycle`, `status`, `stopPolicy` or `attention`; `task_create` has no `taskId`.
- **Direct calls with surplus fields fail**, and the writer is never asked (`mutationBoundary.test.ts`
  records every request a scripted writer receives).
- **Source binding / external lifecycle / registration:** no tool calls `registerExternal`,
  `execute`, `changeScopes`, `reparent`, `completeList`, `archive` or any stop method — the recording
  proxy's touched set is exactly `createTracked, inspect, query, reassign, updateTracked`. An
  unresolved external task refuses `task_update` as `unsupported`, naming no binding.
- **Deliberately not offered:** `attention` in the patch (references are host-owned identities a
  model could forge), `stopPolicy` on create (cascade semantics are I1d's), `createTaskList`.

## A writer's answer is checked the way a view's answer is

`writerAnswers.ts` converts every receipt before anything reads it:

- strict object, every field converted; `updateIds` bounded by `allUpdateCategories.length` (a commit
  owes at most one update per category — `planUpdates`);
- **identity**: the receipt's `taskId` and `operationId` must be the ones asked about;
- **revision**: a creation's receipt is revision 1, `changed`; a change's is `expectedRevision + 1`
  when `changed`, `expectedRevision` when `unchanged` — otherwise the revision the model would pass
  as its next `expectedRevision` is not one this request could have produced;
- **reassignment**: `current` must be the party asked for, absent for an unassignment — checked
  against the tool's **own copy** of the party, not the request object handed to the writer (a
  writer that rewrites its input cannot move the check; tested).

What the model is then told is `{ taskId, revision, disposition }`. **Not** `updateIds` — which ones
were retained says whether anyone else is subscribed to the task — **not** the operation id, and
**not** the previous party, which comes from the unprojected envelope (layer-1 P2-1; tested with a
projector that withholds responsibility).

## Every refusal a mutation tool returns, and what it discloses

Every failure reaches the model as `<tool>: <code>: <fixed description>`, or one of three fixed
lines; host text goes only to `logger`.

| refusal | produced by | what it tells a caller who may not have the task |
|---|---|---|
| `invalid arguments: <converter message>` (≤ 500 chars) | schema or broker request converter on the model's own arguments | nothing about any task: it describes the arguments the model sent (and can echo them) |
| `not-found-or-denied: the task is not found or not visible, or this is not permitted on it` | missing task; hidden task; hidden or foreign parent on create; visible task whose action the policy denies; create denied; forged party denied | **nothing distinguishing**: the same line for all of them, with no id (tested: hidden vs foreign for update, reassign and create's parent; hidden child of a visible parent; denied-but-visible vs foreign) |
| `conflict: the task changed, or does not accept this change now; inspect it again before deciding whether to retry` | stale `expectedRevision`; changed after authorization; archived tombstone; terminal parent; stop latch; repeated operation id | only reached **after** the subject is visible and the action authorized (`runCatalogMutation` steps 2–4; `createNative` checks `mayCreate` and the parent's `sees`/`may` first), so it describes a task the caller may act on |
| `unsupported: the request is not supported` | unresolved subject; non-native kind for a tracked update | same ordering: a visible, authorized subject |
| `commit-indeterminate: the outcome is not known: a change may or may not have been applied` + note | broker's own indeterminate commit, **or a writer receipt that fails conversion** | nothing about other tasks. The note for a change is `; inspect the task before retrying — a retry at the same expectedRevision is refused if the change moved the task, and changes nothing if it did not` (Copilot round 2), and for a creation `; if the task was created its id is <minted id>: inspect that id before creating it again` (Copilot round 1) |
| `the task writer failed; the change may or may not have been applied` + note | writer throws or rejects | as above |
| `the request failed; the change may or may not have been applied` + note | writer fails with no known code (Copilot round 1) | as above |
| `<tool>: the request failed` | the host environment fails, throws or mints a malformed id — before anything is sent | nothing; the environment's text (a socket path in the test) goes to the log |
| `storage-*`, `backpressure`, `retention-blocked`, … | the repository | fixed text only |

The `not-found-or-denied` and `conflict` descriptions were reworded from I1a's read-only phrasing
("the task is not found or not visible"; "tasks changed while this was being answered; retry"):
the first now covers a refused action, the second no longer tells a model to blindly retry a change
that may be permanently refused. `commit-indeterminate` previously said "an earlier operation"; for
a mutation the unknown outcome is this call's (layer-1 P2-2).

## Every check-then-act window in the diff

The tool code itself **authorizes nothing and reads nothing before it writes.** Every window below
is either closed by the writer or by a check the tool makes after the `await`.

| window | what was read or decided before | what re-checks after |
|---|---|---|
| model's `task_inspect` → later mutation call | the revision the model decided on | the writer, twice: `_stale` before authorizing related tasks, and `revisionOf(found) !== expectedRevision` inside `core.gated`; the epoch is re-checked immediately before the commit (T5) |
| `execute` re-validation → `plan` (mint) → `await writer.*` | validated arguments; minted ids | no `await` between validation and the call; the writer re-converts the request with its own strict converter |
| `await writer.*` → reading the receipt | the requested `taskId`, minted `operationId`, `expectedRevision`, and the party asked for — all captured before the call | `writerAnswers` converts the receipt and checks it against those captured values; the party is the tool's own copy, so the writer cannot alter what the receipt is checked against |
| `await ask()` → `present` | — | `convertAnswer` runs before `present` reads any field |
| factory build → every later call | the `enable` set and the `writer === view` identity (host configuration) | authority is not captured at build: every call goes to the writer, which asks the policy then (tested both directions) |
| `createNative` parent read → commit | parent visible, authorized, open | `recheckParent` inside the writer; epoch immediately before `_register` (broker, unchanged) |

No value read before a writer call is used after it for anything but checking the writer's answer.

## The request-body capture

`requestCapture.test.ts` › *mutation tools reach the outbound request only when opted into*, running
ai-assist's own `executeClientToolTurn` with the real provider descriptors:

- **Disabled** (a writer passed as `view`, no `mutations`): Anthropic and OpenAI bodies carry exactly
  `['task_query', 'task_inspect']`.
- **Enabled**: Anthropic — all five as `{ name, description, input_schema }` equal to each tool's
  `toJson()`; OpenAI Responses — all five as function tools with exact `parameters`; Gemini — all five
  declaration names.
- **Round trips:** a streamed `task_update` at the inspected revision runs through the real writer and
  returns `{ taskId, revision: 2, disposition: 'changed' }`; a streamed `task_update` naming
  `operationId` is refused by the harness before `execute`, and the task stays at revision 1.

`factory.test.ts` pins the three new wire schemas as literals, including `task_reassign`'s
`type: ['object', 'null']`.

## Revert matrix — run on final source

**Final run** — `perf/mutationMatrix.js --pkg <git-archive copy of e068ab15> I1b-1 … I1b-24` plus the
seven I1a rows this slice re-pointed (`I1a-8, 9, 10, 11, 19, 22, 31` — the failure path moved to
`toolSupport.ts`), after Copilot round 1 changed the shared failure path. **74 red tests across
31 rows; 0 UNVERIFIED, 0 `0 red`.**

- **Two earlier runs, both kept honest.** The first ran concurrently with the repo-wide rebuild and
  reported `I1b-1…3` as `did not build` — the rebuild had removed `ts-json-base`'s declarations
  mid-run. It was discarded whole. The second (29 rows on `3959070d`) found **I1b-10 at `0 red`**:
  the protection was real, the test was not. The mutant checks the reassignment receipt against the
  request object handed to the writer instead of the tool's own copy; the test's rewriting writer
  *replaced* `request.responsibility`, and the mutant had already captured the old object — so it was
  invisible. The test now rewrites the party **in place**, which is exactly what the copy defends
  against, and the row turns that test red.
- **I1b-23 and I1b-24** are Copilot round 1's protections (unclassified mutation failure reported as
  unknown; an unknown creation names the id it would have).
- Paired rows: **I1b-4** and **I1b-5**. A model-supplied operation id or new task id is refused by the
  closed schema *and* would be ignored anyway, because the tool builds the writer's request from named
  fields and its own minted ids. Reverting the schema alone (I1b-1/2) is caught by the surplus-field
  tests; the pair reverts both and shows the id would then be **honoured**.
- **The runner itself had a hole, found by the orchestrator's gating re-run and fixed here.**
  `classify()` fell back to a `'? red'` verdict whenever the run produced no `Failures: <n>` line,
  and the summary filter treated only `UNVERIFIED*` and exactly `'0 red'` as a problem — so a row
  that counted *nothing* was reported as a pass, and the runner exited 0. The case is easy to hit:
  a `--pkg` copy made without the `node_modules` symlink the usage notes call for runs no tests at
  all, and three rows came back `? red` / "0 UNVERIFIED or 0 red". Such a run is not evidence in
  either direction, so it is now `UNVERIFIED: the run reported no failure count`, which the summary
  counts and which exits 1 (both verified: the same deps-less copy now reports UNVERIFIED and the
  runner exits 1; a correctly linked copy is unaffected). The header's stated rule was widened to
  match. **No I1b or I1a row's verdict changes** — every row in the table above was run on a
  correctly linked copy and reported a real count.
- **Three rows re-verified independently** on a `git archive` copy of `02cdbe20d` with
  `node_modules` linked, by the orchestrator: I1b-10 (1 red), I1b-12 (7 red), I1b-22 (1 red) —
  identical counts and identical test names to the table above.
- Not in the matrix (structural, asserted by test rather than by a single guard line): building the
  tools touches neither the writer nor the environment; the tools reach only five binding members.
- The storage rows `M13, M20, M23, M34, M39, M49` report `UNVERIFIED` under `--check` on this branch
  and on the I1a base (`387969ed`) alike — verified with `--check` on an archive of the base: they
  point at storage lines that later refactors moved. Routed to `docs/TECH_DEBT.md`.

| row | verdict | suites that went red |
|---|---|---|
| I1a-8 failure messages are not truncated | 2 red | failure messages are bounded › a message echoing a huge argument is cut to the bound<br>failure messages are bounded › the cut never splits a surrogate pair |
| I1a-9 truncation may split a surrogate pair | 1 red | failure messages are bounded › the cut never splits a surrogate pair |
| I1a-10 what a view threw reaches the model | 4 red | a failure tells the model a code, never host text › when the view rejects, the model is told only that it failed<br>a failure tells the model a code, never host text › when the view throws synchronously, the model is told only that it failed<br>a writer's answer is checked the way a view's answer is › a creation whose outcome is unknown names the id, and inspecting it says whether it happened<br>a writer's answer is checked the way a view's answer is › a writer that throws, rejects or fails with host text tells the model only a code |
| I1a-11 a view's rejection escapes the capture | 4 red | a failure tells the model a code, never host text › when the view rejects, the model is told only that it failed<br>a failure tells the model a code, never host text › when the view throws synchronously, the model is told only that it failed<br>a writer's answer is checked the way a view's answer is › a creation whose outcome is unknown names the id, and inspecting it says whether it happened<br>a writer's answer is checked the way a view's answer is › a writer that throws, rejects or fails with host text tells the model only a code |
| I1a-19 a classified failure's host message reaches the model | 19 red | a failing projector fails the call — it never yields more › the renderer's projection failing fails the call, with no partial page<br>a failing projector fails the call — it never yields more › the view's details projector failing fails the inspection<br>a failing projector fails the call — it never yields more › the view's envelope projector throwing or failing fails query and inspect<br>a failure tells the model a code, never host text › a classified failure is its code and a fixed description; its message goes to the host<br>a view is any IBoundTaskView: every field it returns to the model is checked › a page whose completeness or freshness is not a known value fails the call<br>a view is any IBoundTaskView: every field it returns to the model is checked › an inspection whose commands or archived flag are malformed fails the call<br>a view's whole answer is converted before anything reads it › a page holding more tasks than were asked for fails, rather than widening the bound<br>a view's whole answer is converted before anything reads it › an inspection whose state is neither resolved nor unresolved fails, never reads as resolved<br>a view's whole answer is converted before anything reads it › malformed issues, or a field a page does not have, fail the call<br>a writer's answer is checked the way a view's answer is › a creation whose outcome is unknown names the id, and inspecting it says whether it happened<br>a writer's answer is checked the way a view's answer is › a receipt for another task, operation or revision, or with fields a receipt lacks, fails the call<br>a writer's answer is checked the way a view's answer is › a writer that throws, rejects or fails with host text tells the model only a code<br>ids the host mints › a minted task id that collides with a hidden task is refused like any unseen task<br>task_create › a creation the policy refuses is refused, and says no more than a missing task would<br>task_create › a hidden parent and a foreign parent are refused identically<br>task_update › a stale revision is refused, and the task is left as it is<br>task_update › an unresolved external task takes no update, and the refusal names no binding<br>task_update › an update the policy refuses on a visible task says no more than a missing task would<br>what a page carries besides the rendered text is checked, not trusted › a malformed cursor from the view fails the call rather than reaching the model |
| I1a-22 a view's failure code is trusted | 1 red | a view is any IBoundTaskView: every field it returns to the model is checked › a failure code outside the known set is treated as no code at all |
| I1a-31 an inspection is read without being converted | 2 red | a view is any IBoundTaskView: every field it returns to the model is checked › an inspection whose commands or archived flag are malformed fails the call<br>a view's whole answer is converted before anything reads it › an inspection whose state is neither resolved nor unresolved fails, never reads as resolved |
| I1b-1 task_create execute trusts its arguments | 2 red | execute re-validates its arguments with no harness in front › a model cannot name the new task id, a scope, a stop policy or anything that grants authority<br>execute re-validates its arguments with no harness in front › a model-supplied operation id is refused, never honoured |
| I1b-2 task_update execute trusts its arguments | 2 red | execute re-validates its arguments with no harness in front › a model-supplied operation id is refused, never honoured<br>execute re-validates its arguments with no harness in front › surplus and malformed fields on an update or reassignment fail before the writer is asked |
| I1b-3 task_reassign execute trusts its arguments | 3 red | execute re-validates its arguments with no harness in front › a model-supplied operation id is refused, never honoured<br>execute re-validates its arguments with no harness in front › surplus and malformed fields on an update or reassignment fail before the writer is asked<br>task_reassign › reassigns, and unassigns only when null is given explicitly |
| I1b-4 a model's operation id is honoured (schema closure and the tool's own id both reverted) | 2 red | execute re-validates its arguments with no harness in front › a model-supplied operation id is refused, never honoured<br>execute re-validates its arguments with no harness in front › surplus and malformed fields on an update or reassignment fail before the writer is asked |
| I1b-5 a model's new task id is honoured (schema closure and the minted id both reverted) | 2 red | execute re-validates its arguments with no harness in front › a model cannot name the new task id, a scope, a stop policy or anything that grants authority<br>execute re-validates its arguments with no harness in front › a model-supplied operation id is refused, never honoured |
| I1b-6 a writer's receipt is read without being converted | 2 red | a writer's answer is checked the way a view's answer is › a reassignment receipt naming a party other than the one asked for fails the call<br>a writer's answer is checked the way a view's answer is › a receipt for another task, operation or revision, or with fields a receipt lacks, fails the call |
| I1b-7 a receipt for another task or operation is accepted | 1 red | a writer's answer is checked the way a view's answer is › a receipt for another task, operation or revision, or with fields a receipt lacks, fails the call |
| I1b-8 a receipt's revision is not tied to the request | 1 red | a writer's answer is checked the way a view's answer is › a receipt for another task, operation or revision, or with fields a receipt lacks, fails the call |
| I1b-9 a reassignment receipt may name another party | 1 red | a writer's answer is checked the way a view's answer is › a reassignment receipt naming a party other than the one asked for fails the call |
| I1b-10 the party is checked against the request object the writer was handed | 1 red | a writer's answer is checked the way a view's answer is › a reassignment receipt naming a party other than the one asked for fails the call |
| I1b-11 a receipt's update ids are unbounded | 1 red | a writer's answer is checked the way a view's answer is › a receipt for another task, operation or revision, or with fields a receipt lacks, fails the call |
| I1b-12 update ids reach the model | 7 red | a writer's answer is checked the way a view's answer is › a reassignment receipt naming a party other than the one asked for fails the call<br>a writer's answer is checked the way a view's answer is › the model is told the task, its revision and the disposition — never update ids or the operation id<br>mutation tools reach the outbound request only when opted into › round trip: an update at the inspected revision runs through the writer<br>task_create › creates a tracked task under an id the tool minted, visible to the view that created it<br>task_reassign › reassigns, and unassigns only when null is given explicitly<br>task_reassign › the previous party is never returned: a projector may withhold it from this principal<br>task_update › changes a task at the revision task_inspect returned, and returns the next revision |
| I1b-13 a writer's malformed receipt reads as a refusal, not an unknown outcome | 2 red | a writer's answer is checked the way a view's answer is › a reassignment receipt naming a party other than the one asked for fails the call<br>a writer's answer is checked the way a view's answer is › a receipt for another task, operation or revision, or with fields a receipt lacks, fails the call |
| I1b-14 a writer's throw reads as a view failure, not an unknown outcome | 1 red | a writer's answer is checked the way a view's answer is › a writer that throws, rejects or fails with host text tells the model only a code |
| I1b-15 the mutation writer need not be the view | 1 red | createTaskTools › refuses a mutation opt-in whose writer is not the view, or that names an unknown group |
| I1b-16 an unknown mutation group is accepted | 1 red | createTaskTools › refuses a mutation opt-in whose writer is not the view, or that names an unknown group |
| I1b-17 tracked tools are offered without their opt-in | 1 red | createTaskTools › offers each opted-in mutation group, and only those, without touching the writer or minting |
| I1b-18 the reassign tool is offered without its opt-in | 1 red | createTaskTools › offers each opted-in mutation group, and only those, without touching the writer or minting |
| I1b-19 a minting failure's host text reaches the model | 2 red | ids the host mints › an environment that fails, throws or mints a malformed id fails the call, and names nothing<br>ids the host mints › without a logger, a minting failure is still reported to the model as a fixed line |
| I1b-20 a minting throw escapes the tool | 1 red | ids the host mints › an environment that fails, throws or mints a malformed id fails the call, and names nothing |
| I1b-21 a minted id is not converted | 1 red | ids the host mints › an environment that fails, throws or mints a malformed id fails the call, and names nothing |
| I1b-22 task_inspect does not return the revision it read | 1 red | task_update › changes a task at the revision task_inspect returned, and returns the next revision |
| I1b-23 a mutation's unclassified failure reads as a refusal, not an unknown outcome | 1 red | a writer's answer is checked the way a view's answer is › a writer that throws, rejects or fails with host text tells the model only a code |
| I1b-24 a creation whose outcome is unknown does not name the id it would have | 3 red | a writer's answer is checked the way a view's answer is › a creation whose outcome is unknown names the id, and inspecting it says whether it happened<br>a writer's answer is checked the way a view's answer is › a receipt for another task, operation or revision, or with fields a receipt lacks, fails the call<br>a writer's answer is checked the way a view's answer is › a writer that throws, rejects or fails with host text tells the model only a code |

## Review

### Layer 1 — `code-reviewer`, before any coverage work

Asked the authorization-boundary questions explicitly (check-then-act windows; authority, id and
member reach; every refusal's disclosure; writer-answer conversion; the `writer === view` check;
failure-text accuracy). **No P1. Three P2, all resolved.**

- **P2-1 (fixed):** `task_reassign` returned `previous` from the unprojected envelope, so a principal
  whose projector withholds responsibility learned the old party. The model now gets
  `{ taskId, revision, disposition }` only; tested with a withholding projector. `current` is still
  checked on the receipt.
- **P2-2 (fixed):** unknown outcomes were reported as refusals or as "an earlier operation". A writer
  receipt that fails conversion is now `commit-indeterminate`, a writer throw/rejection says the
  change may have been applied, and `commit-indeterminate`'s text says so — a fresh-id retry of a
  creation could duplicate it.
- **P2-3 (dispositioned):** the inline `@rushstack/no-new-null` disable on `ITaskReassignToolArgs`.
  The `null` is the JSON wire value `JsonSchema.object({ nullable: true })` validates — the repo's
  established carve-out, taken the same way by `ts-json-base`'s own factories,
  `ts-agent-memory-sqlite-vec` and ai-assist's streaming adapters, with the reason on the directive.
- **P3 applied:** the receipt check now ties revision and disposition to the request; the party is
  checked against the tool's own copy; `groups` typed as `TaskMutationToolGroup`; the flattening
  `onSuccess` commented; the responsibility schema shared (`responsibilityProperties`); log text no
  longer says "the view" on the writer path; the too-many-update-ids test derives from
  `allUpdateCategories`; the update-ids test now forwards to the real writer and asserts the writer
  *did* retain updates while the model saw none; tests added for a minted id colliding with a hidden
  task and for a repeated operation id.
- **P3 dispositioned:** ids are minted before the broker converter validates the model's fields, so
  an invalid title wastes two ids — harmless, and the converter's message cannot quote a minted id
  (both were validated when minted, and field errors name the failing field).

Coverage then reached 100 % with one added test (a minting failure with no logger).

### Layer 2 — Copilot

**Round 1 (on `fc789c9b`) — one high, one medium; both real, both fixed.** Both are the unknown-outcome
class layer-1 P2-2 opened, found one level further.

| finding | fix |
|---|---|
| **(high)** a writer failure with **no known code** reached the model as `the request failed`, a refusal — but a custom writer can commit and then return a bare `fail(...)`, and the next create mints fresh ids, so a retry could duplicate | failure wording is now per tool family (`IFailureWording`: `thrown`, `unclassified`, `unknownOutcome`). Reads keep I1a's text exactly. Mutations say the change may or may not have been applied for a throw, an unclassified failure, and `commit-indeterminate` (which a malformed receipt reports). A **classified** failure other than `commit-indeterminate` is the writer's own account of the outcome and gets no note. Tests pin all four update texts and both create texts. Matrix row I1b-23 |
| **(medium)** "inspect before retrying" gave a create no way to inspect: the minted id was lost with the failure | an unknown-outcome creation now names the id the task has if it was created. **This discloses nothing about other tasks**: the id was minted by the host, not chosen by the model; `task_inspect` answers a task this principal cannot see exactly as a missing one; and a collision with a hidden task is refused (`not-found-or-denied`, a determinate code) before anything is committed, so it never reaches this path. Test: a writer that commits then throws — the named id inspects as `resolved`; a writer that throws before committing — the named id is refused with exactly the hidden-task text. Change tools need no id: a retry carries the revision it read. (That reasoning was stated here as "which an applied change has moved" — **refuted by round 2 below**: a no-op commits `unchanged` with the revision unmoved. The conclusion survives, the stated reason did not.) Matrix row I1b-24 |

**Round 2 (on `a2db061e`) — one medium, one low; both real, both fixed.** It did not run on four API
requests (16:32, 16:48, 17:21, 18:23 UTC) and ran after an `@copilot review` comment at 19:41 UTC,
posting at 22:37.

| finding | fix |
|---|---|
| **(medium)** the change tools' unknown-outcome note — and the comment on it — claimed an applied change always moves the revision. A no-op (a repeated patch, the current party) commits as `unchanged` with the revision unmoved, so inspection cannot tell "not applied" from "applied as a no-op" | the note now states the actual guarantee: *a retry at the same expectedRevision is refused if the change moved the task, and changes nothing if it did not*. The comment says inspection cannot, and need not, distinguish the two. **Declined: host-side reconciliation before a retry.** A retry is safe in both cases by the writer's own precondition — it can never apply a second, different change. What it can do is record another operation against the record, which is no different from the model calling a no-op update twice, and the record's operation capacity is the host's existing, finite bound (T8b); the tool adds nothing there. Tests pin the new text on all four update paths |
| **(low)** `CAPABILITIES.md` still said the factory takes "never a writer" and calls only read methods | now: without `mutations` the tools call only `query` and `inspect`; a bound writer can be passed as the view, and must be to opt mutations in. The unknown-outcome bullet is corrected the same way as the medium |

No source line a matrix row targets moved (the change is a string and a comment), so the round-1 matrix
stands; `--check` confirms every I1 row's pattern.

**Loop stopped at 2 rounds on diminishing returns.** Round 1 found a genuine high (an unclassified
writer failure read as a refusal) and a medium in the same unknown-outcome class. Round 2 found no
authorization or ordering defect at all — one finding was the accuracy of a model-facing sentence, the
other a stale doc line — which is the signal `CODING_STANDARDS.md` names for stopping, on an
authorization boundary as elsewhere. Every review thread is resolved.

## Routed beyond this slice

- `docs/TECH_DEBT.md` **[P3]** integer ranges unstated on the wire — **the trigger fired here**
  (`expectedRevision`, progress amounts) and was not acted on: the fix is a `ts-json-base` extension
  outside this slice's package surface. Re-armed for I1c.
- `docs/TECH_DEBT.md` **[P3]** nothing enforces that I1c's generated tool names avoid the fixed
  names — trigger: I1c.
- **For I1c:** the fixed names are `task_query`, `task_inspect`, `task_create`, `task_update`,
  `task_reassign`; `toolSupport.ts` is the shared failure path; `writerAnswers.ts` is where a command
  receipt converter belongs; commands go through `IBoundTaskWriter.execute`, which I1b deliberately
  does not reach.
- **For I1d:** `stopPolicy` is not settable on `task_create`; stop tools decide what a model may ask.
- **Not offered, no trigger:** `createTaskList` (a `lists` group would be additive).

## Gates

Run locally. Package gates and the matrix on `e068ab15` (after Copilot round 1); repo-wide rebuild and
test on `3959070d`. Round 1 changed only `tools/` wording and its tests — no type, signature or export
moved (`etc/ts-agent-tasks.api.md` unchanged), and no other package consumes the tool messages — so the
repo-wide gates stand; CI's `build` runs the whole repo on every head regardless.

| gate | result |
|---|---|
| `rush change --verify --target-branch origin/integration/agent-tasks-v1` | change file found (`minor`) |
| `rushx build` (package) | clean, **zero warnings**; `etc/ts-agent-tasks.api.md` updated and checked in |
| `rushx lint` / `rushx fixlint` | clean; fixlint applied before each commit (via the pre-commit prettier hook and `eslint --fix`) |
| `rushx test` (package) | **91 suites, 2,114 tests passed; 100 % statements, branches, functions, lines; zero `c8 ignore`** |
| `rush rebuild` (repo-wide) | exit 0, no warnings (4 min 3 s) — required: `task_inspect`'s result widened |
| `rush test` (repo-wide) | exit 0 (7 min 5 s) |
| `verify-capability-docs.mjs` | router 21,531/24,000, 24/24 documented, 75 reflexes, 0 failed |
| `generate-capability-feed.mjs --check` | 0 stale |
| `verify-esm-entrypoints.mjs` | 24 checked, 0 failed |
| `verify-bundler-resolution.mjs` | 20 checked, 0 failed (after `install-autoinstaller --name rush-bundler-check`) |
| `verify-tarball-exports.mjs` | 26 packages, 205 paths, 0 failed (after `install-autoinstaller --name rush-pack-check`) |
| revert matrix | 31 rows, 74 red tests, 0 UNVERIFIED, 0 `0 red`, on `e068ab15` (above) |
