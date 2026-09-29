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
| `commit-indeterminate: the outcome is not known: a change may or may not have been applied; inspect before retrying` | broker's own indeterminate commit, **or a writer receipt that fails conversion** | nothing about other tasks; tells the model a blind retry may duplicate |
| `<tool>: the task writer failed; the change may or may not have been applied — inspect before retrying` | writer throws or rejects | as above |
| `<tool>: the request failed` | the host environment fails, throws or mints a malformed id; an unclassified failure | nothing; the environment's text (a socket path in the test) goes to the log |
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

*(filled in below from the final run)*

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

*(in progress)*

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

*(filled in from the final run)*
