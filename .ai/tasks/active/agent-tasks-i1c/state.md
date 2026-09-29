# State — `agent-tasks-i1c`

**Status:** implemented and tested locally; layer-1 review in progress; not yet committed or pushed.

## Where things stand

| | |
|---|---|
| brief | `.ai/tasks/active/agent-tasks-i1c/brief.md` — complete |
| branch | `claude/agent-tasks-i1c`, cut off `integration/agent-tasks-v1` at the I1b landing (`6344c1acb`) |
| PR | none |
| base | `integration/agent-tasks-v1` — **not `release`** |

## Predecessors

I1a (#702) shipped the `tools` packlet and the read-only surface. I1b (#703) added the opt-in
mutation tools, `task_inspect.revision`, `tools/toolSupport.ts` (shared failure path) and
`tools/writerAnswers.ts` (receipt conversion). The packlet is eight files, largest
`mutationTools.ts` ~330 lines. Full detail in each stream's `result.md`.

Reserved tool names, pinned distinct by a test: `task_query`, `task_inspect`, `task_create`,
`task_update`, `task_reassign`. Binding members reached so far: `query`, `inspect`, `createTracked`,
`updateTracked`, `reassign` — five, asserted with a recording proxy.

## Open decisions this slice must take

1. **The command handle does not expose its schema.** `ITaskCommandDescriptor<P>.parameters` is the
   wire schema, but `createTaskCommandHandle` captures it in a closure and `ITaskCommandHandle`
   exposes only `validate()`. Three resolutions (expose the validator / expose only the `toJson()`
   wire form / take schemas from the host) are set out in the brief with their trade-offs against
   the closure guarantee. Undecided on purpose.
2. **`CommandState` carries free-form host text** in three of five shapes — `sourceReceipt?: string`,
   and `reason: string` on both `indeterminate` and `abandoned`. None may reach the model; the slice
   says what is said instead for each state.
3. **`CommandRejectionReason` separates `denied`** from the other reasons, restoring a distinction
   `not-found-or-denied` deliberately removed. The slice decides what a model is told.
4. **Idempotency.** I1b mints a fresh operation id every call so a retry is never a replay; a
   `source-key` command relies on the source deduplicating the *same* key to make a resend safe. The
   slice works out what is true and may conclude a model must not retry a command itself.

## Routed debt with I1c as the trigger

- Integer ranges unstated on the wire (`JsonSchema.integer` has no `minimum`/`maximum`) — fired in
  I1b, deferred because the fix is in `ts-json-base`. Re-armed here.
- Nothing enforces that generated command tool names avoid the five fixed names.

Both in `docs/TECH_DEBT.md`.

## Decisions taken (detail in `result.md` once written)

1. Schema exposure: **option 1** — `ITaskCommandHandle.parameters: JsonSchema.ISchemaValidator<unknown>`.
   Option 2 cannot be composed into an `IAiClientTool` (needs a validator, not JSON); option 3 is not
   from the registry.
2. Receipt states: accepted/applied are results; rejections are fixed code lines (`denied` →
   `not-found-or-denied`; stop-active / invalid-transition / idempotency-conflict → `conflict`);
   indeterminate, abandoned, malformed receipts, throws and every writer failure except
   `not-found-or-denied` → one "outcome unknown — do not send it again" line. Free text → logger.
3. Idempotency: fresh id per call; the model must not resend; the pump resends under the same key.
4. Namespace: `task_command_<command>` default, host `name` override, fixed names reserved always,
   clash refuses the set.
5. Kind check: the tool inspects first and sends only to its own kind@version.

## Resume instructions

`brief.md` plus this file. Code is in the working tree (`tools/commandTools.ts` et al.). Remaining:
layer-1 findings, coverage closure (one branch: abandoned receipt with no logger), revert-matrix I1c
rows, gates, result.md, plan/ledger lines, commit, push, PR into `integration/agent-tasks-v1`,
Copilot loop via `@copilot review` comment.
