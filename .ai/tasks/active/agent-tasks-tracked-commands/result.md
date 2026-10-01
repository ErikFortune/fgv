**Shipped:** A model can now move a tracked task's lifecycle — `fgv.tracked@1` registers all eleven of its transitions with parameter schemas, so a host offers any of them as typed command tools, one by one, while the broker's own converter stays the authority on what it accepts.

# Result — `agent-tasks-tracked-commands`

A fifth I1 slice, beside I1d. Artifacts stay in `.ai/tasks/active/agent-tasks-tracked-commands/`;
the family finalizes at cluster close. Written 2026-10-01.

---

## What shipped

- **`trackedTaskDescriptor()` registers all eleven `trackedTaskCommandNames`** — `start`, `wait`,
  `pause`, `resume`, `succeed`, `fail`, `cancel`, `set-title`, `set-description`, `set-progress`,
  `set-attention` — each an `ITaskCommandHandle` built by `createTaskCommandHandle` over a
  `JsonSchema` parameter schema. The schemas live in a total
  `Record<TrackedTaskCommandName, ISchemaValidator<unknown>>`, so adding a twelfth name to the
  vocabulary is a compile error until it has a schema; a test pins the registered names equal to
  `trackedTaskCommandNames`, in order.
- **No change to `packlets/tools/`, `broker/` or any type.** I1c's generator picks the commands up
  from the registry: `{ kind: trackedTaskKind, detailVersion: 1, command }` in `enable` is all a host
  writes. `etc/ts-agent-tasks.api.md` is unchanged — the descriptor's return type already had
  `commands?`.
- **Encoder:** the identity onto JSON (`JsonConverters.jsonValue`). **Dispatch values:**
  `idempotency: 'none'`, `conditional: false` — read only on external paths; the values that
  authorize nothing (layer-1 P2-1, below).
- **Files:** `converters/builtinKinds.ts`; tests `converters/trackedCommandSchemas.test.ts` (new),
  `tools/trackedCommandTools.test.ts` (new), `converters/kindRegistry.test.ts` (the "empty command
  registry" test now uses `fgv.task-list@1`, which still registers none); `perf/mutationMatrix.js`
  rows `TC-1…TC-11`; `CAPABILITIES.md`; `docs/TECH_DEBT.md`; the plan; the ledger; a `minor` change
  file. `types/trackedCommands.ts` and `broker/commands.ts` needed no change.

## The decision: two validators, with agreement as a fixture obligation (option 1)

**Chosen: register schemas; `_prepare` keeps validating with `trackedCommand`, which stays
authoritative.** Verified first: `_prepare` (`broker/commands.ts`) never consults the registry — it
checks the name against `trackedTaskCommandNames` and converts through
`core.converters.broker.trackedCommand`. So there are two validators and no runtime cross-check.

**Why not unify (option 2).** Its promise is *one authority, no obligation to maintain*. It cannot
deliver that here, for a reason the brief did not state:

1. **The wire subset cannot express the converter.** `JsonSchema` has no lengths, patterns, ranges
   or cross-field constraints. The converter is built from `ITaskFieldBounds` and enforces:
   single-line bounded titles, identifier-grammar codes and reference namespaces, a canonical
   `YYYY-MM-DDTHH:mm:ss.sssZ` instant that round-trips, non-negative finite amounts,
   `total >= completed`, non-empty summaries, a bounded reference count. A unified `_prepare` would
   therefore have to run the schema **and then** `trackedCommand` behind it (the encoder is the only
   place to put it). That is still two validators — in series instead of side by side — and the
   agreement obligation does not go away: it changes from "a usability defect if they disagree" to
   "a broker refusal if they disagree".
2. **It narrows what the broker accepts, for every caller.** Host code calling `execute` directly
   would start being refused by a model-facing schema wherever that schema is narrower than the
   converter — e.g. a numeric-string amount, which the converter coerces and the strict schema
   refuses (pinned below). Today that only means a model is not offered a spelling; unified, it
   would break a host.
3. **It couples a native broker path to registration.** `fgv.task-list@1` goes through the same
   `_prepare` and registers no commands. Unified, every list command (`fail`, `cancel`, `set-*`)
   would start refusing until the list registered the same schemas; so would a host registry built
   from its own tracked descriptor. Bounds are also per broker (`TaskConverters.create({ bounds })`),
   while a descriptor is static — the schema cannot know them.

**What option 1 costs, stated.** The obligation is discharged only by the fixtures, and a later edit
to either side can break it silently at runtime. The fixtures are therefore the deliverable (next
section), and the revert matrix shows each schema member is held by a named test.

**How wrong a disagreement can go.** `trackedCommand` decides, so a disagreement is a **usability**
defect, not a safety one: either a model is offered a shape the broker refuses, or it is refused
(by the harness or the tool's own re-validation) a shape the broker would have taken. Nothing the
schema admits bypasses the converter.

## Agreement fixtures (`trackedCommandSchemas.test.ts`)

Every fixture is run through both validators and its pair of verdicts pinned, so a drift on either
side turns that row red. Values were picked so right and wrong answers differ — never a value both a
correct and a drifted schema would treat the same.

| set | rows | what each exposes |
|---|---|---|
| both accept | 23 | every optional member present and absent (`attention`, `notBefore`, `outcome` on `fail`/`cancel`, `description`, `progress`); empty lists (`attention: []`, `artifacts: []`); `progress: {}`; a fractional amount; `total == completed`; a multi-line description (`boundedText`, not single-line); `null` for `start`/`resume` (below) |
| both refuse | 28 | surplus members at each level (parameters, reason, reference, progress); a waiting-only `notBefore` on a plain reason; `outcome` without `artifacts`; a reason where an outcome belongs; `fail` with no reason; a single reference where a list belongs; `null` for each object member (`reason`, `outcome`, `attention`, `progress`, `description`); wrong scalar types |
| only the schema accepts | 19 | the bounds the wire cannot state: empty / two-line / over-bound title (`maxTitleLength + 1`, from the fixture bounds); empty description; non-identifier code; empty summary; zone-offset and impossible-date `notBefore`; non-identifier reference namespace; two-line reference key; one reference and one artifact over `maxReferences`; negative amount; an infinite amount (not sendable as JSON, reachable by a direct `execute`); `total < completed`; two-line phase and unit; empty progress summary; empty outcome summary |
| only the converter accepts | 1 | a numeric-string amount (`'3'`): the converter's `Converters.number` coerces, the strict schema refuses — the direction that denies a model nothing it was told it could send |

Plus: every command has at least one accept and one refuse row; and the schema admits the canonical
form the converter produces from every agreed value (what is stored must itself be offerable).

**Two findings from the fixtures.** (1) `Converters.strictObject({})` — and so `JsonSchema.object({})`
— converts `null` to `{}`; any object converter *with* a field refuses `null`. Both sides agree, so
`start`/`resume` accept `parameters: null` and store `{}`; pinned as agreed, routed as a `ts-utils`
P4. (2) The numeric-string coercion above.

The wire forms of all eleven schemas are pinned as literals (`JsonSchema.toJson`), including every
`description`, through the descriptor and through a registry's `getCommand` — the lookup I1c's
generator makes.

## End-to-end, through the real broker (`trackedCommandTools.test.ts`)

`brokerHarness()` (a real `FileTreeTaskRepository` and `TaskBroker`), the writer as view and command
writer, `brokerRegistry()` as the tools' registry, all eleven offered under their default names
(`task_command_start`, …, `task_command_set-attention` — tracked names need no replacement).

| call | observed through `task_inspect` |
|---|---|
| `task_command_start {}` at revision 1 → `applied`, revision 2 | `pending` → `running`; `start` and `resume` no longer in `commands` |
| `task_command_wait` with a canonical `notBefore` → `applied`, revision 3 | `waiting`; `resume` offered |
| `task_command_resume {}` | `running` |
| `task_command_pause` | `paused` |
| `task_command_succeed` → `applied`, revision 6 | `succeeded`; `commands: []` |
| `fail` (no outcome), `cancel` (with outcome) | `failed`, `cancelled` |
| `set-title`, `set-description`, `set-progress`, `set-attention` | fields changed in the committed envelope, lifecycle still `pending`; omitting `description` / `progress` clears it |

And through a model turn: ai-assist's `executeClientToolTurn` with a captured Anthropic stream in
which the model calls `task_command_start` — the tool result is `{ taskId: 't1', state: 'applied',
revision: 2 }` and `task_inspect` then reports `running`.

## Empty parameters on the wire

`start` / `resume` emit `{ type: 'object', properties: {}, additionalProperties: false, description }`
— no `required`. Captured outbound requests: Anthropic's `input_schema` and OpenAI Responses'
`parameters` carry it unchanged inside the command envelope (`parameters` required there); Gemini's
adapter drops `additionalProperties`, leaving `{ type: 'object', properties: {}, description }`.
**Not verified live**: Gemini's OpenAPI-subset `parameters` has historically refused an `OBJECT`
with empty `properties`, and no test can call the API. I1c already sent this exact shape for an
external `resume`. Routed P3 (`docs/TECH_DEBT.md`), with the likely fix in `packlets/tools/`.

## No new disclosure channel

- **Stale `expectedRevision`** → `_prepare` refuses as `conflict`; the model gets I1c's fixed conflict
  line and the task does not move (tested; matrix TC-10).
- **A transition unavailable from the current status** (`resume` on a `pending` task, `start` on a
  `succeeded` one) → `invalid-transition` → the same fixed conflict line. Tested that the line names
  no status (`waiting`, `paused`, `pending`, `succeeded`, `terminal`) and not `invalid-transition`
  (matrix TC-11). What *is* available is what `task_inspect` already reports, filtered by policy.
- **A command the policy denies** → exactly the line a hidden task and a missing id give; and
  `task_inspect` stops listing it.
- **A task list** → a tracked tool refuses it as `unsupported` (kind check), nothing sent.
- **A shape the schema refuses** → `invalid arguments`, never reaches the writer.
- **A value only the converter refuses** (a two-line title) → the writer fails `invalid` before
  recording anything, and I1c reads that as the **unknown** line ("do not send it again"). Wrong
  advice, safe direction; it discloses nothing. Pinned as a known-wrong expectation that the fix must
  change; routed to `packlets/tools/` (I1d's) as a P3.

## What a host is told (`CAPABILITIES.md`, and `trackedTaskDescriptor`'s TSDoc)

- **All eleven are registered; the host's `enable` list is the choice.** Withholding a schema would
  withhold the command from every host, including one driving its own trusted actor; I1c's opt-in
  is already per command. No command was judged one that must never be tool-reachable.
- **References are accepted on syntax alone.** Not only `set-attention`: every reason's `attention`
  (`wait`, `pause`, `fail`, `cancel`) and every outcome's `artifacts` (`succeed`, `fail`, `cancel`)
  are references — six distinct commands of the eleven (`wait`, `pause`, `succeed`, `fail`, `cancel`,
  `set-attention`). Verified: nothing in `broker/` or
  `implementations/` resolves a reference; the converter checks namespace identifier syntax, a
  single-line bounded key, and the count. A model can assert one it made up, and a non-empty
  `attention` makes the task's baseline delivery category `attention` (`delivery.ts`). I1b withheld
  `attention` from `task_update` for exactly this; offering any of the six offers it back.
  `defaultTaskProjector` strips outcome artifacts from views but not `attention`. The wire
  descriptions also tell the model to use only references the host gave it — advice, not a control.
- **`succeed`, `fail`, `cancel` assert a final state on the host's behalf** — terminal states are
  absorbing. `succeed` always carries an outcome; `fail` and `cancel` may, and any outcome sent is
  stored as the task's result.

## Every check-then-act window in the diff

None new. The slice adds data (registrations) and no code path: `_prepare`, the writer section and
the tool are unchanged. The windows a tracked command passes through are T5's (`execute`: epoch
captured before the first policy question; revision re-read and epoch rechecked under the writer,
immediately before the commit) and I1c's (inspection → `execute`, kind immutable; receipt checked
against copies captured before the writer). The tests exercise them unchanged.

## Revert matrix — run on final source

`perf/mutationMatrix.js --pkg <git-archive copy of 4b087df9, node_modules symlinked> TC-1 … TC-11`,
not concurrent with any rebuild (the repo-wide rebuild and test had finished first). **11 rows, 0
UNVERIFIED, 0 `0 red`.** The first run reported TC-3 UNVERIFIED (its mutant did not type-check
against the annotated `reasonProperties`); it was re-pointed to a type-compatible narrowing and
re-run alone on the same source — 10 red. `--check` on the final tree: every TC pattern found once.

| row | red | the named protections that went red (selection; full list in the run log) |
|---|---|---|
| TC-1 fgv.tracked@1 registers no commands | 106 | every registration, wire-literal and e2e test — the tools cannot even be built |
| TC-2 ten of eleven registered (one without its schema) | 26 | *exactly trackedTaskCommandNames, in its order*; *each is reachable through a registry*; the e2e suites that build all eleven |
| TC-3 a reason's `attention` refuses every real reference | 10 | *pause accepts a reason with attention on both sides*; *wait accepts every optional member*; wait/pause/fail/cancel wire literals; *the schema admits every canonical form…* |
| TC-4 `succeed`'s outcome optional in the schema | 3 | *succeed refuses no outcome on both sides*; *succeed: the wire schema is pinned*; *each is reachable through a registry* |
| TC-5 `fail` requires an outcome | 5 | *fail accepts a reason and no outcome on both sides*; e2e *fail and cancel are terminal…*; wire literal; canonical-form row |
| TC-6 `start` an open object | 8 | *start refuses a surplus property on both sides*; *a shape the schema refuses never reaches the writer*; *Anthropic and OpenAI receive the empty-parameter commands as an empty closed object*; wire literal |
| TC-7 `wait` takes a plain reason | 7 | e2e *start → wait → resume → pause → succeed*; *wait accepts every optional member*; both `notBefore` only-schema rows |
| TC-8 `set-attention` a single reference | 9 | e2e *the set-\* commands change the field…*; *set-attention accepts two references*; *refuses a single reference, not a list* |
| TC-9 a tracked handle registers `source-key` | 1 | *each registers as the inert dispatch values…* |
| TC-10 stale `expectedRevision` evaluated, not refused (`_prepare`) | 1 | *a stale expectedRevision is refused as conflict, and the task does not move* |
| TC-11 `invalid-transition` reaches the model by name (`tools/commandTools.ts`, mutated in the copy only) | 1 | *a transition unavailable from the current status is the fixed conflict line, naming no status* |

## Review

### Layer 1 — `code-reviewer`

**No P1. Three P2, all resolved; P3s applied or dispositioned.**

- **P2-1 (fixed):** the handles registered `idempotency: 'source-key'` and `conditional: true`,
  justified in TSDoc as describing the broker as executor. The reviewer's point: those fields mean a
  *source's* dedup and a *source revision* precondition (`externalCommands.ts`), so the justification
  redefined them, and the values would authorize a blind resend if anything ever read them for a
  tracked task. Now `'none'` / `false` — inert — with the TSDoc saying so, a test pinning both, and
  matrix row TC-9.
- **P2-2 (fixed):** prettier. Applied to the changed files only (a whole-file prettier 3 run on
  `CAPABILITIES.md` reformatted unrelated sections and was reverted; the pre-commit hook's
  prettier 2.8.8 is the gate).
- **P2-3 (fixed):** the known-wrong pin on the unknown line now names its `TECH_DEBT` entry and says
  the fix must change it.
- **P3 applied:** `progress` now says omitting it clears progress; bound fixtures derived from
  `defaultTaskFieldBounds` (`max + 1`) instead of magic numbers; the remaining converter bounds added
  (phase, unit, progress summary, reference key, artifact count); `null` rows for each object member;
  the e2e record parse goes through `JsonConverters.jsonObject`.
- **P3 dispositioned:** remaining test-side casts on captured request bodies follow
  `requestCapture.test.ts`.

### Layer 2 — Copilot

Triggered by an `@copilot review` comment plus an API request (00:30 UTC); posted 00:34.

**Round 1 (on `26c5ed83`) — two medium, four low; all real, all fixed in the next push.**

| finding | fix |
|---|---|
| **(medium)** the e2e suite cast captured request bodies (`JSON.parse(…) as Body`, `tools as JsonObject[]`) | every captured value goes through `JsonConverters.jsonObject` / `arrayOf(jsonObject)`; a missing tool fails loudly by name instead of a `!` |
| **(medium)** the same for Gemini's nested `function_declarations` | the same converters |
| **(low ×3)** "eight" reference-bearing commands double-counted `fail` and `cancel` (in `CAPABILITIES.md`, `result.md`, the ledger) | six: `wait`, `pause`, `succeed`, `fail`, `cancel`, `set-attention` — now named where the count is given |
| **(low)** the descriptor TSDoc (and `CAPABILITIES.md`, the ledger) said all three terminal commands record an outcome | `succeed` always does; `fail` and `cancel` only when one is sent |

**Round 2 (on `8e689bf2`) — one medium inline, two points in the overview; all real, fixed in the next
push.** Posted 00:43, nine minutes after the request.

| finding | fix |
|---|---|
| **(medium)** the model-turn test asserted the `client-tool-result` event's type (`as IAiStreamToolUseComplete`) | narrowed by a type predicate on the discriminant, failing loudly when the turn produced none |
| (overview) a finiteness disagreement the fixtures omit | real: a schema `number` admits `Infinity`, `nonNegativeAmount` refuses it. Not sendable as JSON, but a direct `execute` call can pass it — added to *only the schema accepts* (now 19) |
| (overview) the native path contradicts the public command-handle contract | real: `ITaskCommandHandle`'s TSDoc said the broker runs `validate` on every request, and `ITaskCommandDescriptor`'s that `encode` produces what is stored — true for external kinds only, and false the moment a native kind registers handles. Both TSDocs, and the I1c bullet in `CAPABILITIES.md`, now say native commands go through the broker's own converter. Doc-only changes in `types/registry.ts` and `types/commands.ts` (`api.md` unchanged) |

Round 2's substantive point — a public contract statement this slice made false — is the class layer 1
missed, so the loop continues.

**Round 3 (on `8e15f6da`) — four low inline, two low "previously missed"; all real.** Posted 00:51.

| finding | fix |
|---|---|
| `ITaskCommandHandle.validate`'s own TSDoc still promised the stored canonical form | it now says the broker never calls it for a native kind, and that a value it accepts can still be refused there |
| `ITaskCommandDescriptor`'s opening still called the schema the runtime validator; its `encode` sentence was unscoped | both scoped to externally executed kinds; a native descriptor provides the wire schema only |
| `CAPABILITIES.md`'s registry paragraph still called `createTaskCommandHandle` the only canonicalization path | qualified for external kinds; native handles expose only the wire schema |
| stale counts: the ledger's 70 values / 18 bounds; `result.md`'s gate row at 2,276 tests | 71 / 19; 2,277 |
| `tools/commandTools.ts`'s `_send` comment says the writer canonicalizes through the handle's `validate` | true for external kinds only — **not edited** (I1d owns `packlets/tools/`); routed into the I1d `TECH_DEBT` entry |

Round 3 was entirely documentation that followed from round 2's correction — the same fact, propagated
to every place that stated the old contract. Nothing in it touched behaviour or tests.

No source behaviour changed in any round, so the matrix rows' patterns are untouched (`--check`: all TC rows found
once) and the results above stand. Package suite after round 2: 95 suites, 2,277 tests, 100 %.

## Routed beyond this slice

- `docs/TECH_DEBT.md` — **removed**: *`fgv.tracked@1`'s transitions cannot be offered as model tools*.
- `docs/TECH_DEBT.md` **[P3]** *A command tool tells the model "do not send it again" for a native
  command the broker refused before recording anything* — **for I1d** (it owns `packlets/tools/`).
- `docs/TECH_DEBT.md` **[P3]** *Gemini has not been shown to accept a nested object schema with no
  properties* — likely fix in `packlets/tools/`.
- `docs/TECH_DEBT.md` **[P3]** *`fgv.task-list@1` registers no commands*.
- `docs/TECH_DEBT.md` **[P4]** *An object converter with no fields converts `null` to `{}`* (`ts-utils`).
- **Nothing in `packlets/tools/` or `fixedTaskToolNames` was touched.** One matrix row (TC-11)
  *mutates* `tools/commandTools.ts` in a throwaway copy; if I1d moves `rejectionCodes`, re-point it.

## Gates

Run locally on `645120a2` (source identical to the head that follows; later commits touch only
`perf/` and docs).

| gate | result |
|---|---|
| `rush change --verify --target-branch origin/integration/agent-tasks-v1` | change file found (`minor`) |
| `rushx build` (package) | clean, **zero warnings**; `etc/ts-agent-tasks.api.md` unchanged |
| `rushx lint` / fixlint | clean; pre-commit prettier |
| `rushx test` (package) | **95 suites, 2,277 tests (after round 2; 2,276 before); 100 % statements, branches, functions, lines; zero `c8 ignore`** |
| `rush rebuild` (repo-wide) | exit 0 (3 min 44 s) |
| `rush test` (repo-wide) | exit 0 (7 min 19 s) — run although option 1 was taken: `trackedTaskDescriptor()` now returns more, a behaviour change no compiler sees (no other package depends on `ts-agent-tasks`) |
| `verify-capability-docs.mjs` | 24/24 documented, 75 reflexes, 0 failed |
| `generate-capability-feed.mjs --check` | 0 stale |
| `verify-esm-entrypoints.mjs` | 24 checked, 0 failed |
| `verify-bundler-resolution.mjs` | 20 checked, 0 failed |
| `verify-tarball-exports.mjs` | 26 packages, 205 paths, 0 failed |
| revert matrix | 11 rows, 0 UNVERIFIED, 0 `0 red` (above) |
