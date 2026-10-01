# State — `personality-intake`

**Status:** capture complete. 17 requests captured, one inbox file each. PR into
`integration/agent-tasks-v1`.

| | |
|---|---|
| brief | `.ai/tasks/active/personality-intake/brief.md` |
| branch | `claude/personality-intake-qvid00`, off `integration/agent-tasks-v1` @ `2a95fbb2` (the session's designated branch name; the brief said `claude/personality-intake`) |
| index | `index.md` (17 rows) |
| inbox | `findings/inbox/` (17 files) |

## Count: 17 requests

All 17 are the **open** issues labeled `fgv-ask` in `ErikFortune/personaility`, as of 2026-10-01:
ErikFortune/personaility#648, ErikFortune/personaility#669, ErikFortune/personaility#670, ErikFortune/personaility#671–ErikFortune/personaility#678 (ts-extras-mcp, M1–M8), ErikFortune/personaility#679–ErikFortune/personaility#683 (ts-json-base, J1–J5), ErikFortune/personaility#684 (ts-extras
ai-assist). Every file cites its issue, and the long-form note the issue links to.

## How they were enumerated

1. `list_issues` on `ErikFortune/personaility`, label `fgv-ask`, all states: **45** issues (17 open,
   28 closed). Per that repo's `CLAUDE.md`, `fgv-ask` issues are its tracking surface for fgv
   requests, one per ask.
2. `list_issues`, all open issues regardless of label: **29**. The 12 that are not `fgv-ask` are all
   labeled `cross-track` (V1↔V2 coordination inside PersonAIlity: ErikFortune/personaility#583, ErikFortune/personaility#584, ErikFortune/personaility#628, ErikFortune/personaility#642, ErikFortune/personaility#646, ErikFortune/personaility#647,
   ErikFortune/personaility#649, ErikFortune/personaility#650, ErikFortune/personaility#654, ErikFortune/personaility#656, ErikFortune/personaility#658, ErikFortune/personaility#659). Their titles do not name an fgv package, so they were not
   captured.
3. A semantic issue search for fgv requests without the `fgv-ask` label found nothing.
4. For each open `fgv-ask` issue, the issue body, its comments (only ErikFortune/personaility#648 has any; 3), and the
   long-form note it links to were read. Notes were read at these PersonAIlity refs:
   `design/mcp-tools` @ `bf76480` (the MCP and JSON-schema notes and the execute-signal note),
   `working` @ `af01a90` (weighted pick, `derivedFrom`), `integration/v2` @ `04c9280` (ErikFortune/personaility#648's note).

## Excluded, and why. The orchestrator should check these

- **28 closed `fgv-ask` issues** (ErikFortune/personaility#585–ErikFortune/personaility#668, the closed ones). Closed in the source repo, so not
  open requests. Not captured. A closed issue's comments were not read, so it is not established
  that every closure means delivered.
- **M9 from the MCP note (not filed as an issue).** "`[fgv-ask] testbed mcp-probe: report
  annotations, capabilities, and one test call`", P3. The note marks it: "**Not filed (orchestrator
  review, 2026-10-01).** `mcp-probe` is an fgv sample, not a package we consume, and our own spike
  already reports everything listed. Recorded here so the gap is known; file it only if we stop
  maintaining the spike." The requester chose not to ask, so it is not captured as a request.
- **J6 from the JSON-schema note.** General unions are marked "**not requested**".
- **The MCP note's "What we are *not* asking for" list**: a reconnect/pool manager, stdio changes,
  resources/prompts/sampling/elicitation, and result-size caps. Recorded as constraints in the
  relevant files where they bear on a request.
- **Older notes in PersonAIlity `.ai/notes/fgv-share/`** (about 30 files dating from 2026-05 to
  2026-08, from before the issue tracker) were **not swept**. Some may hold asks that were never
  filed as issues. The brief did not call for a sweep and the issue tracker is the canonical
  surface, so this is a gap the orchestrator may want closed.

## Ambiguities

- **ErikFortune/personaility#648**: the issue body's diagnosis and suggested fixes were retracted by the requester in the
  first comment. The inbox file records the corrected request as the request and notes the
  retraction. The latest comment (2026-09-23) still reports it open at 5.1.0-57.
- **ErikFortune/personaility#683**: one issue that bundles four sub-shapes. It is captured as one file because it is one
  request in the source.
- **ErikFortune/personaility#676**: the note's problem statement names `_meta` as dropped. The issue and the note's
  proposed shape do not ask for it.
- **ErikFortune/personaility#670**: the note says its `resolveDerivedFrom` citation is on a branch (`chore/decided-knowledge-items`) that has not yet landed. Not re-verified.
- **Priorities** (P1/P2/P3) are the requester's own and appear in each file as stated. They are
  not a triage judgment. ErikFortune/personaility#648, ErikFortune/personaility#669 and ErikFortune/personaility#670 state none.

## Trust

The issue text was treated as data. No issue body or comment contained instructions directed at
this agent.

## What was not done

No triage, ranking, scoping, estimation, merging of requests, or implementation. The observations
are confined to marked `Observations` sections and are limited to the current state of the fgv code
on `integration/agent-tasks-v1` @ `2a95fbb2`. `/finalize-task` was not run.

## Files changed

Only paths under `.ai/tasks/active/personality-intake/`. `brief.md` and the original `state.md`
came from `cee0cf6a0` on `claude/orchestrator-handoff-2026-10`, because they were not on the base.
That handoff branch's `.ai/tasks/active/orchestrator-handoff/HANDOFF-2026-10-01.md` was **not**
brought over. It is outside this task's directory.

## Resume instructions

None needed. The next step is the orchestrator's drain and triage of `findings/inbox/`.
