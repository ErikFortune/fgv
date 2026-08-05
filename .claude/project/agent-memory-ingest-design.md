# `@fgv/ts-agent-memory` — ingest orchestrator design note

> **Provenance of this document — read first.**
>
> `ingest/orchestrator.ts`, `ingest/model.ts`, and `ingest/cycleGuard.ts` have cited "the design
> note §1–§4" since the ingest packlet shipped. **No such document has ever existed in this
> repository.** Its absence was found during the triage of the `agent-memory-ingest-dedup-scope`
> workstream (2026-08).
>
> This note is **not** a recovered copy of the cited document, and nothing here should be read as
> the original design intent. It was written fresh, by reading the shipped code, and it says two
> kinds of thing:
>
> - **What the code does today** — described from the implementation as it stands.
> - **What the `agent-memory-ingest-dedup-scope` stream decided** — marked inline as such.
>
> The section numbers are chosen so the existing `§1`–`§4` citations resolve to the subject each
> was pointing at. Where this note and the code disagree, the code is authoritative and the note
> is a bug.

## Pipeline overview

`MemoryIngestOrchestrator.ingestItem` runs one `IIngestItem` through six stages. Stages 2, 3, 4
(layer 2), and 5 are **host callbacks**; everything else is fgv-owned. Every host callback is
wrapped so a throw or rejection becomes a `Result.fail` and never escapes across the seam.

| Stage | Owner | What happens |
|---|---|---|
| 1 | host | Item arrives (`IIngestItem`) |
| 2 | host | `IMemoryClassifier.classify` → `IMemoryClassification` |
| 3 | host | `IFactExtractor.extract` → `ICandidateRecord[]` |
| 3b | **fgv** | Typed validation boundary: each candidate body through `IBodyConverterRegistry`. No unchecked host body reaches the store. |
| 4 | **fgv** + host | Dedup / resolution → a `ResolutionVerdict` per candidate (§1, §2) |
| 5 | host + **fgv** | `IRelationExtractor.relate` → edges; then fgv redirects, validates, and cycle-guards them (§3, §4) |
| 6 | **fgv** | Stamp provenance + edges, admit through `IMemoryStore.put` |

The store is snapshotted **once**, before stage 4. Resolution, edge validation, and the cycle guard
all reason over that single pre-ingest snapshot, indexed by canonical scope-qualified address
(`edgeTargetKey(scope, id)`) so a filename stem reused across scopes never aliases.

---

## §1 — Layer-1 exact dedup

Layer 1 is fgv-owned, deterministic, and runs for every candidate before any host resolver is
consulted. It hashes `{ kind, body }` (via `Hash.Crc32Normalizer`) and looks for an existing record
with the same hash. A hit yields `duplicate-of`; a miss falls through to §2.

The cohort layer 1 searches is:

- same `kind` as the candidate, **and**
- **live** — a temporal record that is not the current version is excluded, **and**
- in the candidate's own `scope`, **and**
- **at the candidate's own entity address, when the kind's `dedupScope` is `'entity'`.**

### The `dedupScope` amendment (decided by `agent-memory-ingest-dedup-scope`)

That last clause is what this stream added. Before it, layer 1 built its cohort from same-kind,
same-scope, live records **regardless of entity**, which is `'content'` behavior unconditionally —
`dedupScope` had zero references anywhere in `ingest/`.

The declaration now means the same thing on both write paths:

| `dedupScope` | Direct put (`IMemoryStore.put`) | Ingest layer 1 |
|---|---|---|
| `'content'` | identical `{kind, body, links}` anywhere in scope collapses, even cross-id | identical `{kind, body}` anywhere in scope is `duplicate-of`, even cross-id |
| `'entity'` | only an identical re-put of the **same** entity is a no-op | only a match at the candidate's **own** entity address is `duplicate-of` |

**One owner.** The granularity is read through **`IMemoryStore.dedupScopeFor(kind)`**, added by this
stream. It resolves the whole chain the store itself applies — registered `IWritePolicy` → store
default policy → that policy's `dedupScope` → `DEFAULT_DEDUP_SCOPE` — and the store's own write path
calls it too. There is deliberately no second declaration site: handing the orchestrator a copy of
the `writePolicies` map would have recreated the exact defect being fixed.

The accessor is synchronous, total, and not `Result`-returning (it reads injected configuration and
cannot fail), and it exposes only the scope — never the `IWritePolicy` — so it cannot become a back
door for invoking admission or merge logic out of band.

> **The effective default is `'content'`, not `DEFAULT_DEDUP_SCOPE`.** `DEFAULT_DEDUP_SCOPE` is
> `'entity'`, but it is only reached when a policy declares no `dedupScope`. A kind with **no
> registered policy** falls back to the store's default policy, which is a `KnowledgeLwwPolicy` —
> and that declares `'content'` explicitly. So an unpoliced kind resolves to `'content'`.
> Of the shipped policies, `KnowledgeLwwPolicy` declares `'content'`; `MemoryCapCullPolicy` and
> `TemporalVersionedPolicy` declare `'entity'`.

**What layer 1 does not do.** The same-entity collapse itself remains the store's job. Layer 1 only
decides whether a cross-entity body collision is eligible to be a `duplicate-of` at all; it never
reimplements the store's content-hash comparison, its mutable-metadata check, or its merge.

**Same-entity identical bodies still emit `duplicate-of`** (this stream's OQ-2). It is a genuine
no-op that the store would collapse anyway, and emitting the verdict keeps the result honest about
what happened. This is only safe because §3's redirect keeps the collapsed candidate's address
resolvable for sibling edges — the two must never be separated.

---

## §2 — Layer-2 similarity resolution

Layer 2 runs only when a candidate misses layer 1 **and** all three of `entityResolver`,
`vectorIndex`, and `embed` are wired. Any one missing → layer 2 is skipped entirely and the verdict
is `new` (the deterministic-identity path).

When wired: build a provisional record for the candidate, embed it, query the vector index for the
top `similarityTopK` (default `DEFAULT_SIMILARITY_TOP_K` = 5) neighbors, and keep hits scoring
`>= similarityThreshold` (default `DEFAULT_SIMILARITY_THRESHOLD` = 0.85). The candidate's **own**
scope-qualified address is excluded — a re-ingest of the same entity must not dedup against its own
prior version. Both scope and id must match for a hit to count as self.

Surviving neighbors are handed to `IEntityResolver.resolve`, which returns any of the four verdicts.
No neighbors → `new`. Layer 2 is **not** `dedupScope`-filtered: the host resolver is given the
neighbors and makes its own judgment, including a legitimate cross-entity `duplicate-of` on an
`'entity'` kind.

---

## §3 — Verdict → write mapping

`ResolutionVerdict` has four arms. Each target-bearing arm carries a scope-qualified `IEdgeTarget`,
not a bare `MemoryId`, so it resolves to exactly one record even when a stem is reused across scopes.

fgv validates **every** target-bearing verdict uniformly before acting on it — the target must be a
real record in the snapshot, and its `kind` must equal the candidate's. A non-compliant host resolver
therefore cannot smuggle a bogus or cross-kind id through.

| Verdict | Write address | Disposition | Notes |
|---|---|---|---|
| `new` | the candidate's own | `written` | |
| `duplicate-of` | — (no write) | `deduped` | result `id` is the target's |
| `supersede` | the candidate's own | `written` | |
| `merge-into` | **re-addressed to the target's entity** | `merged` | target's existing `tags` / `links` / `provenance` are UNIONed with the candidate's before the write, because the store's `applyUpdate` replaces array fields wholesale |

### The `duplicate-of` edge redirect (decided by `agent-memory-ingest-dedup-scope`)

A `duplicate-of` candidate is not written, so its address never becomes a live reference. Before this
stream, a sibling edge built against that address in the same pass resolved to neither a written
candidate nor an existing record, and edge validation failed the **whole ingest item** — every other
candidate in the item included.

That is a second-order hazard of collapsing, not a defect in the edge: the host related two
candidates it was correctly told about, and one of them turned out to already exist.

**Edges whose `target` names a collapsed candidate are now redirected to the verdict's target** —
"this candidate *is* that record", so an edge pointing at the candidate should point at the record.
The redirect happens **before** validation and **before** the cycle guard, so both judge the edge as
it will actually be persisted.

This is **independent of `dedupScope`**. It applies equally to a `'content'` kind, where the collapse
is exactly right and the ingest still must not fail.

Two deliberate limits:

- **Only targets are redirected, never sources.** Sources are the records an edge is written *onto*.
  A collapsed candidate is never written, and the relation extractor is only ever offered writable
  candidates as sources in the first place. Silently relocating such an edge onto an existing record
  would attribute a link the host never asked for, so it stays a loud failure.
- **The map cannot chain.** A redirect destination is always a record that already exists in the
  snapshot (§3's uniform target validation guarantees it), never another collapsed candidate. One
  pass is sufficient by construction.

---

## §4 — The write-time cycle guard

`cycleGuard: 'reject'` (the default) enforces **global directed acyclicity** over the link graph:
the union of every outbound edge already in the snapshot and every edge proposed by this pass. `'off'`
disables the constraint for deployments whose link graphs are legitimately cyclic (e.g. mutual
associative links).

Both ends of every edge — existing and proposed — are canonical scope-qualified addresses, so the
guard never conflates a stem shared across scopes into a single graph node. The guard runs on the
**redirected** edge set (§3), so it evaluates the graph that will actually be persisted.

A cycle-inducing edge fails the ingest item.

---

## §5 — Interlocks and invariants

- **Contradicts → temporal.** A `contradicts` edge on a candidate of a temporal kind is recognized
  and reported as `interlock: 'temporal-versioned'`. This is a **diagnostic marker only** — a
  temporal kind always writes through the store's versioned path regardless, driven by the codec's
  `isVersioned` flag, not by this flag.
- **Provenance.** Every record the pipeline writes is stamped `source: HOST_INGEST_PROVENANCE_SOURCE`
  (`'host-ingest'`), plus `derivedFrom: item.sourceId` when the item carries one.
- **Edge dedup.** A record's final `links` are de-duplicated by canonical edge hash across the merge
  target's prior links, the candidate's own links, and this pass's stage-5 edges.
- **Ordering.** Stage 6 writes in extraction order. The first failure aborts the item;
  `ingestBatch` aborts the batch on the first failing item.
