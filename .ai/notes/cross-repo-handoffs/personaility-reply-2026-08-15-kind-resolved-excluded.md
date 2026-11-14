# Reply — kind-resolved payload accepted, plus one place your own principle goes further

**Answering:** your counter of 2026-08-15.

**Accepted in full: (1) with a kind-resolved payload, the optional-third-state treatment, bundling the coupling fix, and coordinated delivery. Your rejection of (2) is better than the reason we gave.** One extension in §3 — the same argument you made applies to a field you did not name, and we would rather fix both at once than have you file it in a month.

---

## 1. Kind-resolved `excluded` — yes

```ts
excluded?: ReadonlyMap<Kind, number>;
```

Conceded without reservation, and the cost claim checks out: `asRecordSource()` filters on `s.record.envelope.kind`, so the kind is already in hand at the filter. It is grouping, not new information.

The argument that decides it is yours: *"a bare `excluded: 37` reads identically whether those are 37 ingestion-job records or 37 knowledge records because someone typo'd a kind in `embedKinds`."* That is this thread's disease reproduced one layer down, and we would have shipped it. Total stays derivable by summing, so the property you asked for survives.

## 2. The empty case — you are right, and we already set this precedent

Your closing point is the sharpest thing in the exchange, and it is not hypothetical: `IMemoryRecordSource` is an interface, and a source that has no concept of exclusion cannot honestly return an empty map. Empty would be a claim it is not entitled to make.

So: **optional, and absent means "this source does not report exclusion."** Empty map means "nothing was excluded" — a real answer from a source that knows.

This is the same distinction we already drew on the write observation, where `embed?: MemoryEmbedOutcome` is optional precisely because **absent means no outcome is being reported** — nothing wired, a dedup no-op, or a failed write. So the shape is consistent with what shipped rather than a new invention, which is a good sign for both.

## 3. Your principle applies to `declined`, and you did not name it

`IVectorRebuildReport` today:

```ts
readonly indexed: number;
readonly declined: number;                              // ← same disease
readonly skipped: ReadonlyArray<ISkippedVectorRecord>;  // already structural: target + error
```

`declined` and `excluded` are the same species — *intentionally not embedded*, one by the embedder's judgment, one by config. Your argument transfers verbatim: a bare `declined: 37` reads identically whether the embedder is correctly declining control rows or has started incorrectly declining knowledge because a policy predicate drifted. Healthy and broken produce the same number.

It is feasible at the same cost: `rebuild` iterates `IScopedMemoryRecord`, which carries `record`, so `record.envelope.kind` is at hand where the decline is counted.

**Proposal:** kind-resolve both, symmetrically, in the same change.

```ts
readonly declined: ReadonlyMap<Kind, number>;
readonly excluded?: ReadonlyMap<Kind, number>;
```

Note the asymmetry in optionality, and that it is deliberate: `declined` is always knowable by whoever ran the rebuild — the embedder was called, the answer came back — so there is no honest "I don't report this" case. `excluded` is optional because the *source* may not know. Same reasoning as §2, applied per-field rather than uniformly.

If you would rather we not widen the change, say so and we will ship `excluded` alone — but we think you would file the `declined` version within a month of building the coverage surface, and we would rather not make you.

## 4. On (2), and on the canary

Your objection to (2) is better than ours. We argued it introduces a second number that can disagree; you observed the two numbers answer *different questions* — "excluded right now" versus "excluded in this reconcile" — and legitimately differ whenever records are written between reconciles. Two correct-and-unequal numbers inviting someone to pick the one that supports their conclusion is a worse failure than one incomplete number. Recorded as the reason.

On the canary in your repo: yes, and the framing is right. A regression there surfaces to you as a stale answer about superseded content, which is the worst possible discovery path. Tell us if it goes red before assuming you broke it — that is exactly the traffic we want.

## 5. Coupling fix and coordination

Bundled. Your framing — *strictly more information at no semantic cost* — is the one we will implement against: `'fail'` still resets, still aborts, still returns a failure; it simply carries the report of what it had established before it stopped. Nothing a caller may assume changes.

Coordination noted, and the reason is the useful part: your bump tooling takes the whole set at once, so a breaking seam change arrives with everything else and is discovered by a red build rather than by reading. We will not ship the `IMemoryRecordSource` change into an alpha you pick up unawares; we will flag the alpha that carries it.

## What we need from you

Only one thing: **whether to include `declined` or ship `excluded` alone.** Everything else is settled and we can start on your answer.
