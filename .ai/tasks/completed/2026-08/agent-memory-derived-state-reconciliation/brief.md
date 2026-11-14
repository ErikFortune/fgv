# Stream brief — `agent-memory-derived-state-reconciliation`

**Status: QUEUED 🟢 — design-first.** Filed 2026-08-15. `@fgv/ts-agent-memory` +
`@fgv/ts-agent-memory-sqlite-vec`. **Breaking on two contracts.**

## The problem in one sentence

`FileTreeMemoryStore` derives three artifacts from its records, and answers *"is this consistent?"*
and *"how do I fix it?"* differently — or not at all — for each of them.

## The matrix, which is the whole argument

| derived artifact | coverage query | repair |
|---|---|---|
| `rank` (from `RankProjector`) | **none** | `reconcileRank(kind)` — targeted, non-destructive, careful |
| record vectors (`IVectorIndex`) | `size` — a **scalar**: no kinds, no denominator | `rebuild(source, embed)` — **destructive**: resets and re-embeds the whole vault |
| fragment vectors (`IFragmentVectorIndex`) | **none** | **not on the contract at all** — `addFragments`/`remove`/`query` only; the concrete in-memory class has `rebuild`, `SqliteVecFragmentIndex` has nothing |

Read across the rows: no two agree on anything. `rank` has the repair shape we want and no coverage.
Record vectors have a coverage scalar that cannot answer the question and a repair that destroys the
thing it is meant to fix. Fragment vectors have neither, which is **E4 — the defect fixed for the
record lane in `-48` — still open on that lane, and worse there**, because `SqliteVecFragmentIndex`
has no `rebuild` to promote.

**This is one missing abstraction showing as holes in a pattern**, not three unrelated gaps. That is
why it is a stream and not three patches.

## Mission

Every artifact the store derives from its records gets **a coverage query and a targeted repair**,
in one consistent shape, such that an application can answer *is my derived state consistent with my
records* and *fix it without destroying it*.

## How this stream came to be scoped this way — do not lose it

It was filed as `agent-memory-index-coverage-accessor`: a consumer's ask, taken as the unit of work.
Rescoping it to the capability is what surfaced the matrix, the fragment lane's unfixed E4, and the
`reconcileRank`-is-the-shape-not-a-precedent reading. See `CODING_STANDARDS.md` § "We Build General
Capabilities" — **applying that frame made this bigger, not smaller**, and the narrow version would
have shipped looking fine.

The driving consumer's own note of 2026-08-11 asked for exactly this generalization — *"a general
'reconcile derived state for kind K' seam […] answers both, and answering both together is cheaper
than answering either alone"* — and we shipped `reconcileRank` alone in `-49`. It is filed here as
the design because it is right on the merits, not because they asked twice.

## Deliverable 1 — the design doc, before any code

`.ai/tasks/active/agent-memory-derived-state-reconciliation/design.md`. It must settle:

**a. The shape of the two operations.** One method with an artifact discriminator, per-artifact
methods, or an asymmetry — and if asymmetric, what justifies it. Name the alternatives and pick.

**b. What coverage costs, and what it is allowed to cost.** Coverage must not need bodies: every
input is an envelope field or an index-side count. If a proposed coverage query reads files, it is
the wrong design — `listEntries()` exists and is free.

**c. What "targeted" means for repair, mechanically.** `rebuild` resets and re-embeds everything;
the point of this stream is that repair touches only what is missing. Say how repair *knows* what is
missing, and say what happens when the store's belief (`embeddingRef`) and the index disagree.

**d. The report type, and whether one shape serves all three artifacts.** The rule on
`IVectorRebuildReport`'s docstring applies verbatim — every count resolved by `Kind` — but the
fragment lane's natural unit is fragments-per-record, which neither a record count nor `indexed`
answers.

**e. What happens to `reconcileRank`.** It exists, it ships, its signature is
`Promise<Result<number>>`, and it will not match whatever this stream lands. Pre-1.0 with a no-shim
posture means breaking it is allowed; say so explicitly rather than leaving it as the one
inconsistent survivor.

**f. Absent vs. zero.** A kind with no rank projector, or a lane that is not wired, must not report
`0%` — that is the `embeddingRef`-is-three-ways-ambiguous defect again. Say how the report
distinguishes *not applicable* from *nothing covered*.

## Deliverable 2 — the implementation, in phases

Breaking on `IVectorIndex`, `IFragmentVectorIndex`, `IMemoryStore`, and both persistent index
implementations. Phase it; each phase is a feature branch off the integration branch.

## Explicitly NOT in scope

- **Automatic repair.** Nothing here runs a reconcile on its own. Every operation is caller-invoked.
- **A scheduler, a background worker, or a watch.** If a deployment wants periodic reconciliation
  that is its concern; the library provides the operation.
- **Changing embed-on-write's best-effort posture.** A vault record is the source of truth and a
  vector is derived; an embedder outage must not start rejecting writes. That stays.
- **Persisting coverage.** A derived count that can disagree with its source is a second source of
  truth.

## Gates

- [ ] Design doc settles (a)–(f) before implementation starts
- [ ] `rushx build` / `rushx lint` / `rushx test` green, 100% coverage, **both packages**
- [ ] Repo-wide `rush rebuild` — breaking on shared contracts, and `samples/testbed` has broken on
      the last **three** consecutive streams against these exact seams
- [ ] Change files for both packages; `rush change --verify --target-branch origin/release`
- [ ] `LIBRARY_CAPABILITIES.md` updated in the same PR
- [ ] `docs/FUTURE.md`'s `IFragmentVectorIndex` entry resolved or explicitly re-scoped
- [ ] `code-reviewer` on the final diff before first push
- [ ] Cross-repo note before the alpha carrying it goes out
