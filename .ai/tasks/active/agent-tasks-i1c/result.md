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
- **Files:** `tools/commandTools.ts` (new, ~380 lines), `tools/schemas.ts`, `tools/writerAnswers.ts`
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
  total over what the schema admits. The tool **does not run the encoder**: it sends the parameters as
  the schema accepted them, and the writer canonicalizes them once (Copilot round 1 — running it in the
  tool too applied a non-idempotent encoder twice). An encoder that fails on a schema-valid value is
  therefore refused by the writer before anything is recorded, and the model hears the unknown line —
  the tool cannot tell that `invalid` from one after an intent — with the host's text in the log only.

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
| `execute` args → `inspect` | schema-validated args | nothing the tool decides depends on them beyond shape; the writer canonicalizes the parameters itself, once |
| `await view.inspect` → `await writer.execute` | the task's kind and detail version | **nothing needs to**: storage refuses any replacement that changes id, kind or detail version, and first resolution preserves both (`commitRules.ts`). Visibility, command authority, revision, archive, stop latch and epoch are all re-decided inside `execute` — the inspection is never trusted for authorization |
| mint → `await writer.execute` | a fresh operation id | none needed: the id is fresh; the writer re-converts the request |
| `await writer.execute` → reading the receipt | the requested task, operation, command and `expectedRevision`, captured before the call | `writerAnswers.command` checks the receipt against those captured values |
| broker: intent commit → dispatch marker → send → settle | (T6's windows W1–W3) | unchanged; the tool's contribution is to report every point after the intent as unknown |

## Revert matrix — run on final source

**Final run** — `perf/mutationMatrix.js --pkg <git-archive copy of 57d4caae, node_modules symlinked>`,
rows `I1c-1 … I1c-25` less the retired `I1c-20`, after Copilot round 2 changed `commandTools.ts`.
**24 rows, 79 red tests; 0 UNVERIFIED, 0 `0 red`, runner exit 0.** Earlier runs — `7179d1ee`
(24 rows, 73 red) and `c0f82d98` (23 rows, 75 red) — are superseded: each Copilot round moved code
the rows mutate. `--check` on the
final tree: every I1c pattern found exactly once (the six storage rows `M13 M20 M23 M34 M39 M49` stay
UNVERIFIED — pre-existing, routed in `docs/TECH_DEBT.md`). Not run concurrently with any rebuild.

- **Every row is red on a test that names its protection**, read row by row below.
- **I1c-2 is paired, and its second half is masked** — the same shape as I1b-4. With the schema
  closure and the tool's own id both reverted, the tests that go red are the surplus-field ones,
  which fail on their first assertion (the call *succeeds*) before anything could observe which id
  was sent. So the pair proves the closure is load-bearing; it does not separately prove the minted
  id would be ignored. That half is structural: the request is built from named fields and the
  minted `operationId`, never by spreading `args` (read, not measured).
- **I1c-20 retired, I1c-21 re-pointed by Copilot round 1.** The tool no longer runs the encoder, so
  it has no encoder failure of its own to word (the writer's is an ordinary failure, covered by
  I1c-13). I1c-21 now reverts to the defect round 1 found — the tool encoding as well as the writer —
  and goes red only on the end-to-end prefix-encoder test.
- **I1c-22 is broad by nature** (emptying the wire schema refuses every call that carries
  parameters); the first three red tests are listed.
- I1c-24 is layer-1 P3's protection (an inspection of another task); I1c-25 is Copilot round 2's
  (the receipt identity is the tool's own copy).

| row | verdict | suites that went red |
|---|---|---|
| I1c-1 a command tool execute trusts its arguments | 2 red | execute re-validates its arguments with no harness in front › parameters are checked by the registered schema, closed as registered<br>execute re-validates its arguments with no harness in front › the model cannot name an operation id, the command, a principal, a scope or a precondition |
| I1c-2 a model's operation id is honoured (schema closure and the tool's own id both reverted) | 2 red | execute re-validates its arguments with no harness in front › parameters are checked by the registered schema, closed as registered<br>execute re-validates its arguments with no harness in front › the model cannot name an operation id, the command, a principal, a scope or a precondition |
| I1c-3 a command is sent to a task of any kind | 3 red | a command tool sends a registered command, and reports only what the receipt says › a task of another kind is refused before anything is sent — a tool is its own kind’s command<br>what the tool reads before it sends › a task of the command’s kind at another detail version is refused, and nothing is sent<br>what the tool reads before it sends › an inspection of another task is a malformed answer, and nothing is sent |
| I1c-4 the kind check ignores the detail version | 1 red | what the tool reads before it sends › a task of the command’s kind at another detail version is refused, and nothing is sent |
| I1c-5 a rejection's reason reaches the model verbatim (denied, stop-active) | 6 red | a command tool sends a registered command, and reports only what the receipt says › a command the policy denies on a visible task reads exactly as a hidden task and a foreign id<br>a command tool sends a registered command, and reports only what the receipt says › a source rejection is a known outcome: an invalid transition reads as conflict<br>a command tool sends a registered command, and reports only what the receipt says › a stale revision is refused as conflict, and nothing is sent<br>a command tool sends a registered command, and reports only what the receipt says › an unresolved registration of the kind is sent, and the broker refuses it as unsupported<br>a writer’s answer is checked, and says no more than a fixed line › every rejection reason is a fixed code line; denied reads as a missing task, stop-active as conflict<br>capability checks are live — offering a command is not authorizing it › command authority revoked after the tools are built is refused at the next call, and nothing is sent |
| I1c-6 a source's receipt text reaches the model | 4 red | a command tool sends a registered command, and reports only what the receipt says › accepted with no logger still tells the model accepted, and nothing more<br>a command tool sends a registered command, and reports only what the receipt says › accepted: the model is told only 'accepted' — the source's receipt text goes to the host<br>a writer’s answer is checked, and says no more than a fixed line › the free text a receipt carries — a source receipt, a reason — never reaches the model<br>a writer’s answer is checked, and says no more than a fixed line › with no logger, a receipt's free text is simply dropped |
| I1c-7 an indeterminate command's reason reaches the model | 5 red | a command tool sends a registered command, and reports only what the receipt says › indeterminate: the model is told the outcome is unknown and not to resend — never the source's reason<br>a writer’s answer is checked, and says no more than a fixed line › the free text a receipt carries — a source receipt, a reason — never reaches the model<br>idempotency: a model must not resend a command whose outcome is unknown › a lost response is unknown to the model; the pump settles it under the same key, applied once<br>idempotency: a model must not resend a command whose outcome is unknown › a model resend is a new command under a new key — so after a lost response it applies twice<br>idempotency: a model must not resend a command whose outcome is unknown › a none command whose response was lost is never resent: held without a lookup, looked up with one |
| I1c-8 an abandoned command's reason reaches the model | 1 red | a writer’s answer is checked, and says no more than a fixed line › the free text a receipt carries — a source receipt, a reason — never reaches the model |
| I1c-9 a writer's conflict or invalid after the intent was recorded reads as a known refusal | 2 red | a writer’s answer is checked, and says no more than a fixed line › every writer failure but a refusal of the task is an unknown outcome — a command may already be recorded<br>what the host supplies fails as the host’s, and names nothing › a registered encoder that fails is refused by the writer, before anything is recorded or sent |
| I1c-10 a receipt for another task, operation or command is accepted | 2 red | a writer’s answer is checked, and says no more than a fixed line › a receipt for another task, operation or command, or with a surplus field, is an unknown outcome<br>a writer’s answer is checked, and says no more than a fixed line › a writer that rewrites the request in place cannot move what its receipt is checked against |
| I1c-11 an applied receipt may precede the revision asked against | 1 red | a writer’s answer is checked, and says no more than a fixed line › an applied receipt at a revision before the one asked against is an unknown outcome; at or after, a result |
| I1c-12 a command writer's throw reads as a view failure, not an unknown outcome | 1 red | a writer’s answer is checked, and says no more than a fixed line › a writer that throws or rejects is an unknown outcome, and what it threw goes to the host |
| I1c-13 an unknown outcome is worded by its code, not as one line | 5 red | a writer’s answer is checked, and says no more than a fixed line › a receipt for another task, operation or command, or with a surplus field, is an unknown outcome<br>a writer’s answer is checked, and says no more than a fixed line › a writer that rewrites the request in place cannot move what its receipt is checked against<br>a writer’s answer is checked, and says no more than a fixed line › an applied receipt at a revision before the one asked against is an unknown outcome; at or after, a result<br>a writer’s answer is checked, and says no more than a fixed line › every writer failure but a refusal of the task is an unknown outcome — a command may already be recorded<br>what the host supplies fails as the host’s, and names nothing › a registered encoder that fails is refused by the writer, before anything is recorded or sent |
| I1c-14 the command writer need not be the view | 1 red | command tools › refuses a malformed offer, and a writer that is not the view |
| I1c-15 a generated tool may take a fixed tool's name | 1 red | command tools › a generated name may not be a fixed tool’s, whether or not that tool is offered |
| I1c-16 two commands under one name: last one wins | 2 red | command tools › a default name replaces what a provider would refuse, and a clash the replacement causes is refused too<br>command tools › two commands under one name refuse the whole set — including two kinds registering the same command |
| I1c-17 a name a provider refuses is accepted | 1 red | command tools › a generated name must be one every provider accepts |
| I1c-18 a minting failure's host text reaches the model | 1 red | what the host supplies fails as the host’s, and names nothing › an environment that fails, throws or mints a malformed id fails the call before anything is sent |
| I1c-19 a minted operation id is not converted | 1 red | what the host supplies fails as the host’s, and names nothing › an environment that fails, throws or mints a malformed id fails the call before anything is sent |
| I1c-21 the tool encodes the parameters as well as the writer (a non-idempotent encoder runs twice) | 1 red | what the host supplies fails as the host’s, and names nothing › the registered encoder runs exactly once, in the writer — the tool sends what the schema accepted |
| I1c-22 the wire schema carries an arbitrary payload, not the registered schema | 33 red | 33 tests across the command tool suites (every call carrying parameters fails the emptied schema), including: a command tool sends a registered command, and reports only what the receipt says › a command the policy denies on a visible task reads exactly as a hidden task and a foreign id<br>a command tool sends a registered command, and reports only what the receipt says › a stale revision is refused as conflict, and nothing is sent<br>a command tool sends a registered command, and reports only what the receipt says › a task of another kind is refused before anything is sent — a tool is its own kind’s command |
| I1c-23 an offer that does not convert is accepted element by element (arrayOf drops undefined) | 1 red | command tools › refuses a malformed offer, and a writer that is not the view |
| I1c-24 an inspection of another task is accepted as the task asked about | 1 red | what the tool reads before it sends › an inspection of another task is a malformed answer, and nothing is sent |
| I1c-25 the receipt is checked against the request object the writer was handed | 1 red | a writer’s answer is checked, and says no more than a fixed line › a writer that rewrites the request in place cannot move what its receipt is checked against |

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

The `@copilot review` comment (00:24 UTC) produced nothing for an hour. One API request was then sent
at 01:25, and the review posted at 01:30. Which of the two triggered it is not known.

**Round 1 (on `89d990c8`) — one high, one medium, two low; all real, all fixed in `c0f82d98`.**

| finding | fix |
|---|---|
| **(high)** the tool ran `handle.validate` — and so the registered encoder — and the writer ran it again in `prepareExternal`. Encoders must re-validate, not be idempotent, so a prefixing encoder was applied twice | the tool sends the schema-validated parameters; the writer is the single canonicalization boundary. End-to-end test through a real broker with a prefixing `tag` command: the executor receives `prefix:x`. **Why layer 1 and the matrix missed it:** the canonicalization test's encoder trimmed whitespace, which is idempotent, so the defect and the protection looked the same. The matrix row that "protected" canonical encoding (old I1c-21) was protecting the bug. A failing encoder is now the writer's `invalid`, read as the unknown line (tested) |
| **(medium)** the Gemini capture asserted only command names, so a dropped parameter schema would pass | the complete sanitized declarations of all four command tools are asserted as literals |
| **(low)** `state.md` said PR "none" beside a status naming #704 | fixed |
| **(low)** CAPABILITIES called the wire schema closed; Gemini's dialect strips `additionalProperties` | qualified: stated on the wire for Anthropic and OpenAI, enforced by validation only for Gemini |

Round 1 found a genuine high that layer 1 did not, so the loop continues.

**Round 2 (on `614ff8ec`) — one high, six low; all real, all fixed in `57d4caae`.** Requested by an
`@copilot review` comment plus an API request at 01:46; posted at 01:52.

| finding | fix |
|---|---|
| **(high)** the receipt's expected identity was read from `request` **after** the writer had been handed it: a writer that rewrote `operationId`, `command` or `taskId` in place could have a receipt for the rewritten request accepted | the receipt converter is built from scalar copies captured before `execute` — the rule I1b wrote for reassignment (I1b-10), missed here. Test: a writer rewriting each field in place, answering honestly for the rewrite — each reads as unknown; verified red against the old code and green with the fix. Matrix row I1c-25. (A rewritten `expectedRevision` is not in the test: the check is a lower bound, so moving it can only make the check stricter) |
| **(low)** PR description still gave the superseded matrix figures | updated |
| **(low)** `state.md` still called decisions open and listed finished work as remaining | rewritten to the decisions taken and the actual remaining work |
| **(low)** a TECH_DEBT reference was separated from its item by the two new entries | moved back |
| **(low ×2)** comment and TSDoc said a `none` command is held until abandoned; with a lookup the pump resolves it | both now name the lookup path |
| **(low)** a test name was ungrammatical | fixed |

Round 2 again found a real high — an ordering defect of exactly the class `CODING_STANDARDS.md`
predicts on authorization boundaries (a value read after the `await` it should precede). The loop
continues.

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

Run locally. Package gates on `57d4caae` (after Copilot round 2; 93 suites, 2,168 tests); the repo-wide rebuild and test on `7179d1ee` — round 1 moved no type, signature or export (`etc/ts-agent-tasks.api.md` unchanged) and no other package consumes the tool code, and CI's `build` runs the whole repo on every head.

| gate | result |
|---|---|
| `rush change --verify --target-branch origin/integration/agent-tasks-v1` | change file found (`minor`, `BREAKING (implementers only):`) |
| `rushx build` (package) | clean, **zero warnings**; `etc/ts-agent-tasks.api.md` updated and checked in |
| `rushx lint` / fixlint | clean; prettier via the pre-commit hook |
| `rushx test` (package) | **93 suites, 2,168 tests passed; 100 % statements, branches, functions, lines; zero `c8 ignore`** |
| `rush rebuild` (repo-wide) | exit 0 (3 min 33 s) — required: `ITaskCommandHandle` widened |
| `rush test` (repo-wide) | exit 0 (7 min 3 s) |
| `verify-capability-docs.mjs` | 24/24 documented, 75 reflexes, 0 failed |
| `generate-capability-feed.mjs --check` | 0 stale |
| `verify-esm-entrypoints.mjs` | 24 checked, 0 failed |
| `verify-bundler-resolution.mjs` | 20 checked, 0 failed |
| `verify-tarball-exports.mjs` | 26 packages, 205 paths, 0 failed |
| revert matrix | 24 rows, 79 red tests, 0 UNVERIFIED, 0 `0 red`, on `57d4caae` (above) |
