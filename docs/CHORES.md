# Chores — fgv

Scheduled cleanup batches. Different from TECH_DEBT (long-running
structural debt) and FUTURE (parking lot of ideas). A chore batch
is a focused agent run that closes several small items at once,
typically tied to a specific transition — between waves of
workstreams, between phases, after a major refactor lands. Each
batch is bounded, agent-shaped, and usually 3–6 items.

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

- **Between waves of streams.** Two streams just merged; they
  surfaced N items that all want to land before the next wave.
- **After a major refactor.** A refactor that ships green but leaves
  test-only paths or `TODO`-marked follow-ups.
- **Pre-phase transitions.** When a phase closes and the next phase
  begins, items that don't belong to either are chore-shaped.

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
