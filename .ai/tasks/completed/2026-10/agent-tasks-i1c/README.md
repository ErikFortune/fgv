# agent-tasks-i1c — generated typed command tools

**Shipped**: 2026-09-30 via [PR #704](https://github.com/ErikFortune/fgv/pull/704) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

## Summary

Slice I1c of four in the I1 model-tool family. A host can now opt a model into one typed tool per
registered task command: `createTaskTools({ …, commands?: { writer, registry, environment, enable } })`
builds a tool for each `ITaskCommandToolSpec { kind, detailVersion, command, name?, description? }`,
with wire schema `{ taskId, expectedRevision, parameters }` and `parameters` the command's
**registered** schema, unchanged. Absent or empty, no command tool exists.

The model is told only `accepted` or `applied` (with the applied revision). Every rejection is a
fixed code line; every other outcome — `indeterminate`, `abandoned`, any writer failure but a refusal
of the task, a throw, a malformed receipt — is one line telling the model the outcome is unknown and
**not to send the command again**. Source receipt text and free-form reasons go to `logger` only. A
tool sends only to a task of its own kind and detail version. `execute` is the sixth binding member
the tools packlet reaches.

## Files changed

- `libraries/ts-agent-tasks/src/packlets/tools/commandTools.ts` (new) — generation, naming,
  `fixedTaskToolNames`, the kind check, `_send`.
- `tools/writerAnswers.ts` (the `command` receipt converter), `tools/toolSupport.ts`
  (`IFailureWording.determinate` / `unknownLine`, `codeLine`), `tools/schemas.ts`,
  `tools/taskTools.ts`, `tools/index.ts`, `types/tools.ts`.
- **Contract change:** `types/registry.ts` / `converters/kindRegistry.ts` —
  `ITaskCommandHandle.parameters: JsonSchema.ISchemaValidator<unknown>`, set by
  `createTaskCommandHandle`. Change file `minor`, `BREAKING (implementers only):`.
- Tests: `tools/commands.test.ts` (real simulated executor), `tools/commandBoundary.test.ts`
  (scripted writer/view), additions to `factory.test.ts`, `requestCapture.test.ts`,
  `converters/kindRegistry.test.ts`; helper `commandingTools` in `toolFixtures.ts`.
- `perf/mutationMatrix.js` rows `I1c-1…I1c-25`; `CAPABILITIES.md`; `etc/ts-agent-tasks.api.md`.
- Nothing in `storage/` or `broker/` changed.

## Decisions made during execution

- **Schema exposure: option 1, expose the validator.** Option 2 (the `toJson()` wire form only) was
  the brief's apparent favourite and does not work: an `IAiClientTool`'s `parametersSchema` must be a
  `JsonSchema.ISchemaValidator`, so a `JsonValue` would have to be rebuilt into a *second* validator.
  Option 3 (host-supplied schemas) is not from the registry. The closure guarantee survives as an
  argument rather than a structure: `parameters.validate` returns the raw value, and the broker runs
  `validate` on every request it is handed.
- **The writer is the single canonicalization boundary.** The first implementation ran the encoder
  in the tool and again in the writer; Copilot round 1 found a non-idempotent encoder applied twice.
  The tool now sends what the schema accepted.
- **Rejections:** `denied` → the exact `not-found-or-denied` line I1a/I1b give a missing, hidden or
  foreign task; `unsupported` → its own line; `conflict`, `invalid-transition`, `stop-active`,
  `idempotency-conflict` → one `conflict` line, so nothing says a stop exists.
- **Idempotency — a finding, not a gap.** Every call mints a fresh operation id; a model retry would
  be a second command (tested: two keys, applied twice). The only correct resend path is the host's
  `resolveCommands` pump (same key for `source-key`; never resent for `none`).
- **Conservative unknowns.** Only `not-found-or-denied` is treated as a known outcome; some failures
  that recorded nothing are therefore told to the model as unknown — the safe direction, stated.
- **`conditional`:** a model cannot set a precondition; `ICommandRequest` has no such field.
- **Names:** default `task_command_<command>`, characters outside `[A-Za-z0-9_-]` replaced; every name
  must match `^[A-Za-z_][A-Za-z0-9_-]{0,63}$`. The five fixed names are reserved whether or not
  offered, and a clash of any kind refuses the whole set at build time — never last-one-wins.
- **Receipt identity is the tool's own copy**, captured before `execute` (Copilot round 2, high —
  I1b-10's rule, missed here first).

## Followups

- `docs/TECH_DEBT.md` [P3] *A command receipt does not say whether an `accepted` intent has been
  dispatched* — open.
- `docs/TECH_DEBT.md` [P3] *`fgv.tracked@1`'s transitions cannot be offered as model tools* — closed
  by `agent-tasks-tracked-commands` (entry removed in #705).
- `docs/TECH_DEBT.md` *generated tool names avoid the fixed names* — resolved here; `agent-tasks-i1d`
  added `task_stop` / `task_stop_inspect`.
- `docs/TECH_DEBT.md` *integer ranges on the wire* — fired again, not taken; still open.
- Handed to `agent-tasks-i1d`: stop names in `fixedTaskToolNames` (done), a command named like a stop
  (I1d: allowed, not refused by name), what `stop-active` may say (I1d: stays `conflict`).
- The six pre-existing UNVERIFIED storage rows (`M13 M20 M23 M34 M39 M49`) stay routed in
  `docs/TECH_DEBT.md`.

## Lessons codified during the run

No `.ai/instructions/` file was changed by this stream. Two lessons were carried forward as "traps"
in the `agent-tasks-i1d` and `agent-tasks-tracked-commands` briefs: a matrix row can be green while
protecting the bug (an idempotent fixture encoder made the double-encode invisible), and a rule
written one slice earlier (I1b-10, capture before the `await`) did not survive one slice.

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md`
- PR: [#704](https://github.com/ErikFortune/fgv/pull/704)
