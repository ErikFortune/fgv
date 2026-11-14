# Convention — `convention.workflow.sibling-sweep-lens`

> Source: distilled from the `workstream-brief` skill's exit-checklist
> section + `<repo>/.ai/instructions/ORCHESTRATOR_ROLE.md § Babysitting
> a long PR review cycle` in the source corpus.

The structural review pass run at exit-time on every stream and at
post-merge time on substantial PRs. Different shape from a grep-based
convention check — a structural review with the explicit lens "what
siblings of each new surface did I asymmetrically diverge from?"

---

## When the lens applies

- **Worker exit-time** — the implementing agent runs it as part of
  the stream's exit checklist before writing `result.md`.
- **Pre-PR-open deep-reviewer pass** — for substantial PRs, a fresh
  agent runs it before the PR opens, to reduce review-round count.
- **Post-merge fresh-agent sweep** — after a long-PR-review cycle
  hits the threshold (~10 rounds), a fresh agent runs the lens
  against the merged diff. The implementing agent is *not* the right
  fit for this — author-blind-spot reproduces.

## The lens — what to look for

For each new surface in the diff, ask: what siblings of this surface
exist elsewhere in the codebase, and did this stream asymmetrically
diverge from them?

Concrete categories the lens covers:

### New validation site

Does the same field have a validator elsewhere (entry form, retry
form, server-side handler)? Are they consistent on trim / case /
required-vs-optional?

The recurring miss: validation rules added on one path don't get
mirrored on sibling paths. The fixture-vs-production drift pattern
(fixtures that accept inputs production validators reject) is a
specific instance of this lens missing.

### New control-flow branch

Does the new branch's precondition match siblings? E.g., a
fall-through-to-public rule that's `(!a && !b)` when sibling rules
elsewhere use just `(!a)` — the conjunction is probably overfit.

### New error-rendering path

Does it classify failures the same way as sibling paths? Raw error
text vs friendly copy vs disclosure pattern. The recurring miss is
that error-classification helpers added on one path don't get
applied on the other.

### New helper function / state-clearing patch / discriminator

Does the carve-out logic match the actual asymmetry? E.g., a "clear
secrets" helper that uniformly preserves a field when only one
branch needs it. Asymmetric-by-design vs asymmetric-by-accident
matters; the lens forces explicitness.

### New prop on a component

Is it forwarded consistently along every parent chain that mounts
the component? Drop-on-the-floor in one path is a common miss.

### New fixture subclass

Would this carve-out be needed across multiple tests? If yes, that's
a base-fixture-hardening smell — when a fixture pattern recurs
across many tests, the base fixture wants extending, not the
subclass cluster growing.

## What the lens is not

- **Not a grep.** A grep catches `it()` vs `test()`, `as never`,
  temporal comments. Those are convention checks. The sibling-sweep
  is structural — it looks at the *shape* of what landed and
  whether the shape matches sibling code's shape.
- **Not "review every file."** It's targeted at the diff's *new
  surfaces* — new functions, new branches, new components, new
  fixture patterns. Sibling code is touched only when the lens
  flags an asymmetry.
- **Not a self-review for catching architectural issues.** The
  fresh-agent variant catches what the implementing agent's
  author-blind-spot can't. The author-self variant catches what's
  visible from the lens but missed in implementation.

## Why the convention exists

Pattern that motivated it: a fix walks the path it was scoped to;
the new surface's asymmetric divergences with siblings get missed
and surface in the next review round. The source corpus tracked
this across multiple stream review cycles — substantive-finding
volume held high across rounds 13-18 of one cycle because each new
fix opened new sibling surfaces.

Doing the sibling-sweep at exit-time costs ~10 minutes; absorbing
it across multiple review rounds costs hours.

## Doing it well

The lens is reflexive when the implementing agent has the discipline,
load-bearing for fresh-agent variants. The fresh-agent prompt
should:

- **Define the lens with concrete examples** from the recent review
  cycle (so the agent has the shape).
- **Point at the merged diff scope** (PR number / branch).
- **Point at existing followups** so the agent doesn't re-discover
  already-captured findings.
- **Set scope guardrails**: don't fix, don't review code outside
  the diff, findings must fit a focused subsequent PR.
- **Apply lenses for**: existing-followup siblings, asymmetric-by-
  design vs by-accident, convention drift across touched files,
  surface-introducing changes, test fixture pattern.

## Adapter notes

The lens is applied through code reading, not tooling. No special
harness mechanism required.
