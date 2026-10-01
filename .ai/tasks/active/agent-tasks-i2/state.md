# State — `agent-tasks-i2`

**Status:** implemented; layer-1 review done and resolved; final gates and matrix in progress; PR to
`integration/agent-tasks-v1` next.

## Where things stand

| | |
|---|---|
| brief | `.ai/tasks/active/agent-tasks-i2/brief.md` |
| branch | `claude/agent-tasks-i2`, cut off `integration/agent-tasks-v1` at `e662da68c`; base not moved since |
| PR | not yet opened |
| base | `integration/agent-tasks-v1` — **not `release`** |
| result | `result.md` — decisions written; matrix, layer 2 and gate placeholders to fill |

## Decisions taken (see `result.md`)

1. **Receipt binding:** candidate 1's text binding, held in the handoff rather than the receipt
   (candidates 1-as-briefed and 2 verified unbuildable on the current surfaces), behind candidate 3's
   handoff. Failed check or mismatched sent text → the delivery manifest is abandoned.
2. **Details framing:** yes — `serializeTaskData` published from `context`; `task_inspect.details`
   is the escaped one-line text. TECH_DEBT entry resolved.

## Done

- `prompt` packlet, `serializeTaskData`, `task_inspect` change; dependency on `@fgv/ts-prompt-assist`.
- Tests: `prompt/{fragments,checkedPrompt,outbound,handoff}.test.ts`, `context/taskData.test.ts`,
  additions to `tools/bounding.test.ts`, `publicSurface.test.ts`, `context/purity.test.ts`.
  Package: 2394 tests, 100% all metrics, 0 `c8 ignore`.
- Layer-1 `code-reviewer`: no P1; P2/P3 fixed or dispositioned.
- `rush change --verify` against `origin/integration/agent-tasks-v1`: passes (change file `minor`).
- Repo-wide `rush rebuild`: exit 0, no warnings. `verify-capability-docs`, `verify-esm-entrypoints`,
  `generate-capability-feed --check`: pass.
- CAPABILITIES.md, router line, TECH_DEBT (one resolved, two added).

## Remaining

- Repo-wide `rush test` (running); `verify-bundler-resolution`, `verify-tarball-exports` (need their
  autoinstallers, blocked while rush test holds the lock).
- Revert matrix on a `git archive` copy: `node .ai/tasks/active/agent-tasks-i2/i2Matrix.js --pkg <copy>`
  (copy needs `node_modules` symlinked to the package's). **Never without `--pkg`.**
- Plan § I2 status line, ledger entry (need the PR number), PR, Copilot loop (`@copilot review`
  comment).

## Resume instructions

`brief.md` + this file + `result.md`. Code is committed on the branch; nothing is pushed until the
gates above are green.
