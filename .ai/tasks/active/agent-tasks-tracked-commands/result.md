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
| only the schema accepts | 18 | the bounds the wire cannot state: empty / two-line / over-bound title (`maxTitleLength + 1`, from the fixture bounds); empty description; non-identifier code; empty summary; zone-offset and impossible-date `notBefore`; non-identifier reference namespace; two-line reference key; one reference and one artifact over `maxReferences`; negative amount; `total < completed`; two-line phase and unit; empty progress summary; empty outcome summary |
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
  are references — eight of the eleven commands. Verified: nothing in `broker/` or
  `implementations/` resolves a reference; the converter checks namespace identifier syntax, a
  single-line bounded key, and the count. A model can assert one it made up, and a non-empty
  `attention` makes the task's baseline delivery category `attention` (`delivery.ts`). I1b withheld
  `attention` from `task_update` for exactly this; offering any of the eight offers it back.
  `defaultTaskProjector` strips outcome artifacts from views but not `attention`. The wire
  descriptions also tell the model to use only references the host gave it — advice, not a control.
- **`succeed`, `fail`, `cancel` assert an outcome on the host's behalf and are final** — terminal
  states are absorbing, and the outcome is stored as the task's result.

## Every check-then-act window in the diff

None new. The slice adds data (registrations) and no code path: `_prepare`, the writer section and
the tool are unchanged. The windows a tracked command passes through are T5's (`execute`: epoch
captured before the first policy question; revision re-read and epoch rechecked under the writer,
immediately before the commit) and I1c's (inspection → `execute`, kind immutable; receipt checked
against copies captured before the writer). The tests exercise them unchanged.

## Revert matrix — run on final source

*(filled in below after the run)*

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

*(in progress)*

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

*(filled in below)*
