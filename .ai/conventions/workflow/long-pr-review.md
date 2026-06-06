# Convention — `convention.workflow.long-pr-review`

> Source: distilled from `<repo>/.ai/instructions/ORCHESTRATOR_ROLE.md
> § Babysitting a long PR review cycle` in the source corpus.

The rhythm and intervention points for substantial PRs that go
through repeated rounds of automated review (Copilot, Cursor, etc.).
Watch the trajectory of substantive findings, not just thread volume,
and switch to followup-capture mode at a threshold rather than
iterating findings indefinitely.

---

## Reading the trajectory

Three signals beyond raw volume help read whether a review cycle is
converging or "still discovering":

### Fix-interaction shape

Consecutive rounds find findings whose fixes interact (round 7's X
plus round 8's Y produces a hole in round 9). Stronger
"architecture still discovering" signal than volume alone.

### Asymmetric-by-design awareness in the agent's resolutions

The agent declining to apply a pattern when field semantics demand
otherwise (e.g., NOT trimming a value where the field's contract
permits whitespace). Positive signal: the agent's scaffolding is
intact; "keep going" is the right call.

### Convention-drift recurrence under iteration load

Earlier-swept conventions reappearing in late rounds (e.g., a
test-naming convention that was clean at round 1 reappearing at
round 9). The convention isn't reflexive yet; the right response is
reinforcing the brief's exit-checklist, not piling more sweeps on
the agent.

## The threshold (≈10 rounds)

When a review cycle exceeds ~10 rounds with consistent substantive
volume across rounds, switch the implementing agent from inline-fix
mode to **document-for-followup mode**. The motivating insight: each
fix opens new surface area whose siblings need their own sweep.
Iterating findings round-by-round doesn't converge; capturing them
as followups + doing a single sibling-sweep pass post-merge is more
efficient.

## What still gets inline fixes after the threshold

Only **truly critical** findings:

- **Production-blocking** — the feature doesn't work against the
  real server (e.g., wrong actor-id format the production validator
  rejects but the test fixture accepts).
- **Data-corruption** — a bad write or a wrong precondition that
  would produce inconsistent state.
- **Security** — credential leak, missing auth check, exposed
  secret.
- **Recovery-path-broken** — the user can be permanently stranded
  with no way back to a workable state.

Everything else gets recorded in the stream's followups inbox with
`file:line`, finding shape, fix shape, deferral rationale.

## The implementing agent's role after the threshold

The implementing agent posts thread replies acknowledging each
deferred finding and pointing at the consolidated followups so the
review threads don't look ignored. Wording is up to the agent;
goal is closing thread context without inline iteration.

## The fresh-agent post-merge sibling-sweep

After merge, the structured sibling-sweep self-review is done by a
**fresh agent**, not the implementing agent. Two reasons:

1. The implementing agent had every opportunity across the review
   cycle and didn't catch the misses. Running self-review
   reproduces the same author-blind-spot.
2. A fresh agent reads the diff with no commitment bias and the
   lens explicit. They catch the asymmetric-by-accident divergences
   the implementing agent normalized to during implementation.

Findings → followups → subsequent focused PRs.

The fresh-agent prompt should:

- Define the sibling-sweep lens with concrete examples from the
  recent review cycle (loads the shape).
- Point at the merged diff scope.
- Point at existing followups so the agent doesn't re-discover
  already-captured findings.
- Set scope guardrails: don't fix, don't review code outside the
  diff, findings must fit a focused subsequent PR.
- Apply lenses for: existing-followup siblings, asymmetric-by-design
  vs by-accident, convention drift across touched files,
  surface-introducing changes, test fixture pattern.

## Why the rule exists

Pattern observed in the source corpus: a 19-round PR review cycle
where substantive-finding volume held at ~3-5 per round across
rounds 13-18 because each new fix opened new sibling surfaces. The
implementing agent landed every fix structurally well but didn't
proactively sweep siblings. Capturing followups + fresh-agent
sibling-sweep pass is the structural fix to that pattern.

## The rule is on the orchestrator, not the implementing agent

The implementing agent shouldn't decide to abandon inline iteration;
that's an orchestrator-level decision based on cycle trajectory. The
implementing agent's role is to consume the orchestrator's guidance
and execute it — including documenting followups and posting thread
replies cleanly.

## Anti-patterns

- **Inline-fix every finding through 20 review rounds.** Diminishing
  returns; switch to followup-capture mode after the threshold.
- **Posting thread replies without addressing the finding.** Either
  fix it or capture it in followups with a clear deferral
  rationale; don't acknowledge-and-ignore.
- **Implementing agent self-decides to stop inline-fixing.** The
  threshold decision is orchestrator-level.
- **Fresh-agent sibling-sweep skipped post-merge.** Author-blind-
  spot-recovery is the value; skipping it forfeits it.
- **Treating the threshold as exact (10.0 rounds).** It's
  approximate — the trajectory signals (fix-interaction,
  convention-drift recurrence) matter as much as the count.

## Adapter notes

Realization in source corpus uses GitHub PR review threads with
Copilot as the automated reviewer. Other harnesses with iterative
automated review (Cursor, code-review GPT actions) compose the
same way. The convention is review-rhythm-specific, not
harness-specific.
