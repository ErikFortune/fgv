# Convention — `convention.workflow.stale-marker-scan`

> Source: distilled from `<repo>/.ai/instructions/ORCHESTRATOR_ROLE.md
> § Post-merge bookkeeping` in the source corpus.

A post-merge orchestrator pass that scans the streams ledger for
stale status markers on dependency-referenced streams that have
shipped since the last sweep. Runs as part of post-merge bookkeeping.

---

## What the scan catches

When a stream merges, the orchestrator flips its status marker from
"in flight" (e.g. 🔵) to "shipped" (e.g. ✅) in the streams ledger.
The scan extends this: **also walk the ledger for related streams
whose status markers may have rotted silently.**

Specific failure mode: a stream that "trails by a beat" in the
sequencing summary stays marked 🟡 (planned) even after its hard
dependency shipped. A fresh agent picking up a mid-stream task can
misread the stale 🟡 as "open work to grab," derailing their pickup.

The source corpus had a concrete instance — a stream that should
have been 🔵 stayed 🟡 from one date to another and tripped a
mid-stream pickup; caught only by manual orchestrator review.

## The scan

The orchestrator runs the scan as part of post-merge bookkeeping:

1. **Identify just-merged streams.** What status flipped in this
   bookkeeping pass.
2. **For each merged stream's dependency references**, walk the
   streams ledger and find the entries that mention them as
   dependencies.
3. **For each dependency-referenced entry**: does its status marker
   reflect current reality?
   - Was it 🟡 (planned) but actually now eligible to start (or
     in-flight)?
   - Was it 🔴 (blocked) but the blocker just shipped?
   - Is its sequencing-summary position still accurate?
4. **Flip stale markers** to current state.

## Anti-patterns

- **Skipping the scan after a "small" merge.** Markers can rot at
  any merge. Run the scan as part of every post-merge bookkeeping
  pass.
- **Flipping markers but not updating the sequencing summary.**
  The summary is its own surface and rots independently.
- **Trusting "I just looked at the ledger yesterday" as proof of
  freshness.** Yesterday's state plus today's merges produce
  today's stale markers; the scan is what catches the drift.

## Why this is its own convention

Earlier orchestrator workflow versions treated the stale-marker scan
as folklore — "you'll notice if a marker is wrong." Empirically,
the orchestrator missed a stale marker for two days; a parallel
agent picked up work against the stale signal. Naming the scan as
an explicit step in post-merge bookkeeping turned it into a reliable
gate.

## Adapter notes

The scan is applied through reading the streams-ledger doc — no
special harness mechanism required.
