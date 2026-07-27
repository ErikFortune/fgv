# Convention — `convention.workflow.artifact-protocol`

> Source: distilled from `<repo>/docs/WORKSTREAMS.md` preamble §
> Artifact protocol and `<repo>/docs/CHORES.md § Artifact migration is
> pre-merge` in the source corpus.

The lifecycle of per-stream and per-chore-batch artifacts: where they
live during execution, where they live after merge, when they
migrate, and what the polished completion record looks like.

---

## The two-tree structure

The orchestrator workflow family uses a two-tree structure for live
work and historical record:

```
.ai/tasks/
├── active/<id>/                  # live work, in-flight
│   ├── brief.md                  # the contract (input)
│   ├── state.md                  # live checkpoint (worker updates)
│   ├── result.md                 # exit artifact (worker writes at end)
│   ├── followups.md              # consolidated followups
│   └── findings/inbox/<…>.md     # per-file findings inbox (scribe writes)
│
└── completed/<bucket>/<id>/      # post-merge historical record
    ├── README.md                 # polished completion record
    ├── brief.md                  # archived (read-only)
    ├── state.md                  # archived (read-only)
    ├── result.md                 # archived (read-only)
    └── followups.md              # archived (read-only)
```

Path conventions are project-configurable:

- The base path (`.ai/tasks/`) is a project choice.
- The bucket (`<bucket>` — `2026-05` in the source corpus) is a
  project choice. Year-month, semantic-version, or wave-shaped
  bucketing all work.
- Stream IDs and chore-batch IDs follow the project's stream
  convention.

## When migration happens

**Pre-merge.** The migration from `active/<id>/` to
`completed/<bucket>/<id>/` is part of the stream's PR — not a
follow-up. The PR is one coherent unit:

- The stream's code changes.
- The artifact migration.
- The polished completion `README.md`.

This is the load-bearing rule. The two ways it can go wrong:

- **Migration after merge.** Active and completed are out of sync;
  the historical record is built post-hoc and risks losing context.
  The source corpus had earlier streams that ran under "migration
  on merge" wording — those needed hand-finalization with notable
  effort.
- **Migration in a separate follow-up PR.** Splits a coherent unit
  across two PRs, complicates review, and introduces a window where
  active still exists but is stale. Observed again on the
  `ai-assist-client-tools` cluster close (2026-06-04, PR #451 →
  PR #452 follow-up). The codified rule existed; the failure was
  the orchestrator's pre-promotion checklist not gating on it.
  Fixed by adding gate #4 to the orchestrator agent's "Before
  advancing the workflow" checklist (`.claude/agents/orchestrator.md`).

The convention is unambiguous: **the migration ships in the same PR
as the work**.

## What the polished `README.md` looks like

The completed-tasks `README.md` is the durable historical record.
It's read by:

- Future agents picking up related work and wanting context on
  what shipped.
- The orchestrator extracting followups for chore batches.
- Reviewers auditing the workflow's evolution.

Standard sections:

```markdown
# <Stream ID> — <one-line title>

**Shipped**: <date> via <PR reference>.

## Summary
<one-paragraph what shipped>

## Files changed
<key files / new packlets / new wire surfaces>

## Per-phase summaries
<one paragraph per phase>

## Decisions made during execution
<design choices that landed; deferred ones>

## Followups
<links to active stream followups still in-flight, or to where they
landed if drained pre-merge>

## Lessons codified during the run
<bulleted list of anything routed via
convention.workflow.lessons-codification-triage>

## References
- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md`
- PR: <link>
```

## State.md as the resume protocol

`state.md` is the worker's live checkpoint. Updated at every phase
boundary (or every item boundary for chore batches). The worker
treats it as an out-of-band note to a future-self that may pick up
mid-stream.

If a session crosses a context boundary:

1. Worker reads the brief in full.
2. Worker reads `state.md` to find current checkpoint.
3. Worker confirms with the orchestrator that scope and boundaries
   still apply.
4. Worker resumes at the next un-checked phase / item.

An empty `state.md` after substantial work is a process bug.

## Inbox-and-drain for findings

Findings surfaced during execution (whether by the worker or by a
scribe-agent) go to a per-file inbox under
`active/<id>/findings/inbox/<timestamp>-<slug>.md`, **not** directly
to `followups.md`. The orchestrator drains the inbox into the
consolidated `followups.md` periodically. See
`convention.workflow.inbox-and-drain` for the full pattern.

## Durable-doc references

Release-durable docs (`docs/FUTURE.md`, `LIBRARY_CAPABILITIES.md`,
conventions, completed-task `README.md`s) **cite PRs or on-release
artifacts — never active-branch task files**. A transient firm-up or
analysis artifact that lives only on a feature branch (e.g.
`.ai/tasks/active/<id>/open-questions.md` on an unmerged branch) is a
dangling reference the moment the durable doc lands on `release`
without it. If the artifact itself won't graduate, cite the **PR that
consumed it** (PR numbers are GitHub-durable) or restate the needed
content in the durable doc's own entry.

(Observed: N-Ask5's `FUTURE.md` entry cited
`.ai/tasks/active/n-ask5-firmup/open-questions.md`, which lived only
on a never-merged relay branch; fixed in #564 by pointing the entry
at the shipped PRs.)

## Anti-patterns

- **Migration as follow-up after merge.** Splits the coherent unit;
  risks losing context.
- **Durable doc cites an active-branch task file.** The reference
  dangles once the doc is on `release`. Cite the consuming PR or an
  on-release artifact instead (see "Durable-doc references").
- **`state.md` written only at exit.** Defeats the resume protocol.
- **`result.md` written before phase completion.** Mid-flight
  result.md content masks not-yet-shipped work as shipped.
- **Polished README skipped.** "Just leave the active artifacts in
  completed/" loses the durable historical record's value.
- **Followups silently dropped at migration time.** Followups
  surfaced during the stream must be in the consolidated followups
  file, drained from the inbox, before migration. Otherwise they're
  lost.

## Adapter notes

The two-tree structure is a directory-naming convention, not a
harness mechanism. Any harness that allows the orchestrator and
worker to read and write project files can implement it. The
realization in the source corpus uses `.ai/tasks/`; other projects
may prefer different roots (e.g. `streams/`, `tasks/`, `work/`).
