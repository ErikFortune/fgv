# State — `agent-tasks-i1c`

**Status:** implemented; layer 1 done; all gates green; revert matrix run on final source; PR #704
open; Copilot loop in progress (round 2 addressed).

## Where things stand

| | |
|---|---|
| brief | `.ai/tasks/active/agent-tasks-i1c/brief.md` — complete |
| branch | `claude/agent-tasks-i1c`, cut off `integration/agent-tasks-v1` at the I1b landing (`6344c1acb`) |
| PR | [#704](https://github.com/ErikFortune/fgv/pull/704) into `integration/agent-tasks-v1` |
| base | `integration/agent-tasks-v1` — **not `release`** |
| record | `result.md` — decisions, outcome table, idempotency finding, windows, matrix, reviews, gates |

## Decisions taken (argued in `result.md`)

1. Schema exposure: **option 1** — `ITaskCommandHandle.parameters: JsonSchema.ISchemaValidator<unknown>`.
2. Receipt states: accepted/applied are results; rejections are fixed code lines (`denied` →
   `not-found-or-denied`; stop-active / invalid-transition / idempotency-conflict → `conflict`);
   everything else unknown → one "do not send it again" line. Free text → logger only.
3. Idempotency: fresh id per call; the model must not resend; the pump resends `source-key` commands
   under the same key, resolves `none` commands by lookup or holds them until abandoned.
4. Namespace: `task_command_<command>` default, host `name` override, fixed names always reserved,
   clash refuses the set.
5. Kind check: the tool inspects first and sends only to its own kind@version.
6. The writer is the single canonicalization boundary (Copilot round 1); the receipt identity is the
   tool's own copy, captured before the writer is called (Copilot round 2).

## Resume instructions

Remaining work is only the Copilot loop and merge: read the latest Copilot review on #704, fix real
findings (run package build/lint/test and, if source moved, the I1c matrix rows on a `git archive`
copy with a `node_modules` symlink), record the round in `result.md` § Layer 2, reply to and resolve
each thread, re-request with an `@copilot review` comment, and stop on diminishing returns. Do not run
`/finalize-task` — the family finalizes at cluster close.
