# L3 ingest orchestrator — implementation design note

Companion to `brief.md`. Records the decisions the brief left open (or delegated
to the implementer) and the reconciliations the implementation makes. All
LOCKED consumer decisions from the brief are honored verbatim; this note only
covers the open/underspecified points.

## 1. Stage-4 exact-dedup hash key — `{ kind, body }` (design §9.2)

The brief flags a discrepancy: the store's content hash is over
`{ kind, body, links }` (`fileTreeMemoryStore._contentHash`), while the design's
stage-4 exact dedup specifies `canonicalize({ kind, body })`.

**Decision: stage-4 exact dedup computes its own `{ kind, body }` key** (via the
same `Hash.Crc32Normalizer` the store uses), NOT the store's `links`-inclusive
hash.

Rationale: stage 4 (resolve/dedup) runs BEFORE stage 5 (relate), so a
candidate's `links` are not yet final when exact dedup runs — the relation
extractor attaches more edges in stage 5. Including `links` in the stage-4 key
would make the key unstable across the pipeline (the same fact would hash
differently depending on how many edges stage 5 later adds), defeating dedup.
`{ kind, body }` is the stable "is this the same fact" identity at intake time.
The store's own `{ kind, body, links }` hash still runs at write time (stage 6)
as the durable dedup key — the two keys serve different phases and do not
conflict.

## 2. Similarity-dedup threshold default — `0.85`

The brief leaves the stage-4 layer-2 cosine threshold unspecified. Default:
**`0.85`** (cosine similarity in `[-1, 1]`; a candidate is surfaced to the
`IEntityResolver` only when its nearest neighbor scores `>= 0.85`).

Rationale: 0.85 is a conservative near-duplicate threshold for normalized
sentence embeddings — high enough that only genuinely-near-duplicate candidates
reach the resolver (avoiding spurious `duplicate-of`/`merge-into` verdicts on
merely topically-related records), while below the ~0.9+ range where only
trivial paraphrases match. It is exposed as
`IMemoryIngestOrchestratorCreateParams.similarityThreshold` (default `0.85`) so a
deployment tunes it against its own embedder's score distribution without a code
change.

## 3. Verdict → write disposition mapping

`IEntityResolver` returns `new | duplicate-of | supersede | merge-into`. fgv maps
each to a write disposition:

| verdict | disposition | store action |
|---|---|---|
| `new` | `written` | `put` the candidate as a fresh record |
| `duplicate-of` | `deduped` | no write; result references the existing `target` |
| `supersede` | `written` (or `superseded`) | `put` the candidate; result records `supersededId = target` (the contradicts→temporal interlock applies when the kind is temporal) |
| `merge-into` | `merged` | re-address the candidate to `target`'s `entityId` and `put` (the store's policy `applyUpdate` merges the mutable fields) |

Layer-1 exact `{ kind, body }` matches yield `duplicate-of` automatically
(without invoking the resolver). Without a resolver (OQ-13), layer-2 is skipped
entirely: a non-exact candidate is always `new` — the deterministic-identity
host path.

**Target-bearing verdict safety (post-review hardening).** Every verdict that
carries a target (`duplicate-of` / `supersede` / `merge-into`) is validated
uniformly by fgv before it is acted on: the target must be a real store record
(a non-compliant host resolver can never smuggle a bogus id into the result) AND
its `kind` must equal the candidate's `kind` (a cross-kind target would write to
the wrong scope; fgv rejects loudly). `merge-into` additionally **UNIONs** the
target's pre-existing `tags` / `links` / `provenance` with the candidate's
before the write — the store's `applyUpdate` replaces array fields wholesale
(`arrayMergeBehavior: 'replace'`), so passing only the candidate's (usually
sparse) fields would silently wipe the target's prior links/tags. The unioned
link list is de-duplicated by canonical edge key so no edge appears twice.

## 4. Stage-5 write-time cycle guard

The design specifies a write-time cycle guard (`buildCycleKey` via
`Crc32Normalizer`/RFC-8785), distinct from the read-time BFS in
`linkTraversalRetriever`.

**Decision:** the guard enforces **directed-acyclicity over the union link
graph** — existing outbound edges (from the store index) plus the stage-5
proposed edges. A proposed edge whose addition would close a directed cycle is
rejected loudly (the whole ingest fails; edges are all-or-nothing per item). The
guard uses `buildCycleKey(source, target, type)` — a `Crc32Normalizer` canonical
hash — as the deterministic per-edge identity for de-duplicating proposed edges;
cycle detection itself is DFS reachability (does `target` already reach `source`?).

**Flagged interpretation (brief did not specify cycle scope):** this enforces
**global** directed-acyclicity across all link types. That is conservative — it
would also reject a legitimate mutual associative pair (`A -mentions-> B` +
`B -mentions-> A`). Because the brief's only stated requirement is "reject a
cycle-inducing edge," global acyclicity is the minimal reasonable
interpretation. Deployments that need mutual associative links can set
`cycleGuard: 'off'`. A per-link-type refinement (acyclic only for hierarchical
types like `supersedes`/`contradicts`/`derived-from`) is a clean future additive
change and is noted as such.

Stage-5 edges must be **sourced from a candidate being written in this ingest**
(edges land on the source record's `envelope.links`, which is only writable for
records this pipeline persists). An edge whose `source` is not a candidate
reference id is rejected. An edge whose `target` resolves to neither a sibling
candidate nor an existing store record is rejected (loud, not silent-drop).

Edge source/target ids are **entity-reference ids** (the codec `idStem`). For a
temporal kind that is the stable entity stem (`<entityId>`), not a specific
version stem (`<entityId>-v<seq>`) — the version stem is transient, the entity
stem is the durable reference.

## 5. `contradicts` → temporal-versioned interlock

When a stage-5 `contradicts` edge is attached to a candidate whose kind is
**temporal** (the codec's `encode` reports `isVersioned: true`), the write is
routed through the store's versioned `put` path (which it already is, for a
temporal kind). That path invalidates the prior current version (`invalid_at`
set) and writes a new version — exactly the "temporal-versioned" behavior the
design calls for. The orchestrator recognizes the interlock and records
`interlock: 'temporal-versioned'` on the result item.

A `contradicts` edge on a **non-temporal** kind is persisted as a plain link (no
interlock) — matching the brief's note that partial-L3 `contradicts` edges
persist as ordinary `links`.

## 6. `ICandidateRecord.envelope` omitted fields

The design (`:825`) writes
`Omit<IMemoryEnvelope, 'id' | 'contentHash' | 'created' | 'updated'>` (four
fields). `seq` is ALSO store-stamped (the monotonic write counter). This
implementation omits **all five** store-owned fields:
`Omit<IMemoryEnvelope, 'id' | 'seq' | 'contentHash' | 'created' | 'updated'>`.
The host supplies `entityId`, `kind`, `tags`, `links`, `provenance`,
`temporal?`, `embeddingRef?`; fgv derives `id` (codec) and the store stamps the
rest.

## 7. Additive-provenance non-regression

The provenance lineage fields (`by` / `model` / `confidence` / `derivedFrom`)
are already additive/optional on the shipped `IProvenance` (only `source` is
required). The stream preserves this: a pre-existing `mtm`/`ltm` record whose
provenance carries only `source` loads and validates unchanged, and stage-6
stamping merges `{ source: 'host-ingest', derivedFrom? }` over the host-supplied
provenance without requiring any lineage field. Asserted as an explicit
non-regression test.

## 8. Testbed proof

End-to-end proof is delivered as an orchestrator integration test with fully
mocked host stages (classifier / extractor / resolver / relation-extractor) over
a real `FileTreeMemoryStore` + `InMemoryCosineIndex`. A `samples/testbed`
scenario is **not** added: the pipeline is pure library logic with no live model
on the fgv-owned path (the host stages are the only model-driven parts, and they
are mocked), so the unit-level end-to-end test exercises the identical code path
a testbed scenario would. No live API call is involved (STOP-FLAG condition from
the brief's scope item 6 is not triggered).
