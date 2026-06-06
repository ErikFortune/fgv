# Chores — fgv

Scheduled cleanup batches. Different from TECH_DEBT (long-running
structural debt) and FUTURE (parking lot of ideas). A chore batch
is a focused agent run that closes several small items at once,
typically tied to a specific transition — after a feature ships
with surface-local followups, before an adjacent feature starts on
the same surface, or after a consumer-integration round closes and
the open items become legible. Each batch is bounded, agent-shaped,
and usually 3–6 items.

---

## What goes here vs. TECH_DEBT vs. FUTURE

| Doc | Captures | Shape | Closed by |
|-----|----------|-------|-----------|
| **Batch register (this doc)** | Scheduled cleanup tied to a specific transition | Time-bounded, batched, 3–6 items | A focused agent run |
| **TECH_DEBT** | Long-running structural debt | Priority-ranked (P1–P4) | Opportunistically — when the right surface area is touched |
| **FUTURE** | Parking-lot ideas, not on roadmap, not non-goals | Captured with rationale | Promoted to roadmap when concrete demand surfaces |

Items can move between docs. A TECH_DEBT entry that becomes
time-critical can be promoted into the active chore batch.

## Process notes

### When to open a new batch

A chore batch needs a concrete transition trigger. Recognized
triggers in this repo:

- **Post-feature followup batch.** A feature stream just shipped
  to `release` and left N small followups on its surface (test-only
  paths, deferred coverage closures, TODO-marked cleanups).
- **Adjacent-feature prep.** Another stream is about to start on a
  surface adjacent to one that's been accumulating debt — clean it
  up before the new stream touches it, so the new stream isn't
  fighting old smells.
- **Pre-alpha tidy.** Before cutting an alpha (i.e. before mirroring
  `release` → `prerelease` for a publish), sweep for changelog
  rot, doc-rot, and obvious cross-package inconsistencies that the
  alpha would otherwise carry.
- **Post-consumer-integration sweep.** After a consumer applies a
  feature end-to-end, the friction they hit usually surfaces a
  cluster of small fixes worth batching.

Items that don't have a concrete trigger belong in TECH_DEBT or
FUTURE, not here.

### Kickoff-prompt shape for chore agents

Reference: `.ai/conventions/workflow/kickoff-prompt-shape.md` §
interleaved-per-item. A chore batch is a **sequential walk** through
3–6 small items, not a single coherent feature. **Don't** give the
agent a single upfront "Read everything before coding" list spanning
all items.

### Coverage-closure items — explicit smell guidance

Any chore item that includes "close coverage gaps" needs explicit
guidance to **load `/result-pattern` before reaching for coverage-
suppression**, plus a one-line description of the smell:

> If you're about to add a coverage-suppression directive around an
> imperative `isFailure()` propagation block, that's a refactor
> signal. Try chaining first — it usually closes the gap
> structurally. Accept suppression only after determining the
> imperative form is genuinely the right shape. See
> `.claude/skills/result-pattern/SKILL.md` § Coverage-gap smell.

### Artifact migration is pre-merge

Same rule as workstreams. The chore-batch agent migrates
`.ai/tasks/active/<batch-id>/` → `.ai/tasks/completed/<YYYY-MM>/<batch-id>/`
and writes the polished `README.md` **as part of the PR, before
merge**, not as a post-merge follow-up.

---

## Active batch

*(No active batch.)*

---

## Completed batches

*(No completed batches yet.)*
