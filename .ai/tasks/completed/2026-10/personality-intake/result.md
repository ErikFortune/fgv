# Result — `personality-intake`

**Shipped:** 17 open PersonAIlity `fgv-ask` issues captured as 17 inbox findings, one per request,
and then swept against fgv repo state: none of the 17 is implemented on any fgv branch or open PR.

## What was delivered

- `findings/inbox/`: 17 files, one per open `fgv-ask` issue in `ErikFortune/personaility`:
  - ErikFortune/personaility#648: browser barrel omits `fromBase64Strict`
  - ErikFortune/personaility#669: ts-random weighted pick
  - ErikFortune/personaility#670: `derivedFrom` docstring
  - ErikFortune/personaility#671–ErikFortune/personaility#678: ts-extras-mcp M1–M8
  - ErikFortune/personaility#679–ErikFortune/personaility#683: ts-json-base `JsonSchema` J1–J5
  - ErikFortune/personaility#684: ai-assist `execute` signal

  Each file cites the issue and the long-form note it links to, and quotes the stated constraints
  and the requester's own priority. The intake agent's voice appears only in marked
  `Observations` sections.
- `index.md`: the 17-row table, nothing else.
- `state.md`: the enumeration method, the exclusions, the ambiguities, and the repo-state sweep
  with per-item evidence.

## The repo-state sweep

This was added after capture, at the user's request. The premise was that the older asks might
already be done in fgv but unpublished. **They are not.** Only three of the 17 predate the
2026-10-01 cluster (ErikFortune/personaility#648, ErikFortune/personaility#669,
ErikFortune/personaility#670), and none of the three has landed. Refs checked:

- `release` @ `30713277` and `integration/agent-tasks-v1` @ `2a95fbb2`
- every branch active since 2026-09-19
- the open fgv PRs

`state.md` § "Sweep against fgv repo state" gives the per-item evidence.

The delivered asks are among the 28 **closed** `fgv-ask` issues, which this intake excluded.

## Deviations from the brief

- **Branch name:** `claude/personality-intake-qvid00` (the session's designated branch), not
  `claude/personality-intake`.
- **`brief.md` and the original `state.md` were not on the base.** They were taken from
  `cee0cf6a0` on `claude/orchestrator-handoff-2026-10`. That branch's `HANDOFF-2026-10-01.md` was
  not brought over.
- **The brief said "Do not run `/finalize-task`".** The user then explicitly asked to finalize, so
  this directory moves to `completed/2026-10/`. The inbox moves with it: the next orchestrator
  drains `findings/inbox/` from the completed path rather than the active one.
- **The repo-state sweep** was not in the brief. The user requested it after capture.

## Left for the orchestrator

These are recorded here because no other durable home fits a capture-only stream:

- **The 28 closed `fgv-ask` issues were not swept against fgv.** Closure on the PersonAIlity side
  was taken at face value.
- **The pre-tracker notes in PersonAIlity `.ai/notes/fgv-share/` were not swept** (about 30
  files, 2026-05 to 2026-08). They may hold asks that were never filed as issues.
- **M9 was recorded but not filed by the requester.** It is a `mcp-probe` report enhancement,
  noted in `state.md`.

## Gates

- `git diff --name-only origin/integration/agent-tasks-v1...`: every path is under the task
  directory.
- `rush change --verify --target-branch origin/integration/agent-tasks-v1`: no relevant package
  changes, so no change file is needed.
- No code changed, so there was no build, test or review gate to run.
