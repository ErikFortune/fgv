# Convention — `convention.workflow.inbox-and-drain`

> Source: distilled from `<repo>/.ai/instructions/ORCHESTRATOR_ROLE.md
> § Followups-inbox drain` and `<repo>/.ai/instructions/SCRIBE_ROLE.md`
> in the source corpus.

The pattern for collecting stream findings (from manual testing,
post-merge observation, scribe sessions) into a per-file inbox during
the stream's lifetime, drained periodically by the orchestrator into
the consolidated followups file.

---

## The shape

```
.ai/tasks/active/<stream-id>/
├── findings/
│   └── inbox/
│       ├── 2026-05-03-1430-broken-validation.md
│       ├── 2026-05-03-1715-fixture-drift.md
│       └── 2026-05-04-0915-stale-marker-rendering.md
└── followups.md       # consolidated, numbered, class-grouped
```

**Inbox writers** (scribes, implementing agents) write per-file
finding entries to `findings/inbox/<timestamp>-<slug>.md`. **One
finding per file** — no bundling.

**Drain target** is the consolidated `followups.md`. Only the
orchestrator writes there.

## Why per-file inbox instead of direct followups append

The previous "scribe writes directly to followups.md" pattern
produced repeated merge conflicts when:

- Multiple writers (scribe, implementing agents marking resolved,
  orchestrator restructure ops) iterated on the same file.
- Long-running stream review cycles created many appends per day.
- Implementing agents and scribes ran simultaneously during manual
  testing.

Per-file inbox eliminates the collision surface — each writer
creates a new file; the orchestrator owns the consolidated
structure.

The trade: implementing agents see consolidated state only after a
drain, not on every scribe write. Acceptable — drains can happen on
demand if an implementing agent needs the latest consolidated state.

## Inbox file format

Single finding per file. Filename: `<YYYY-MM-DD-HHMM>-<short-slug>.md`.

```markdown
# <terse title>

- **Where**: `<file>:<line>` (or pattern across files).
- **Finding**: <quoting user framing; one-paragraph>.
- **Fix shape**: <one-paragraph corrective change>.
- **Deferral rationale**: <why deferred — usually "out of stream scope" or "ties to other followup">.
```

No numbering — orchestrator assigns numbers at drain time.

## Drain trigger

Opportunistic — drain when:

- The inbox accumulates ~5+ files.
- A stream-close is approaching.
- Before opening a buffer-line promotion PR.
- Implementing agents need a consolidated work list.

Don't wait for a specific cadence; drain when the consolidated view
becomes load-bearing.

## Drain procedure

1. **List the inbox** (`ls .ai/tasks/active/<id>/findings/inbox/`).
2. **Read each inbox file** and the current `followups.md` to
   understand the existing structure (numbering, class grouping,
   status framing).
3. **Decide placement** for each inbox finding — which class
   subsection in `followups.md` it belongs to; what number to assign
   (continuing the existing sequence).
4. **Append to `followups.md`** with the consolidated format.
5. **Delete the inbox file** once it's drained — the consolidated
   entry in `followups.md` is the durable record.
6. **Commit + push** the drain operation as a single commit (e.g.,
   `chore: drain <stream-id> findings inbox (5 entries → followups #21-25)`).

Token-cheap: routine bookkeeping. Delegate to a cheap-model agent
unless the inbox findings need substantive triage (multiple findings
overlap and need merging into one entry; a finding's class isn't
obvious).

## Anti-patterns

- **Scribes writing to `followups.md` directly.** Defeats the
  collision-surface elimination.
- **Bundling multiple findings per inbox file.** One finding per
  file is the rule; if two findings are clearly the same shape on
  different surfaces, that's still two files (with cross-references
  in the body if useful).
- **Drains skipped indefinitely.** The inbox is a write-only
  scratchpad; without drains, the consolidated `followups.md`
  drifts behind reality. Drains should run before stream-close
  regardless of inbox volume.
- **Drains as part of every individual append.** Defeats the
  efficiency of per-file inbox; restores the merge-conflict
  surface.
- **Renumbering or restructuring during a drain.** The drain is
  append-only at the consolidated level; restructuring is a
  separate orchestrator operation.

## Adapter notes

The inbox-and-drain pattern is a directory-naming convention.
Realization in source corpus uses `findings/inbox/` under the active
task directory; project paths can vary as long as the per-file
write-only inbox property holds.
