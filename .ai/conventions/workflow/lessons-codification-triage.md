# Convention — `convention.workflow.lessons-codification-triage`

> Source: distilled from `<repo>/.ai/instructions/ORCHESTRATOR_ROLE.md
> § Working style / lesson-extraction has four buckets` in the source
> corpus.

The meta-convention that governs where every other convention, skill,
or rule lands. When the orchestrator notices a recurring pattern —
an avoidable bug, a rolled-own utility that already had a published
primitive, a missing convention — this convention says where the
fix goes.

---

## The destinations

Five destinations in increasing weight. Each has a different load
pattern and a different cost.

| Destination | Shape | Load pattern | Cost |
|-------------|-------|--------------|------|
| **Stream-local note** (`result.md`) | One-off observation | Read by future agents working on this stream's followups | Negligible — a paragraph |
| **Doc convention** (one of the cross-cutting docs) | Design-shape lesson that applies to a surface | Read when working on the surface | Low — an entry in an existing doc |
| **Code-review checklist item** | Exit-gate check | Read at code review time | Low — a line in the priority-ranked list |
| **Skill** (project's harness skill directory) | Procedural knowledge | Loaded just-in-time when relevant work surface is touched | Medium — a SKILL.md with examples + anti-patterns |
| **Always-on rule** (project-instructions file) | Non-negotiable | Loaded every session | High — competes with every other always-on rule for attention |

Workflow shapes (a process change) are a sixth destination — the
heaviest. Loading a new workflow into the family is a substantial
operation.

## The triage

For each surfaced pattern, ask:

1. **Is it a one-off?** → Stream-local note. No further routing.
2. **Does it apply to a specific design surface?** → Doc convention
   in the surface's cross-cutting doc.
3. **Is it a check that runs at code-review time?** → Code-review
   checklist item.
4. **Is it procedural knowledge that needs to fire just-in-time when
   a specific work surface is touched?** → Skill.
5. **Is it non-negotiable, always-applies, every-session?** →
   Always-on rule.
6. **Is it a process change, not a code change?** → Workflow shape.

The triage is the load-bearing thing. Without it, the same lesson
re-learns itself every cycle, or competes for attention in the
always-on slot when it should be just-in-time.

## Indicators for each destination

### Stream-local note

- The pattern is specific to this stream's surface.
- The fix lands in this stream or a follow-up that doesn't recur
  elsewhere.
- A future agent working on a related stream wouldn't benefit from
  the framing.

### Doc convention

- The pattern is design-shape — it informs how to think about a
  surface (a wire model, an auth flow, a data shape).
- The right home is an existing cross-cutting doc.
- The agent reading the doc *is* the audience; they'll see the
  lesson when working on the relevant surface.

### Code-review checklist item

- The pattern is mechanical at review time — grep, eyeball-pass,
  structural check.
- The fix is "verify X is or isn't in the diff."
- The pattern doesn't need procedural framing during authoring;
  catching it at review is sufficient.

### Skill

- The pattern is procedural — it tells the worker *how to do
  something*, not *what to verify*.
- The trigger is concrete (specific work surfaces, specific
  imports, specific shapes).
- The cost of loading is justified by the load-just-in-time
  property — the worker only needs it when the trigger fires.
- Pattern indicator: when a doc-convention or always-on rule isn't
  firing reliably because the surface is too broad, promote to
  skill (the just-in-time load gives the reflex a concrete
  trigger).

### Always-on rule

- The pattern is non-negotiable at the project level.
- It applies broadly enough that just-in-time loading is too late.
- The cost (every-session attention) is justified by the breadth
  of applicability.
- Use sparingly — every always-on rule competes with every other
  for the agent's reading attention.

### Workflow shape

- The pattern requires a structural process change, not a code
  change.
- Existing workflows can't accommodate it without bending.
- The new shape will recur often enough to justify a workflow
  family member of its own.

## Promotion across destinations

Lessons can move between destinations as their pattern matures:

- **Doc convention → skill**: when the convention isn't firing
  reliably because its load-pattern is too implicit. Source corpus
  pattern: an always-on rule about checking the toolset's published
  primitives wasn't firing for the fourth instance; promoted to
  the `published-primitives-reflex` skill.
- **Skill → always-on rule**: rare. When a skill's trigger pattern
  generalizes broadly enough that every-session loading is cheaper
  than every-session deciding-whether-to-load.
- **Doc convention → code-review checklist item**: when a
  convention recurs in PR review enough that catching at exit is
  more efficient than catching at authoring.
- **Stream-local note → any of the above**: when a one-off pattern
  recurs across multiple streams.

## Anti-patterns

- **Default to always-on rule.** Every-session attention is
  expensive; over-using the always-on slot diminishes returns on
  every rule there.
- **Default to doc convention without considering skill.** If the
  surface is too broad for the agent to "remember to read the
  doc," promote to skill.
- **Skip the triage entirely.** "Just add a TODO" is the worst
  outcome — the lesson lands nowhere durable.
- **Multiple destinations for the same lesson.** Pick one; link
  from the others. Duplication leads to drift; the linked source
  stays canonical.
- **Workflow shape as the default for process pain.** Most
  process pain is convention-shaped, not workflow-shaped. Adding
  a workflow has high cost; reach for it only when convention
  changes can't accommodate.

## The convention is itself codified here

This convention is the meta-convention — it's the rule that governs
where new rules land. As such, it lives in the workflow conventions
section so it's discoverable when the orchestrator is composing a
new lesson's destination.

## Adapter notes

The triage is procedural — applied through the orchestrator's
judgment when surfacing lessons. No special harness mechanism.
