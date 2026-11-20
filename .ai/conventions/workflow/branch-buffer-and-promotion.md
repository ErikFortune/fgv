# Convention — `convention.workflow.branch-buffer-and-promotion`

> Source: distilled from `<repo>/.ai/instructions/ORCHESTRATOR_ROLE.md
> § Buffer-and-main model` in the source corpus.

A branch-topology pattern for separating in-flight agent work from
released state. The pattern itself is abstract — branch topology is
team / project convention and the orchestrator workflow family
works against several topologies. **This repo's concrete form** is
spelled out first, below; the abstract pattern and its alternatives
follow.

---

## In this repo: trunk `main`, trains `release/<major>`

Since the 5.1.0 publish (2026-11-20) fgv runs the model in
`.ai/notes/orchestrator/branch-migration-checklist.md`:

```
agent feature branches ─PR─▶ main ──promote (PR, merge commit)──▶ release/<major> ──▶ publish/<version> ──npm──▶ stable
integration/<x> (off main) ─PR─▶ main          │                         │
                                               │                         └─merge back (merge commit)─▶ release/<major> ─▶ main
main ──sync──▶ prerelease ──npm──▶ alpha
```

| branch | role in the pattern |
|---|---|
| `main` | **The buffer, and the trunk.** Every feature PR and every integration branch targets it; streams branch from its HEAD; CI's push gate runs on it. Never published from. |
| `release/<major>` | **The canonical line** for one live major (`release/5`, …). Always equals what is on npm for that major, plus anything promoted and awaiting publish. Takes only promotions from `main` and merges of a `publish/*` child — CI's `release-source` check refuses any other head. |
| `publish/<version>` | Short-lived child of the train, cut at its tip; the stable publish runs on it and it merges back into the train. |
| `prerelease` | Synced from `main`; alphas for the next minor publish from it. |
| `integration/<x>` | Multi-PR stream branches, **based on `main`**, landing on `main` as one. |

**The promotion is the PR `main` → `release/<major>`**, gated as
described under *The promotion gate* below. The publish itself is
the one-dispatch flow in the checklist; after it, `release/<major>`
merges back into `main` so the trunk drops the consumed change files
and its version policy names the version just published.

The old single `release` branch (the buffer of the pre-5.1.0 model,
with `main` as the canonical line) is deleted. Older docs that say
"branch from / PR to `release`" mean `main` today.

---

---

## The pattern

A two-line branch model:

```
agent feature branches  ─PR─▶  buffer line  ─promote─▶  canonical line
                ←──base from────                    ←──base periodic──
```

- **Canonical line** — here `release/<major>`. Always coherent,
  always green, never receives agent merges directly. Promoted to
  explicitly via orchestrator-driven operations.
- **Buffer line** — here `main`. Agent feature branches PR into here; iterative
  review cycles play out here; followups land here. Slips and
  in-flight churn are absorbed here, not on the canonical line.
- **Agent feature branches** — base off the buffer's latest. Open
  PRs against the buffer. Each PR gets its own automated review at
  PR time.

## Why two lines

The buffer absorbs the cost of in-flight work (failed approaches,
mid-cycle rework, agent slips like a deep-reviewer-merge that
landed unfixed code). Without a buffer, every agent operation can
directly affect the canonical line's state; with one, the canonical
line only advances via deliberate orchestrator-gated promotions.

## The promotion gate

Invoked as a release event, not a routine operation. In this repo
the promotion delta is typically large (months of accumulated
feature work) — too large for meaningful code review, and each
constituent PR was reviewed on its way into the buffer. The
gate is therefore **test / docs / sibling-sweep**, not unified
code review:

1. Confirm the buffer is in known-good state — all in-flight
   followups closed or explicitly deferred; no in-progress PRs
   blocking.
2. Confirm CI green: tests pass, coverage gates met, lint clean
   on the buffer's current HEAD.
3. Confirm generated docs are caught up (api-extractor output and
   doc-update PRs reflect the current buffer state).
4. **Run a sibling-sweep as a fresh agent** against the unified
   buffer delta. The per-PR reviews catch within-PR issues; the
   sibling-sweep catches **fix-interaction findings** — fixes
   that held in isolation but interact when combined — plus
   cross-stream inconsistencies (drifted conventions, duplicated
   primitives, naming clashes). See
   `.ai/conventions/workflow/sibling-sweep-lens.md`.
   - Critical findings (production-blocking, data-corruption,
     security, recovery-path-broken) get inline fixes before merge.
   - Everything else routes to followups — TECH_DEBT, FUTURE, or
     the next chore batch.
5. Open a PR `<buffer> → <canonical>` — here `main` →
   `release/<major>`. Merge with **merge-commit**
   method (preserves the constituent PRs' history; squash would
   collapse the audit trail; rebase would rewrite SHAs that other
   docs reference).
6. Publish from a `publish/<version>` child of the train, merge it
   back into the train and the train back into `main`, then bump the
   pinned baseline file (`.ai/BASELINE.md`) to the published commit
   and version.

Promotion frequency in this repo is **release-event-driven, not
continuous** — production publish only when stability-via-
consumption is established (at least one consumer has applied
recent features end-to-end). Alpha publishes from `prerelease`
(synced from `main`) happen independently and don't gate or require
promotion.

## Why the sibling-sweep, not a unified code review

In smaller-delta topologies, a unified automated code-review pass
at promotion catches fix-interactions cheaply. In this repo the
delta is too large for that to produce useful signal — re-reviewing
months of already-reviewed code costs a lot and finds little.
The sibling-sweep is a different lens: it looks across PRs for
cross-stream interaction, convention drift, and primitive
duplication, which **is** the class of issue per-PR review can't
catch. Net: cheaper than a full re-review, catches the things
that actually escape per-PR review.

## Alternatives the orchestrator workflow family is compatible with

This convention is **deliberately abstract** because branch topology
varies by team. Other compatible topologies:

- **Trunk-based with feature flags.** Single main line; agent work
  ships behind flags. The buffer's role is filled by flag state,
  not branch state. The orchestrator workflow's coordination
  through the streams ledger still applies; only the merge
  mechanics differ.
- **Release-branch model.** Canonical line is a release branch; the
  buffer is `main`, `develop` or `next`. Promotion is a release event
  rather than a continuous operation. This is fgv's model, with one
  release branch per live major (see the top of this file).
- **Single-branch with rebase discipline.** Small projects often
  skip the buffer entirely; agent branches PR directly into main.
  The orchestrator workflow runs without modification; the
  fix-interaction risk is absorbed by the team rather than gated.

The right topology depends on team size, release cadence, and
risk tolerance. The orchestrator workflow doesn't prescribe.

## What is project-agnostic

Regardless of topology:

- **Stream coordination through the streams ledger** is essential.
- **File-boundary stake-out per stream** prevents collisions
  regardless of branch topology.
- **The pinned baseline** (whatever it points at) anchors the
  "branches must descend from this" rule.
- **Pre-merge artifact migration** is a per-PR property,
  independent of how the PR is merged or where to.

## Naming gotchas

fgv's buffer is `main` and its canonical lines are
`release/<major>`; before 5.1.0 the buffer was `release` and the
canonical line `main` — read older docs with that swap in mind.
The source corpus uses `exploration-1` as the buffer line name —
vestigial from an era when there were multiple parallel
explorations. The role (buffer) is what matters; the name is
semantic-by-convention. Other projects may prefer `develop`,
`next`, `staging`, or `buffer` — same semantics.

## Anti-patterns

- **Direct agent merges to the canonical line.** Defeats the
  buffer's purpose.
- **Promotion without a sibling-sweep.** Skips the fix-interaction
  and cross-stream-drift catch.
- **Squash-merge at promotion.** Collapses the audit trail of
  constituent PRs.
- **Promotion on every PR.** Buffer becomes a passthrough; loses
  the absorbing property.
- **Buffer drift > a quarter without promotion.** Canonical line
  no longer represents current state; downstream consumers can't
  rely on it.

## Adapter notes

Branch operations are git-mechanical; no special harness mechanism.
The convention applies to any project with a hosted-git equivalent
(GitHub, GitLab, Gitea, etc.).
