# Baseline

Pins the **last `release` → `main` promotion** — i.e. the last
published lockstep version. Bumped by the orchestrator only when
a promotion lands, not when a new stream starts.

## What it's for

- **Recovery referent.** "Last known shipped state" if we need to
  reason about what's actually in the wild vs. what's accumulated
  on `release`.
- **Blast-radius sizing.** When scoping a stream, the delta between
  this commit and current `release` HEAD is the unreleased surface
  the stream sits on top of. A bigger delta means more interaction
  risk.

## What it's NOT for

- Not a stream-start gate. Streams branch from current `release`
  HEAD; collision avoidance with parallel streams is by package
  surface and out-of-scope declarations in the stream entry, not
  by shared base commit.
- Not a wave base. There are no waves — work is reactive,
  consumer-driven, and feature-shaped.

## When to bump

On every `release` → `main` promotion. Update both the commit sha
and the date; include the lockstep version that promotion published
(or "not yet published" if the promotion preceded the next publish
event).

---

**Current baseline**: `ffde48ad` — 2026-05-10 — orchestrator
workflow infrastructure installed (provisional pin; pre-dates the
first real `release` → `main` promotion under this substrate).

To bump:
```
git log --oneline -1 release   # get the commit sha after the promotion merge
# then update the line above:
# **Current baseline**: <sha> — <YYYY-MM-DD> — <lockstep version or context>
```
