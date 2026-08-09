# Workstream Brief: `publish-tarball-gate` — verify the tarball, not the working tree

## Mission

Every path named in a published package's `exports` map must exist **in the tarball that actually
ships**, and load under its declared condition. This is a consumer's explicit ask, and it closes a
class we have now hit three times in one week.

## Status entering

PersonAIlity filed it directly:

> a publish-time check that every path named in an exports map exists in the tarball and loads
> under its declared condition. That would have caught both, and the 5.1.0-27 build-less publish as
> well.

**Three instances of the class, all real, all shipped:**

| Instance | What shipped | Caught by |
|---|---|---|
| `@fgv/ts-utils` `import` → unloadable ESM emit | condition resolved to a file Node cannot load | consumer |
| `@fgv/ts-web-extras-webauthn` `default` → `lib/index.browser.js` | condition resolved to a file **that has never existed** | us, by accident |
| **`@fgv` 5.1.0-27 shipped only `src/`** | **no build output in the tarball at all** | consumer, worked around silently |

**What already exists** (`common/scripts/verify-esm-entrypoints.mjs`, on `release` via #603): loads
the Node entry, and checks that every path named anywhere in an `exports` map exists — under every
condition, not just the one Node resolves. That second part was added specifically for the webauthn
shape, after a neutralization test showed the first version stayed green when the fix was reverted.

**Its limit, and the reason this stream exists:** it checks the **working tree**. In the 5.1.0-27
case `lib/` existed locally and simply never entered the tarball. Nothing we have looks at what npm
would actually pack, so the worst of the three instances remains entirely ungated.

## Measured before you start — do not re-derive this

- **`npm pack --dry-run --json` per package costs ~12.8 s.** Across 25 packages that is **~5.3
  minutes**, measured on this container. CI runs have recently been cancelled around 15 minutes, so
  shelling out to `npm pack` 25 times per PR is **not viable as-is**. Design around this rather than
  discovering it in CI.
- **No `@fgv` package declares a `files` field.** All 25 rely on npm defaults plus any `.npmignore`.
  That is the mechanism by which a publish can ship `src/` and no `lib/`.
- `npm pack --dry-run --json` on `ts-web-extras-webauthn` today reports `lib/index.js` → 2 files,
  `lib/index.browser.js` → **0 files**, reproducing the consumer's tarball reading exactly. Use that
  as your fixture.

## In-scope paths (you may modify)

- `common/scripts/verify-esm-entrypoints.mjs` — extend or supersede its existence pass
- `common/scripts/verify-tarball-exports.mjs` — **new**, if a separate script is the right shape
- `.github/workflows/ci.yml` and/or the publish workflow — placement is OQ-1
- `common/autoinstallers/**` — if a dependency is needed, scope it to an autoinstaller the way
  `rush-bundler-check` does; **do not touch the shared shrinkwrap**
- `common/changes/**`
- `docs/WORKSTREAMS.md` (this stream's entry), `docs/TECH_DEBT.md` / `docs/FUTURE.md`
- `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-esm-entry-points.md` — tell the consumer
  when their ask is actually closed

## Out-of-scope paths (you must NOT modify)

- Any `libraries/*` source or `exports` block. **This stream builds a detector, not fixes.** If the
  gate finds a package that would ship broken, that is a **finding**, and a genuinely good outcome —
  file it, do not fix it here.
- `rigs/**` — the ESM emit's specifiers are a different stream's problem
- `libraries/ts-bcp47/src/**`, `common/scripts/verify-bundler-resolution.mjs` — owned by
  `esm-emit-impl`

## Required reading (load before writing code)

- `common/scripts/verify-esm-entrypoints.mjs` — especially its header and the `BUNDLER_ONLY`
  comment. Its declaration-over-silent-skip posture is the one to mirror; do not invent a new one.
- `common/scripts/verify-bundler-resolution.mjs` — the sibling gate, and the autoinstaller pattern
  it uses to add a dependency without touching the shrinkwrap
- `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-esm-entry-points.md` — the addendum
  states what we promised and, importantly, what we told them the current gate does **not** cover
- `.ai/instructions/MONOREPO_GUIDE.md` — Rush publish flow

## Missing-input rule (non-negotiable)

If any required-reading file doesn't exist or you can't access it: **STOP** and surface the gap. Do
not recreate it from codebase exploration or improvise.

## Dependencies

**HARD — do not start until both have landed on `release`, then rebase this branch onto it:**
- **#603** (`fix/esm-node-entry-points`) — the existence pass you are extending
- **#605** (`esm-emit-impl`) — the sibling gate and the autoinstaller pattern

This branch is based on `esm-emit-impl` so it already sees both, but it must be rebased once they
merge. **If you find yourself resolving conflicts in `verify-esm-entrypoints.mjs`, stop and
escalate** — that means the base moved in a way this brief did not anticipate.

## Deliverables

1. **Decide the instrument, and justify it by measurement.** `npm pack --dry-run` is correct but
   costs ~12.8 s/package. **Strong recommendation: use `npm-packlist` — the library npm itself uses
   to compute the pack file list.** It gives the same answer without spawning npm per package, which
   is the difference between a viable gate and a 5-minute one. Reimplementing npm's ignore rules by
   hand is the wrong answer and would drift from real behavior, defeating the point.
2. **The check itself.** For each published package: compute the file list npm would pack, and
   assert every `exports` target appears in it — every condition, every subpath. Report the
   condition path in the failure, as the existing gate does.
3. **Reconcile with the existing existence pass.** It checks the same property against the working
   tree. Once this exists, the tree check is strictly weaker. **Recommended: supersede it**, so
   there is one owner of "every condition names a real file" rather than two that can disagree.
4. **Placement (OQ-1).** See below.
5. **Prove it by neutralization.** Reverting the webauthn fix must fail this gate. Additionally,
   simulate the 5.1.0-27 shape — a package whose `lib/` is excluded from the pack — and show it
   fails. **A gate that catches only the instance we already fixed has not demonstrated the class.**
6. **Docs, in this PR.** Ledger entry, and update the consumer note to say their ask is closed —
   naming what it now covers that the previous gate did not.

## Acceptance criteria

- [ ] The gate computes the **packed** file list, not the working tree
- [ ] Neutralizing the webauthn fix fails it — demonstrated
- [ ] A simulated build-less pack (the 5.1.0-27 shape) fails it — demonstrated
- [ ] Runtime measured and reported; if it stays in per-PR CI, the cost is stated explicitly
- [ ] No `libraries/*` source or `exports` changed (findings filed instead)
- [ ] Any new dependency lives in an autoinstaller; shared shrinkwrap untouched
- [ ] `rush build` / `rush test` green; `rush change --verify` green
- [ ] `code-reviewer` on the final diff **before** any coverage work
- [ ] Copilot loop driven by the implementer

## Open questions

- **OQ-1 — per-PR CI, publish-time, or both?** The consumer asked for **publish-time**, and that is
  where the 5.1.0-27 failure actually occurred. Per-PR is faster feedback but pays the cost on every
  PR. **Recommended:** publish-time as the hard gate (it is the one that must never be bypassed),
  plus per-PR **if** deliverable 1 gets the cost low enough to be unnoticeable. If it does not, ship
  publish-time only and say so — a slow gate that gets disabled protects nothing.
- **OQ-2 — what about packages that legitimately ship no build output?** If any exist, they declare
  themselves in the `BUNDLER_ONLY` style. Do not add a silent skip.
- **OQ-3 — should the gate also *load* each packed entry**, not merely confirm it exists? The
  consumer's ask says "exists in the tarball **and loads** under its declared condition." Existence
  is the cheap half and catches all three known instances. Loading from an extracted tarball is
  stronger and more expensive. **Recommended:** existence first, and record loading as a follow-up
  with the reasoning — but say plainly in the consumer note which half shipped, since they asked for
  both.

## Findings-inbox convention

`.ai/tasks/active/publish-tarball-gate/findings/inbox/<timestamp>-<slug>.md`, one per file. Every
package this gate flags belongs here — this stream detects, it does not fix.

## Required exit artifact

`.ai/tasks/active/publish-tarball-gate/result.md`: branch; summary; the instrument chosen and its
**measured** cost versus `npm pack`; the two neutralization demonstrations; the full list of
packages flagged; where the gate was placed and why; open questions; deviations from this brief.

## Resume protocol

Re-read this brief, read `.ai/tasks/active/publish-tarball-gate/state.md`, confirm scope.

## Why this one matters more than its size suggests

Three defects in one week, all the same class: **a published `exports` condition promising something
the tarball cannot deliver, with types resolving correctly so nothing fails until runtime or bundle
time.** Two were found by a consumer; one of those they silently worked around, so we would never
have learned it. The consumer's own framing is the right one — the useful fix is not any individual
entry but the check that makes the class impossible to ship.
