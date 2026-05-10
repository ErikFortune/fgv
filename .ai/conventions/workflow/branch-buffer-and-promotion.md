# Convention — `convention.workflow.branch-buffer-and-promotion`

> Source: distilled from `<repo>/.ai/instructions/ORCHESTRATOR_ROLE.md
> § Buffer-and-main model` in the source corpus.

A branch-topology pattern for separating in-flight agent work from
canonical release state. Deliberately abstract — branch topology is
team / project convention and the orchestrator workflow family
works against several topologies. This convention names the pattern
the source corpus used and gestures at alternatives without
prescribing.

---

## The pattern

A two-line branch model:

```
agent feature branches  ─PR─▶  buffer line  ─promote─▶  canonical line
                ←──base from────                    ←──base periodic──
```

- **Canonical line** — main / release. Always coherent, always
  green, never receives agent merges directly. Promoted to
  explicitly via orchestrator-driven operations.
- **Buffer line** — agent feature branches PR into here; iterative
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

Invoked at clean stream-close moments after the buffer has
accumulated a coherent batch of merged PRs:

1. Confirm the buffer is in known-good state — all in-flight
   followups closed or explicitly deferred; no in-progress PRs
   blocking; baseline doc reflects the buffer's current state.
2. Open a PR `<buffer> → <canonical>`. The PR's diff is whatever
   has accumulated on the buffer since the last promotion.
3. **Run one explicit automated-review pass on the unified buffer
   state.** Even though each constituent PR was reviewed
   individually when it landed, the unified diff can surface
   **fix-interaction findings** — fixes that held in isolation but
   interact when combined. Address those before merging.
4. Merge with **merge-commit** method (preserves the constituent
   PRs' history; squash would collapse the audit trail; rebase
   would rewrite SHAs that other docs reference).
5. Bump the pinned baseline file to capture the new canonical head.
   The buffer continues to advance from the same point.

Promotion frequency: at natural stream-close moments. Don't promote
on every PR (defeats the buffer); don't let the buffer drift
indefinitely (loses the "canonical is current canonical" property).

## Why the promotion needs its own review pass

The per-PR automated reviews catch within-PR issues. **Cross-PR
fix-interactions only surface when the combined state is reviewed
together.** Per the source corpus's review-cycle data, fix-
interactions are uncommon but real. Catching them at promotion is
cheaper than discovering them in production. The cost of the
promotion review pass is one automated pass on the unified PR;
orchestrator triage of its findings is the real cost — typically
modest.

## Alternatives the orchestrator workflow family is compatible with

This convention is **deliberately abstract** because branch topology
varies by team. Other compatible topologies:

- **Trunk-based with feature flags.** Single main line; agent work
  ships behind flags. The buffer's role is filled by flag state,
  not branch state. The orchestrator workflow's coordination
  through the streams ledger still applies; only the merge
  mechanics differ.
- **Release-branch model.** Canonical line is `release`; the buffer
  is `develop` or `next`. Promotion is a release event rather than
  a continuous operation.
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

The source corpus uses `exploration-1` as the buffer line name —
vestigial from an era when there were multiple parallel
explorations. The role (buffer) is what matters; the name is
semantic-by-convention. Other projects may prefer `develop`,
`next`, `staging`, or `buffer` — same semantics.

## Anti-patterns

- **Direct agent merges to the canonical line.** Defeats the
  buffer's purpose.
- **Promotion without an automated-review pass.** Skips the
  fix-interaction catch.
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
