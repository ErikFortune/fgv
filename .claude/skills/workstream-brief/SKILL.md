---
name: workstream-brief
description: Use to extract a tight operational brief for a parallel workstream from the project's streams ledger (docs/WORKSTREAMS.md). Pass a workstream id and this skill walks you through reading the source brief, the linked reading list, and the cross-stream dependencies to produce a kickoff document that a fresh agent can pick up cold. Required step before kicking off any parallel cloud-agent run on a workstream — also useful in the IDE to scope a session. The brief explicitly stakes out which files the stream may modify, which it must NOT touch (collision avoidance with other parallel streams), the acceptance criteria, and the handoff contract for downstream streams.
---

# Workstream Brief

This skill turns the multi-page streams-ledger design doc into a
self-contained kickoff brief for one stream. Use it before any
parallel run — the brief is the contract. If the brief turns out
wrong, update the streams ledger before deviating.

## Inputs

- **Workstream ID** (required): the stream identifier per the
  project's convention. The user (or invoking agent) provides this.
- **Optional flag** `--write`: if set, the brief is written to the
  active-tasks directory for resumption later.

## Procedure

### 1. Read the source brief

Open `docs/WORKSTREAMS.md` and locate the section for the requested
workstream id. Read its **full** entry: track, status today, v1
deliverable, stop point, reading list, dependencies, publishes-for-
downstream, open design questions.

### 2. Read the reading list

Each workstream lists required reading. Open every file/section it
names and load enough context to write the brief without re-reading
the linked docs while operating. **Don't skim.** This is the moment
you trade depth for later speed.

### 3. Identify file-level boundaries

The brief must answer two questions every parallel agent needs to
know **before touching anything**:

- **In-scope paths** — what this workstream is allowed to modify. Be
  explicit. If the workstream's deliverable is fuzzy (e.g. "design
  spike"), list the files the spike will likely touch.
- **Out-of-scope paths** — what other streams own. Cross-reference
  the streams ledger's Dependencies and Publishes-for-downstream
  sections. Anything another active stream will modify is **out of
  scope**, even if it would seem natural to touch it. If you must
  touch a shared file, pause and escalate to the user before
  proceeding.

If you can't cleanly separate in-scope from out-of-scope, that's a
finding — report it and ask the user how to proceed before kicking
off the work.

### 4. Capture the handoff contract

Each workstream **publishes** something for downstream streams (an
interface, a data model, a doc). Translate the source doc's
"Publishes for downstream" bullets into concrete artifacts: file
paths, exported type names, doc sections. Downstream streams will
rely on these — they need to be unambiguous.

### 5. Emit the brief

Use the template below. Be terse. Every line should be load-bearing.

```markdown
# Workstream Brief: <id> — <name>

## Mission
<1–2 sentences summarizing what this stream achieves>

## Status entering
<one line: what exists today, what's missing>

## In-scope paths (you may modify)
- <path>
- <path>

## Out-of-scope paths (you must NOT modify — owned by other streams)
- <path> — owned by <other stream id>
- <path> — owned by <other stream id>

## Required reading (load before writing code)
- <file or doc§section>
- <file or doc§section>

## Missing-input rule (non-negotiable)

If any required-reading file or other declared input doesn't exist or
you can't access it: **STOP**. Surface the gap to the user.

Do NOT:
- Recreate the missing input from your own analysis or codebase
  exploration.
- Re-derive followups / state / brief content from scratch.
- Improvise or guess at what the input was supposed to contain.

Missing required-reading is an orchestrator-level provisioning gap,
not an agent-level workaround.

## Dependencies
**Hard** (cannot start without): <list, or "none">
**Soft** (can stub if upstream not ready): <list, or "none">

## v1 deliverables (in order)
1. <numbered item from the streams ledger, terse>
2. …

## Acceptance criteria (the "stop point")
- [ ] <criterion derived from the streams ledger's stop point>
- [ ] Build passes (`rush build` from repo root, or `rushx build` from project dir)
- [ ] Tests pass (`rush test` or `rushx test`)
- [ ] Lint clean in any modified project (`rushx lint`)
- [ ] No ad-hoc `console.*` in business logic — use `@fgv/ts-utils` Logging

## Handoff contract (what you publish for downstream streams)
- <artifact> — consumed by <downstream stream id(s)>
- <artifact> — consumed by <downstream stream id(s)>

## Open questions to resolve
- <question> — recommended approach: <option>
- <question> — escalate to user

## Findings-inbox convention
Findings surfaced during the stream go to per-file inbox entries at
`.ai/tasks/active/<id>/findings/inbox/<timestamp>-<slug>.md` — one
finding per file. The orchestrator periodically drains the inbox
into the consolidated `followups.md`. Don't write to `followups.md`
directly during the stream.

## Required exit artifact

On completion, write `.ai/tasks/active/<id>/result.md` with:

- Branch name
- One-paragraph summary
- Files changed (list)
- Build / test / lint status (pass/fail per command)
- **Observability self-audit**: grep in-scope paths for `console.*`
  in business logic; confirm zero hits or document each kept-as-is
  site with explicit rationale.
- **Convention-compliance sweep**: check for known anti-patterns
  (see `.ai/instructions/CODE_REVIEW_CHECKLIST.md`).
- **Sibling-sweep pass** on new surfaces: for each new surface,
  ask "what siblings did I asymmetrically diverge from?"
  (see `.ai/conventions/workflow/sibling-sweep-lens.md`)
- Open questions or follow-ups for downstream
- Any deviation from this brief (and why)

## Resume protocol
If interrupted, before resuming:
1. Read this brief in full again.
2. Read `.ai/tasks/active/<id>/state.md` for the most recent checkpoint.
3. Confirm with the user that scope and boundaries still apply.
```

### 6. (Optional) Persist the brief

If `--write` was passed, create `.ai/tasks/active/<stream-id>/` and
save the brief as `brief.md`. Also create an empty `state.md` with
a header so the directory is structurally ready for the resume
protocol.

### 7. Hand off

Output the brief to the user. The brief is the contract for the
parallel run. If kicking off a cloud agent, hand it the brief
verbatim — the brief should be sufficient to start cold, without
re-reading the streams ledger.

## Quality bar for the brief

A good brief is one where a fresh agent can:

- Start work within 30 seconds of reading.
- Know exactly which files are theirs.
- Know exactly what to deliver to call it done.
- Know exactly what to write at the end so the next stream can
  pick up.

If you can't say yes to all four, the brief isn't tight enough —
go back to the source doc and refine.

## Anti-patterns

- **Don't synthesize fiction.** If the streams ledger is silent on
  something the brief needs (e.g. file-level scope), say so and
  ask. Don't fabricate.
- **Don't paraphrase the design.** The brief is operational — file
  paths, criteria, contracts. Design rationale stays in the
  streams ledger.
- **Don't skip the out-of-scope list.** That's the whole point of
  doing this for parallel runs.
- **Don't ship a brief without the observability compliance line.**
  When the rule isn't in the brief at the authoring moment, the
  pattern doesn't reach the implementing agent and ad-hoc
  diagnostic sites accumulate.
- **Don't ship a brief without the missing-input rule.** Agents
  will try to reconstruct missing inputs from codebase exploration
  — that's scope deviation disguised as helpfulness. The
  missing-input rule explicitly prohibits this.
