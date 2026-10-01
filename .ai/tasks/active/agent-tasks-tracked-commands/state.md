# State — `agent-tasks-tracked-commands`

**Status:** implemented; PR [#705](https://github.com/ErikFortune/fgv/pull/705) open into
`integration/agent-tasks-v1`. Layer 1 done; Copilot loop in progress.

## Where things stand

| | |
|---|---|
| brief | `brief.md` — complete |
| branch | `claude/agent-tasks-tracked-commands`, cut off `integration/agent-tasks-v1` at `d1be4d2fa` |
| PR | [#705](https://github.com/ErikFortune/fgv/pull/705) — base `integration/agent-tasks-v1`, **not `release`** |
| result | `result.md` — decision, fixtures, e2e, disclosure, review, routing, gates |

## Decisions taken

- **Option 1 — two validators, agreement as a fixture obligation.** `_prepare` unchanged; the
  converter is authoritative. Argued against unification in `result.md`.
- **All eleven registered**; the host's `enable` list chooses. No command withheld.
- **`idempotency: 'none'`, `conditional: false`** — inert on native paths (layer-1 P2-1).

## Remaining

- Copilot loop (trigger with an `@copilot review` comment; the API trigger is unreliable).
- Keep the matrix results in `result.md` current if a review round moves `builtinKinds.ts`.
- Do **not** run `/finalize-task`; the family finalizes at cluster close.

## Do not touch

`packlets/tools/` and `fixedTaskToolNames` (I1d's). Matrix row TC-11 only mutates
`tools/commandTools.ts` in a throwaway copy; re-point it if I1d moves `rejectionCodes`.
