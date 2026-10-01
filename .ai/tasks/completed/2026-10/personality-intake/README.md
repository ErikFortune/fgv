# `personality-intake`: PersonAIlity's open fgv asks, captured untriaged and checked against repo state

**Shipped 2026-10-01** via ErikFortune/fgv#711. No package was changed.

---

## What it is

This directory is a batch of 17 consumer requests, ready for triage. Each one is an open `fgv-ask`
issue in `ErikFortune/personaility`, and each has its own file in `findings/inbox/`. A file carries:

- the source issue
- the long-form note that issue links to
- the requester's own framing, with every constraint quoted
- the requester's own priority
- a marked `Observations` section, the only place the intake agent's voice appears

`index.md` is the one-screen table of the batch.

| area | asks |
|---|---|
| `ts-extras-mcp` | ErikFortune/personaility#671–ErikFortune/personaility#678: timeout/abort, fetch guard, failure kinds, terminate, rich results, descriptor + list_changed, OAuth, transport seam |
| `ts-json-base` `JsonSchema` | ErikFortune/personaility#679–ErikFortune/personaility#683: open-object key loss, `anyOf [T, null]`, local `$ref`, constraints through `toJson()`, smaller shapes |
| `ts-extras` ai-assist | ErikFortune/personaility#684: the turn's `AbortSignal` passed to `IAiClientTool.execute` |
| `ts-random` | ErikFortune/personaility#669: weighted pick |
| `ts-agent-memory` | ErikFortune/personaility#670: `derivedFrom` docstring |
| `ts-extras` / `ts-web-extras` | ErikFortune/personaility#648: the browser barrel omits `fromBase64Strict` |

## State at close: all 17 open

The batch was swept against fgv repo state after capture. The checks covered `release`,
`integration/agent-tasks-v1`, every branch active since 2026-09-19, the open PRs, and history
searches for each item's symbols. **None of the 17 is implemented anywhere.** `state.md` gives the
evidence for each item.

Fourteen of the asks are from the 2026-10-01 MCP cluster. Only three predate it, and none of those
three has landed.

## Why capture-only

A summary that decides what matters has already made the triage calls, invisibly and without
knowing what is cheap here or what collides with work in flight. So nothing in this batch is
ranked, merged or dropped. Priorities shown are the requester's own.

## Draining it

The inbox moved to `completed/` with the rest of the directory, because the user asked for the
stream to be finalized. The next orchestrator drains
`.ai/tasks/completed/2026-10/personality-intake/findings/inbox/` from here.

## Not covered (named in `result.md`)

- The 28 **closed** `fgv-ask` issues. Their closure was taken at face value; this is where
  fgv's delivered asks are.
- The older notes in PersonAIlity `.ai/notes/fgv-share/` from before the tracker. They may hold
  asks that were never filed as issues.
- M9 (an `mcp-probe` report enhancement). The requester recorded it but chose not to file it.

## Artifacts

`brief.md` (the original contract) · `state.md` (enumeration, exclusions, ambiguities, sweep) ·
`result.md` (outcome, deviations) · `index.md` · `findings/inbox/` (17 files) · `meta.yaml`.
