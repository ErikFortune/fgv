**Shipped:** A host can offer a model one typed tool per registered task command it names — the command's registered parameter schema on the wire, sent only to tasks of its own kind, with every refusal a fixed line and every unknown outcome a firm instruction not to send the command again.

# Result — `agent-tasks-i1c`

**I1c does not close the stream.** I1d follows; artifacts stay in `.ai/tasks/active/agent-tasks-i1c/`,
and this family finalizes at cluster close. Written 2026-09-30.

---

## What shipped

- **`createTaskTools({ …, commands?: ITaskCommandToolOptions })`**, with
  `ITaskCommandToolOptions = { writer, registry, environment, enable }`:
  - `enable: ReadonlyArray<ITaskCommandToolSpec>` — `{ kind, detailVersion, command, name?, description? }`,
    one tool each, in the order given. Absent or empty: none.
  - `writer` must be the very object passed as `view` (build-time `===`), as for mutations.
  - `registry` — each command is looked up here at build time; its `parameters` is the wire schema.
  - `environment: Pick<ITaskEnvironment, 'newOperationId'>` mints every call's operation id.
- **Wire schema** of each tool: `{ taskId, expectedRevision, parameters }`, closed, `parameters` the
  command's **registered** schema, unchanged.
- **Result:** `TaskCommandToolResult` — `{ taskId, state: 'accepted' }` or
  `{ taskId, state: 'applied', revision }`. Everything else is a tool failure (below).
- **Contract change:** `ITaskCommandHandle.parameters: JsonSchema.ISchemaValidator<unknown>`, set by
  `createTaskCommandHandle`. No other implementer exists in `libraries/`, `tools/` or `samples/`
  (`grep -rl ITaskCommandHandle`: five files, all in this package's `src/packlets`).
- **Files:** `tools/commandTools.ts` (new, ~390 lines), `tools/schemas.ts`, `tools/writerAnswers.ts`
  (`command` receipt converter), `tools/toolSupport.ts` (`IFailureWording.determinate` /
  `unknownLine`, `codeLine`), `tools/taskTools.ts`, `tools/index.ts`, `types/tools.ts`,
  `types/registry.ts`, `converters/kindRegistry.ts`. Nothing in `storage/` or `broker/` changed.
- **Tests:** `tools/commands.test.ts` (real simulated executor), `tools/commandBoundary.test.ts`
  (scripted writer / view), additions to `factory.test.ts`, `requestCapture.test.ts`,
  `converters/kindRegistry.test.ts`; helper `commandingTools` in `toolFixtures.ts`.

## The schema-exposure decision — option 1, expose the validator

**Chosen: `readonly parameters: JsonSchema.ISchemaValidator<unknown>` on `ITaskCommandHandle`.**

- **Against option 2 (expose only the `toJson()` wire form).** It fails on a fact the brief did not
  state: an `IAiClientTool`'s `parametersSchema` must be a `JsonSchema.ISchemaValidator`, not JSON
  (`ts-extras` `toolTypes.ts`, `IAiClientToolConfig.parametersSchema`). A `JsonValue` would have to be
  turned back into a validator — through `JsonSchema.fromJson`, which accepts a subset and would be a
  *second* validator that can disagree with the registered one, or through a hand-built
  `ISchemaValidator` adapter over `Validator<T>`'s full surface. Either rebuilds, outside the registry,
  exactly the thing the registry already holds. Option 2's "closure guarantee by construction" is
  bought by making the harness validate with something other than the registered schema.
- **Against option 3 (host-supplied schemas).** Not *from the registry*, which is the acceptance
  criterion, and a host could offer a schema the validator disagrees with — the broker would then
  refuse calls the model was told were valid.
- **Why exposing loses nothing structural.** The guarantee the closure provides is *"the only way to
  produce canonical parameters is `validate`"*. That still holds: `parameters.validate` returns the raw
  value, never the encoded form (pinned: `kindRegistry.test.ts` › *the handle exposes the registered
  schema itself…*, an encoder that canonicalizes `-3` → `3`). And the broker never accepts
  pre-canonicalized parameters from anyone: `prepareExternal` (and `_prepare` for native kinds) runs
  `validate` on every request it is handed, and replays compare against the stored canonical form. So
  what a caller does with the schema first can change nothing that is stored, deduplicated or
  dispatched. The cost, stated: the guarantee is now an argument about the broker's call sites rather
  than a property of what the handle hides — and `P` is erased to `unknown` (it already was, at the
  handle).
- **The `detailSchema` precedent, applied.** Agreement between a schema and its converter *"is a claim
  about every value, which no signature-level check can settle. It is a **fixture** obligation."* For
  commands, `createTaskCommandHandle` checks **one** half: the *encoded* form must re-validate against
  the schema (an encoder that changes shape is refused). What remains a fixture obligation is the rest:
  that the schema admits exactly the inputs the host's `apply` can act on, and that the encoder is
  total over what the schema admits. An encoder that fails on a schema-valid value is a host failure
  the tool reports as `the request failed` (tested) — the model is told nothing it could act on,
  because nothing about its input was wrong by the schema it was offered.

## What the model is told for each `CommandState`, and what goes to `logger`

| receipt | the model is told | `logger` gets |
|---|---|---|
| `accepted` | `{ taskId, state: 'accepted' }` — the tool description says *recorded for the executor, not that it has taken effect* | `info`: the **`sourceReceipt`** text, when present |
| `applied` | `{ taskId, state: 'applied', revision: appliedRevision }` | — |
| `rejected` | a fixed code line (next section) | `warn`: the reason code |
| `indeterminate` | `<tool>: the outcome is not known: the command may or may not have been recorded or applied, and the host resolves or abandons any that was — do not send it again; inspect the task later` | `warn`: the free-form **`reason`** |
| `abandoned` | the same unknown line | `warn`: `from` and the free-form **`reason`** |

`sourceReceipt` is an identifier a source chose; neither `reason: string` channel is ever read into a
model-facing string. Tested with a connection string as the reason (`commandBoundary.test.ts` ›
*the free text a receipt carries…*), and without a logger (the text is dropped). The receipt itself
is converted before anything reads it (`writerAnswers.command`): strict, for the task, operation and
command asked about, and an `applied` revision no earlier than the one asked against. A receipt that
does not convert is `commit-indeterminate`, which reads as the unknown line.

**`accepted` is weaker than a source's settled answer in one race** (layer-1 P2-2): when the
`resolveCommands` pump reaches an intent between its commit and its dispatch marker, the original
`execute` returns the intent's provisional `accepted`, and the dispatch may still end
`indeterminate`. `ICommandReceipt` carries no dispatch state, so the tool cannot tell. It words
`accepted` accordingly, and the model is told not to resend either way. Routed:
`docs/TECH_DEBT.md` *A command receipt does not say whether an `accepted` intent has been dispatched*.

## What a model is told about a rejection

| `CommandRejectionReason` | line |
|---|---|
| `denied` | `<tool>: not-found-or-denied: the task is not found or not visible, or this is not permitted on it` |
| `unsupported` | `<tool>: unsupported: the request is not supported` |
| `conflict`, `invalid-transition`, `stop-active`, `idempotency-conflict` | `<tool>: conflict: the task changed, or does not accept this change now; inspect it again before deciding whether to retry` |

- **`denied` restores nothing.** It is the exact line I1a and I1b give a missing task, a hidden task,
  a foreign id and a refused action; tested identical across a command-denied visible task, a hidden
  task, a foreign-scope task and a missing id (`commands.test.ts`).
- **`stop-active` reads as `conflict`**, so the line does not say a stop exists — that is I1d's surface
  to disclose. `invalid-transition` and `idempotency-conflict` read as `conflict` too: the task does not
  accept the command now, and inspection says why as far as this principal may see.
- A rejection is a **known** outcome (not sent, or refused by the source), so *"before deciding whether
  to retry"* is honest for it — unlike the unknown outcomes below.

## Idempotency — a model must not resend a command itself

**Finding, not a gap.** Every call mints a fresh operation id — I1b's rule, kept, but for a different
reason than I1b's. A `source-key` source deduplicates the *same* key; that is what makes the pump's
resend safe after an uncertain dispatch. A model's retry would carry a **new** key and be a second
command. Tested end to end: a lost response on `advance` (a `none` command), then the model's resend —
two keys dispatched, the job advanced twice (`commands.test.ts` › *a model resend is a new command…*).

The tool cannot make a model retry safe, and should not try to reuse keys: that would require it to
hold state across calls and would let a model trigger replays of another operation. **The only
correct resend path is the host's `resolveCommands` pump**, and what it does depends on the command:

- `source-key`: resends under the **same** key after a lookup; the source deduplicates (tested:
  one key, applied once).
- `none`, or a key the source has forgotten: **never resent**. With a lookup, the pump asks the
  source; without one, it holds the command `indeterminate` until the host abandons it (tested both).

So the model-facing line says: the host resolves or abandons it — do not send it again; inspect later.
The tool description says the same. The layer-1 review corrected an earlier wording ("the host settles
it") that was true only for `source-key` commands.

**Which failures are unknown.** Only `not-found-or-denied` is treated as a known outcome. Once the
intent is recorded, the broker may still send it (the pump), and later failures carry ordinary codes: a
moved policy or subject at the dispatch boundary is `conflict` (`_unsent`, intent left `not-sent`), an
unreadable policy epoch there is `invalid`. The tool cannot tell those from the same codes before
anything was recorded, so every other code, a failure with no code, a throw and a malformed receipt
all read as the unknown line. **Trade-off, stated:** some failures that recorded nothing
(`source-unavailable` from an unattached source, `backpressure` at the intent, a pre-intent
`conflict`) are told to the model as unknown, so a model will not retry them on its own — the safe
direction. `not-found-or-denied` after an intent is possible in one path (the task pruned between the
intent and the marker commit) and is determinate in effect: the marker was never written, so nothing
is sent (layer-1 P3, verified against `repository.ts`).

**`conditional`.** A model may not set a precondition, and there is nothing to set: `ICommandRequest`
has no precondition field. The broker supplies it for a conditional command at the marker gate —
`record.sourceRevision` as committed *then* — and a failed precondition comes back as a determinate
`rejected: conflict`.

## Names — what reserves the namespace, and what a clash does

- Default name `task_command_<command>`, with every character outside `[A-Za-z0-9_-]` replaced by `_`
  (command names may contain `.` and `:`; no provider accepts those). A host may set `name`.
- A name must match `^[A-Za-z_][A-Za-z0-9_-]{0,63}$` — the intersection of Anthropic's, OpenAI's and
  Gemini's rules.
- `fixedTaskToolNames` reserves `task_query`, `task_inspect`, `task_create`, `task_update`,
  `task_reassign` **whether or not those tools are offered**; a test pins that list equal to the names
  the factory builds with every mutation group on, so a renamed or added fixed tool cannot leave it
  stale (layer-1 P2-3). **I1d must add its stop tool names to it.**
- **A clash refuses the whole tool set at build time**, naming both specs: the same command offered
  twice, two kinds registering the same command name, a `name` equal to another tool's default, or two
  commands whose defaults sanitize to the same string (`a.b` / `a_b`). The host resolves it by naming
  one. Never last-one-wins.
- **A tool sends only to a task of its own kind and detail version.** A command name is per kind, so
  without this a tool generated for one kind's `pause` could send another kind's `pause` — one the host
  never offered. The tool inspects the task first; a mismatch is `unsupported` and nothing is sent
  (tested with a tracked task and a detail-version mismatch). The inspection must also be of the task
  asked about (layer-1 P3).

## The binding members the packlet reaches

Exactly six, asserted with the recording proxy while every tool runs
(`commands.test.ts` › *execute is the sixth…*): `createTracked`, `execute`, `inspect`, `query`,
`reassign`, `updateTracked`. Asserted untouched: `changeScopes`, `reparent`, `completeList`, `archive`,
`reconcileListCompletions`, `resolveCommands`, `registerExternal`, `createTaskList`, `requestStop`,
`releaseStop`, `reconcileStop`, `inspectStop`. Building the tools asks the policy nothing
(tested with the harness policy's call log) and touches neither writer nor environment (the factory
tests build over proxies that throw on any access).

## Every check-then-act window in the diff

| window | what was read or decided before | what re-checks after |
|---|---|---|
| factory build → every call | the offered commands, their handles and names | nothing about authority is captured: every call goes to the writer, which asks the policy then (revoked-after-build refused, denied-at-build allowed later — both tested) |
| `execute` args → `handle.validate` → `inspect` | validated args, canonical parameters | the encoder runs before any task read and does not depend on the task, so it discloses nothing |
| `await view.inspect` → `await writer.execute` | the task's kind and detail version | **nothing needs to**: storage refuses any replacement that changes id, kind or detail version, and first resolution preserves both (`commitRules.ts`). Visibility, command authority, revision, archive, stop latch and epoch are all re-decided inside `execute` — the inspection is never trusted for authorization |
| mint → `await writer.execute` | a fresh operation id | none needed: the id is fresh; the writer re-converts the request |
| `await writer.execute` → reading the receipt | the requested task, operation, command and `expectedRevision`, captured before the call | `writerAnswers.command` checks the receipt against those captured values |
| broker: intent commit → dispatch marker → send → settle | (T6's windows W1–W3) | unchanged; the tool's contribution is to report every point after the intent as unknown |

## Revert matrix — run on final source

*Filled in from the run below.*

## Review

### Layer 1 — `code-reviewer`, before any coverage work

Asked the authorization-boundary questions directly (every check-then-act window; reach beyond the
named commands; every free-text disclosure channel; which failures are truly determinate; idempotency
and `conditional`; the receipt revision check; the schema-exposure trade-off). **No P1. Three P2, all
resolved; P3s applied or dispositioned.**

- **P2-1 (fixed):** "the host settles it" was true only for `source-key` commands; a `none` command, or
  an expired key, is held and never resent. Wording, TSDoc and CAPABILITIES now say *resolves or
  abandons*; a test covers a lost `none` command with and without a lookup.
- **P2-2 (fixed in wording, broker gap routed):** `accepted` can be the intent's provisional receipt
  when the pump owns the send. `accepted` is now described as *recorded for the executor*; the missing
  dispatch state is in `docs/TECH_DEBT.md`.
- **P2-3 (fixed):** the reserved list duplicated literals from three files with nothing tying them
  together; a test now pins it equal to the built fixed tools.
- **P3 applied:** `abandoned` reads as the unknown line (it said "inspect before deciding whether to
  send it again", inviting a resend); the inspection is tied to the task asked about; the flattening
  in `_send` is commented; the `arrayOf` comment corrected.
- **P3 dispositioned:** over-conservative unknown outcomes (the stated trade-off above); an encoder
  failure gives the model no signal (the schema accepted the input — the host's encoder is at fault);
  a host could register a command named like a lifecycle or stop command — it goes through ordinary
  `command` authority and the stop latch still refuses it; **routed to I1d** below.

Coverage then reached 100 % with one added test (receipt free text with no logger).

### Layer 2 — Copilot

*In progress.*

## Routed beyond this slice

- `docs/TECH_DEBT.md` **[P3]** *A command receipt does not say whether an `accepted` intent has been
  dispatched* — new.
- `docs/TECH_DEBT.md` **[P3]** *`fgv.tracked@1`'s transitions cannot be offered as model tools* — new.
  The registry is I1c's source and `fgv.tracked@1` registers no command schemas; the plan's test list
  names tracked command outcomes, which I1c covers only through I1b's mutation tools.
- `docs/TECH_DEBT.md` — *generated tool names avoid the fixed names*: **resolved**.
- `docs/TECH_DEBT.md` — *integer ranges on the wire*: fired again, not taken, with a narrower
  statement — a generated tool's parameter ranges are the registering host's; ours is
  `expectedRevision`.
- **For I1d:** add the stop tool names to `fixedTaskToolNames`; decide whether a host may offer a
  registered command whose name reads like a stop (`cancel`, `pause`) beside the stop tools, and what
  `stop-active` may say once stops are a model surface.

## Gates

*Filled in as they complete.*
