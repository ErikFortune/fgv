# Structured Memory for Agents — Design-Space Note

Anticipatory design spike. No code ships. The deliverable is this grounded note.
Conceptual inspiration is Obsidian / claude-obsidian (a markdown vault with
wikilinks and a derived backlink index) — explicitly **not** a graph database.

Breadth decision: **DEEP on a single lead candidate.** The prior-art survey
surfaced an obvious fit — `basic-memory`'s architecture (markdown + frontmatter
files as the source of truth, a *derived* index, inline observations/relations, a
hybrid retrieval set, and MCP tools annotated with behavior hints). It maps almost
one-to-one onto fgv's existing `FileTree` + `Converter` + `Result` discipline, and
the heavier graph-DB alternatives (Zep/Graphiti, Cognee) fail the "files you own"
and "compose, don't build new infra" tests. I prodded those alternatives enough to
confirm the fork, then went deep on the markdown-vault line.

---

## 1. Layered model recap

Three **stacked** layers, not three parallel memory types. Each higher layer is a
consumer of the one below.

- **L1 — Graph substrate.** The foundation for BOTH memory and knowledge: files +
  links + a derived backlink index, materialized over storage. A memory is a
  typed record (envelope + body) on disk; relationships are links between records;
  backlinks are a derived view. **This is the only layer that must be right
  first.** Everything else is a consumer.
- **L2 — Agent tool layer.** The agent reads/writes/curates the substrate itself
  through LLM tools (the claude-obsidian / basic-memory pattern: `write_note`,
  `read_note`, `search`, `build_context`). Memory-as-tools. Ships after L1, can
  ship independently.
- **L3 — Host automatic-ingest layer.** A host-configured pipeline that ingests
  raw "things" (transcripts, docs, events) and uses classifiers — escalating to
  heavier LLM firepower occasionally — to turn them into substrate records. This
  is the novel/risky surface: classification policy, escalation policy, dedup/merge
  of machine-derived memories, and provenance of machine-made memories. It is
  mapped here but **must not gate the substrate**.

Design consequence honored throughout: optimize L1 for being a clean, queryable,
git-friendly, cross-runtime substrate that L2 and L3 can both sit on without L1
knowing they exist.

---

## 2. Prior-art survey (with citations)

### Lead candidate — basic-memory (`basicmachines-co/basic-memory`)
- **Memory model:** one Markdown file per entity. Frontmatter carries
  `title`/`type`/`permalink`/`tags`. The body carries two structured constructs:
  **observations** (`[category] text #tag (context)`) and **relations**
  (`relation_type [[Target]]`; a bare `[[Target]]` defaults to `links_to`).
- **Storage:** "Plain text on your disk. Forever." Markdown files are the source of
  truth; a **SQLite (or Postgres) index** is *derived* from the files via two-way
  sync. **Not a graph DB** — the graph "emerges from relation syntax" and is
  traversed link-by-link.
- **Retrieval:** three strategies — full-text (`search_notes`), semantic/vector
  ("hybrid full-text + vector ranking with FastEmbed embeddings"), and graph
  traversal (`build_context` over `memory://` URLs).
- **Host/agent shaping:** MCP tools annotated with `readOnlyHint` /
  `destructiveHint` / `idempotentHint` / `openWorldHint` so agents pick the right
  tool without trial-and-error. Both human and LLM read/write the same files.
- **Why it composes with fgv:** files-as-truth = `FileTree`; derived index =
  rebuildable in-memory structure; observations/relations = typed body + `links[]`
  envelope; behavior-hinted tools = `IAiClientTool` with descriptions. The whole
  thing is a `Result`-and-`Converter` rewrite of an architecture fgv already has
  every primitive for.
  Source: https://github.com/basicmachines-co/basic-memory

### claude-obsidian (`AgriciDaniel/claude-obsidian`) — conceptual reference
- Self-organizing "second brain": drop a source, the LLM reads/links/files it into
  one connected vault of plain Markdown you own. **No vector embedding** — notes
  are plain markdown the LLM reads directly; the LLM writes and maintains
  summaries, backlinks, and categorization.
- Philosophy: **value ∝ link density**, not note count; every content-creating
  skill also creates connections. A `wiki/hot.md` "hot cache" is read first each
  session to rebuild context cheaply.
- Takeaway for fgv: the substrate must make linking *cheap and first-class*, and a
  bounded "hot context" view (a `RetainingRingBuffer`-shaped working set) is a
  natural L2 affordance.
  Source: https://github.com/AgriciDaniel/claude-obsidian

### mem0 — extraction-first, multi-store
- Combines vector + graph + key-value; **automatically extracts and ranks facts on
  the agent's behalf**. Large ecosystem.
- Contrast with fgv lean: mem0 is opinionated infra (it owns extraction + storage +
  ranking). fgv's discipline is the opposite — thin primitives, consumer controls
  shape. mem0's *automatic extraction* is the L3 concept, not the L1 substrate.
  Sources: https://baeseokjae.github.io/posts/best-ai-agent-memory-frameworks-2026/ ,
  https://vectorize.io/articles/mem0-vs-letta

### Zep / Graphiti — temporal knowledge graph
- Every fact is timestamped; state changes are modeled ("moved London→Tokyo" is a
  transition, not two current facts). Strong temporal retrieval (LongMemEval
  63.8% vs mem0 49.0%). Entity dedup is a deterministic pass (exact → MinHash/
  Jaccard) then an LLM pass.
- Contrast: this is a *real* temporal graph DB with heavy infra. It is the strong
  counter-evidence for "how graph really?" — its win is **temporal reasoning**, a
  capability the markdown-vault line does not natively get. Verdict: out of scope
  for L1; the timestamping idea is cheap to borrow in the envelope.
  Sources: https://www.agenticwire.news/article/mem0-zep-letta-agent-memory ,
  https://codepointer.substack.com/p/agent-memory-systems-and-knowledge

### Letta / MemGPT — memory-as-OS, agent-curated
- LLM-as-OS managing a memory hierarchy: **core** (in-context, like RAM),
  **recall** (searchable recent history), **archival** (queried on demand). The
  agent uses tools to promote/archive/retrieve — it is **not** auto-extraction;
  the agent decides. This is the purest L2 model.
- Takeaway: the core/recall/archival tiering maps cleanly onto fgv primitives —
  core ≈ a bounded working set (`RetainingRingBuffer`), recall/archival ≈ the
  FileTree substrate behind retrievers. Validates the L2 design.
  Sources: https://vectorize.io/articles/mem0-vs-letta ,
  https://baeseokjae.github.io/posts/best-ai-agent-memory-frameworks-2026/

### Cognee — ECL pipeline (Extract, Cognify, Load)
- Six-stage pipeline: classify documents → permissions → chunk → LLM entity/
  relation extraction → summarize → embed+commit-edges. Two dedup layers:
  content-hash in `add()` before `cognify()`, plus pipeline-status tracking.
  Custom Graph Models = a domain schema constraining what the LLM extracts.
- This **is** the L3 blueprint: classify → (escalate to LLM) extract → dedup by
  content-hash → merge → load with provenance. fgv already ships content-hash dedup
  (`Crc32Normalizer`) and classification (`callProviderEmbedding` / local
  transformers `classify`). Borrow the *shape* of the pipeline for L3, not the
  framework.
  Sources: https://www.cognee.ai/blog/fundamentals/how-cognee-builds-ai-memory ,
  https://memgraph.com/blog/from-rag-to-graphs-cognee-ai-memory

### Synthesis across prior art
Two camps: **agent-curated markdown vaults** (basic-memory, claude-obsidian,
Letta) vs. **auto-extracting graph/vector platforms** (mem0, Zep, Cognee). fgv's
"files you own + thin primitives + consumer-controls-shape" discipline lands the
lead squarely in the first camp for L1/L2. The second camp's contributions
(content-hash dedup, classification, temporal stamping, custom extraction schema)
are exactly the L3 ingredients — borrowed as patterns, not as a dependency.

---

## 3. fgv compose-vs-build inventory (with file:path citations)

The headline: **~80–90% of the substrate is composition, not new build.** The only
genuinely new infrastructure decision is the vector index (tension 2).

| Capability needed | fgv primitive to compose | Citation |
|---|---|---|
| Files as source of truth, cross-runtime (node/browser-FSA/zip/in-memory), git-friendly | `FileTree` | `libraries/ts-json-base/src/packlets/file-tree/fileTree.ts` |
| **Writing** memory files (write is required — unlike prompt store) | `IMutableFileTreeFileItem.setRawContents`, `IMutableFileTreeAccessors.createDirectory` | `libraries/ts-json-base/src/packlets/file-tree/fileTreeAccessors.ts:205,434` |
| Reading file contents | `IFileTreeFileItem.getRawContents` | `fileTreeAccessors.ts:177` |
| YAML frontmatter parse/emit | `Yaml.yamlConverter` (composed with a Converter) | used at `libraries/ts-prompt-assist/src/packlets/store/fileTreePromptStore.ts:63` |
| Record-jar style header parsing (alt frontmatter) | `ts-extras` `record-jar` packlet | `LIBRARY_CAPABILITIES.md` (ts-extras) |
| Typed envelope validation (no manual typeof+cast) | `Converters.object` / `Validators.object` | `.ai/instructions/CODING_STANDARDS.md` (Type-Safe Validation) |
| Branded ids (`MemoryId`, `Tag`, `LinkType`, `ScopeKey`) with hygiene + reject rules | branded-id Converter factory pattern | `libraries/ts-prompt-assist/src/packlets/types/ids.ts:114-175` |
| Content-hash for dedup + cycle detection + cache keys (RFC 8785 canonical) | `Hash.Crc32Normalizer.computeHash` / `canonicalize` | `libraries/ts-utils/src/packlets/hash/hashingNormalizer.ts:43` |
| Bounded most-recent-N working set (L2 "core memory" / hot cache) | `RetainingRingBuffer` (seq cursor, predicate filter, `lastSeq` stable across clear) | `libraries/ts-utils/src/packlets/collections/retainingRingBuffer.ts:99` |
| Observation/audit of every memory read/write (who recalled what, when) | `IPromptObserver` + `PromptObservationStore` pattern (RetainingRingBuffer-backed, schema-aware `query`, injectable `IQualifierResolver`) | `libraries/ts-prompt-assist/src/packlets/observe/promptObservationStore.ts:84`, `.../observe/types.ts:162` |
| Scope chain + qualifier-conditional recall (per-tenant/lang/persona memory) | ts-res via the prompt-store scope/candidate pattern | `fileTreePromptStore.ts:160-220` (scope dir walk), `.../types/descriptor.ts:126` (conditions) |
| L2 tool mechanism (memory ops as LLM tools, behavior-hinted) | `AiAssist.IAiClientTool` + `executeClientToolTurn`; tool params via `JsonSchema.object` | `libraries/ts-extras/src/packlets/ai-assist/model.ts` |
| L2 memory-as-MCP-tools path | `@fgv/ts-extras-mcp` `adaptMcpTools` | `LIBRARY_CAPABILITIES.md` (ts-extras-mcp) |
| L3 classification (cheap path) | local transformers `classify`/`classifyAll`; embeddings `callProviderEmbedding` | `LIBRARY_CAPABILITIES.md` (ts-extras-transformers, ai-assist) |
| L3 escalation (heavier LLM) | `generateJsonCompletion` / grammar-constrained `chatStructured` (ts-extras-ollama) | `LIBRARY_CAPABILITIES.md` |
| **Vector store / cosine / top-k index** | **NONE — explicit non-goal of ai-assist** | `LIBRARY_CAPABILITIES.md` ("not ai-assist's job") |

**Structural precedent (the spine).** `ts-prompt-assist` already solved the exact
shape problem — a FileTree-backed typed-record store with scopes, qualifier-
conditional selection, recursive resource binding with RFC-8785 cycle detection,
an observation packlet, and a pluggable safety/screener model. The memory substrate
is "the same spine, different record body, plus writes and links." Key precedent
files:
- Store: `fileTreePromptStore.ts` — scope-encoded subtrees, per-file YAML convert,
  filename↔id verification (`verifyFilenameId`, line 73).
- Store contract with **optional** write surface left undefined at v0.1:
  `store/interfaces.ts:47-55` (`put`/`putBindings`/`delete`/`watch` all optional) —
  proves the family *anticipated* writable stores; memory simply implements them.
- Observe: `observe/promptObservationStore.ts` + `observe/types.ts` — the
  ring-backed, schema-aware, injectable-resolver observation model to clone.

**One important divergence from the prompt-store precedent:** the prompt store is
**read-only at v0.1** by deliberate choice (`store/interfaces.ts` comments, OQ-3),
*not* a `FileTree` limitation — `FileTree` exposes a full mutable surface
(`setRawContents`, `createDirectory`). Memory **must** be writable from day one
(L2 is the agent writing memories), so the memory store implements the write half
of the same `IStore`-shaped contract the prompt family stubbed out.

---

## 4. Design tensions resolved (rationale, with evidence)

### Tension 1 — How "graph" really?
**Resolution: CONFIRM the lean — markdown+frontmatter on `FileTree`, `links[]` in
the envelope, backlinks via a derived in-memory index. Defer a real graph DB.**

Evidence: the entire lead-candidate camp (basic-memory, claude-obsidian) and Letta
build the graph as *emergent from link syntax over files*, with the index derived
and rebuildable. basic-memory's SQLite is explicitly an *index derived from files*,
not the source of truth. fgv has no graph-DB primitive and the discipline rejects
new heavy infra when composition suffices.

The fork ("do multi-hop / graph-query needs force a heavier index?"): prodded
against Zep/Graphiti, the only capability a graph DB *uniquely* buys is **temporal
state-transition reasoning** and **deep multi-hop queries at scale**. Neither is in
the L1 must-have set, and both can be added later behind the retriever interface
without reshaping the substrate (the files don't change; only the derived index
gets richer). So: derived backlink index now; the index is an internal,
rebuildable structure (rebuild = re-walk the FileTree), so swapping it for
something heavier later is non-breaking. **Do not let multi-hop force a graph DB
into L1.**

### Tension 2 — The vector-index gap (the one genuine new-infra decision)
**Resolution: CONFIRM the lean. Put retrieval behind an `IMemoryRetriever`
interface NOW. Ship recency + tag + link-traversal + structured-filter retrievers
first. Make vector recall a flagged fast-follow behind a separate `IVectorIndex`
seam.**

Evidence: `LIBRARY_CAPABILITIES.md` is explicit that a vector store / cosine /
top-k is "not ai-assist's job" — fgv ships the *embedding* primitives
(`callProviderEmbedding`, in-process `embed`) but deliberately not a store. Two
sub-decisions:
- **Don't defer semantic recall conceptually** — design the `IVectorIndex` seam
  now (embed-on-write hook + `query(vector, topK)`), so the substrate is shaped to
  accept it. claude-obsidian proves a *useful* memory works with **zero** vector
  search (pure link + full-text), so the non-vector retrievers are genuinely
  shippable as v1, not a stopgap.
- **Build a minimal in-package cosine/top-k as the reference `IVectorIndex`?** Lean
  yes, but flagged and small: a brute-force cosine over an in-memory `Float32Array`
  set is ~30 lines, has no new dependency, and is correct for the small-N memory
  case (thousands, not millions, of records). For larger N a consumer injects an
  external index behind the same `IVectorIndex`. This respects "extend the
  primitive, don't work around it" — but it is a *fast-follow*, not v1, and it is
  the single thing to flag to the orchestrator as new-infra.

### Tension 3 — Shape-control boundary
**Resolution: SETTLED BY PRECEDENT (validated, not re-derived).** `ts-prompt-assist`
already established the pattern the memory substrate adopts wholesale:
- Thin fixed envelope (frontmatter) + consumer-typed body via a registered
  `Converter`/`JsonSchema` (`registry` packlet; `output.converterId` dispatch).
- Open vocabulary for `kind`/tag/link types (cf. open `surface` string,
  `descriptor.ts:74`; open safeguard `kind`s).
- Injectable retrievers (cf. injectable `IQualifierResolver`,
  `observe/types.ts:248`).
- Qualifier-conditional recall (cf. ts-res candidate selection).
- Per-kind write policy (append-only / upsert / bounded-ring) — the substrate's
  analog of the prompt family's per-kind handling; `RetainingRingBuffer` is the
  bounded-ring primitive already in hand.

Validation against the 3-layer model: L1 owns the fixed envelope + open vocab; L2/L3
are consumers that pick `kind`s and bodies. Clean. No new boundary needed.

### Tension 4 — Relationship to `ts-prompt-assist`
**Resolution: CONFIRM the lean — do NOT pre-extract a shared core. Name the seam,
decide later.** Both libraries want "FileTree-backed typed-record store with scopes
+ qualifier selection + provenance + observation." That is a real ~80% overlap. But:
- The overlap is *structural*, and structural overlap is the cheapest kind to
  re-derive and the most expensive kind to prematurely abstract (the coding
  standards' "three similar lines beats a premature abstraction," scaled up).
- Memory's record body, write semantics, link/backlink index, and retriever set are
  all genuinely new and not yet stable. Extracting a shared `@fgv/ts-record-store`
  core now would freeze an interface before memory's real shape is known.
- The lockstep version policy makes a *later* extraction cheap (one alpha bumps
  everyone). There is no version-cost reason to rush it.

**Named seam:** the shared concept is `IFileTreeTypedRecordStore<TRecord>` +
`IScopeChainResolver` + the `RetainingRingBuffer`-backed observation pattern. Both
libraries already consume `RetainingRingBuffer` (prompt store does, via
`promptObservationStore.ts:91`); the observation pattern is *already* de-facto
shared at the primitive level. Revisit a formal extraction once memory ships and
the two stores' write/scopes/observe surfaces have demonstrably converged.

### Tension 5 — Could the substrate subsume episodic memory later?
**Resolution: YES as a generality test (NOT as a target).** personaility already
has episodic memory and it is explicitly not a target. Used as the forcing
function: "could a bounded `RetainingRingBuffer`-backed kind live in the same
envelope?" — the answer is **yes, cleanly**, and that is the signal the substrate is
general enough.

A `kind: 'episodic'` record is just an envelope whose write policy is
"bounded-ring" rather than "upsert/append," backed by `RetainingRingBuffer`
(seq cursor, predicate filter, `lastSeq` stable across `clear()`). The same
retriever interface (recency retriever = ring `query({ limit })`) serves it. Letta's
"recall memory" tier is exactly this. The fact that an episodic kind drops in
without reshaping the envelope confirms the envelope is the right altitude. We do
**not** build episodic memory here — we just verify the substrate wouldn't fight it.

---

## 5. Substrate pressure-test (LOAD-BEARING)

The failure mode this section exists to prevent: build the graph all the way out,
then discover it doesn't serve its consumers. Proposed substrate shape under test:

```
vault/                                   # a FileTree root (node fs | in-mem | zip | browser FSA)
  <scope>/                               # scope-encoded subtree (per ts-prompt-assist scopeEncoding)
    <memory-id>.md                       # one memory = frontmatter envelope + markdown body
```
Envelope (frontmatter), validated by a `Converters.object`:
```yaml
id: coffee-v60                           # MemoryId (branded, == filename stem)
kind: fact                               # open vocab; consumer-registered body Converter dispatched on (kind)
tags: [brewing, coffee]                  # Tag[]
links:                                   # typed links — the graph edges
  - { type: pairs_with, target: chocolate-desserts }
  - { type: grown_in,   target: ethiopia }
created: 1750000000000                   # ms epoch (borrowed from Zep temporal idea)
updated: 1750000000000
provenance: { source: agent, by: assistant }   # agent | host-ingest | human
contentHash: "a1b2c3d4"                  # Crc32 over canonical {kind, body, links} — dedup key
embeddingRef: null                       # set by the IVectorIndex embed-on-write hook (fast-follow)
```
Body = markdown. Derived (rebuildable) in-memory index: `backlinks: Map<MemoryId,
Edge[]>`, `byTag: Map<Tag, MemoryId[]>`, built by walking the FileTree once.

### Scenario A — L2 agent tool-use round-trip (store → link → retrieve three ways)
Agent is given memory tools via `IAiClientTool` (params authored with
`JsonSchema.object`, so `schema.validate(args)` is the round-trip verify), driven by
`executeClientToolTurn`.

1. **Store.** Agent calls `memory_write({ kind:'fact', body:'V60 pour-over...',
   tags:['brewing'], links:[{type:'pairs_with', target:'chocolate-desserts'}] })`.
   Tool path: `JsonSchema.validate(args)` → envelope `Converters.object` →
   `Crc32Normalizer.computeHash({kind,body,links})` for `contentHash` (dedup: if a
   record with the same hash exists, upsert instead of duplicate) →
   `setRawContents(frontmatter + body)` on a `IMutableFileTreeFileItem` →
   observation record pushed (provenance `agent`). **HELD** — every step is an
   existing primitive; write is the one capability the prompt store stubbed but
   `FileTree` provides natively.
2. **Link (and backlink).** The `links[]` edge `pairs_with → chocolate-desserts`
   is written into the source file. The *backlink* (chocolate-desserts ← coffee-v60)
   is **not** written into the target file — it is materialized in the derived
   index on the next walk. **BENT (acceptably):** backlinks are query-time derived,
   not stored. Trade-off matches basic-memory exactly (the index is derived from
   files). The cost: a backlink query requires the index to be current. Mitigation:
   the index is cheap to rebuild (one FileTree walk) and L2 writes can incrementally
   patch it. **No substrate reshape needed** — backlinks are a *view*, not state.
3. **Retrieve by tag.** `memory_search({ tag:'brewing' })` → `byTag` index lookup →
   record list. **HELD** (a `Collections`-style map lookup).
4. **Retrieve by link traversal.** `memory_context({ from:'chocolate-desserts',
   hops:1 })` → backlink index gives inbound edges, `links[]` gives outbound;
   one-hop is a map lookup, multi-hop is BFS over the in-mem index with
   `Crc32`-canonical visited-set cycle detection (the exact RFC-8785 cycle-detection
   pattern `ts-prompt-assist` already uses for recursive resource binding). **HELD
   for ≤ small hop counts.** **STRESS POINT:** deep multi-hop at large N is where a
   derived in-mem index gets slow — but that is precisely the deferred graph-DB
   capability (tension 1), addable behind the retriever without touching files.
5. **Audit.** Every read/write fires an observation (clone of `IPromptObserver`);
   "what did the agent recall this session" is a `query({ sinceSeq })` over the
   ring. **HELD** — direct reuse of the observe packlet.

**Verdict A:** substrate held on store/tag/one-hop/audit; bent acceptably on
backlinks (derived-view, by design); flagged a known stress point on deep multi-hop
that the deferred-index decision already covers. The envelope did not have to
change to support the L2 tool surface.

### Scenario B — semantic recall end-to-end
Agent asks "anything about brewing technique?" with no exact tag/link match.

1. **Embed-on-write (fast-follow hook).** When `memory_write` ran in Scenario A,
   an optional `IVectorIndex.add(id, embed(body))` hook computed an embedding via
   `callProviderEmbedding` (or in-process `embed`) and stored `embeddingRef` in the
   envelope + the vector in the index. **HELD** — embedding is an existing primitive;
   the *only* new piece is the vector store behind `IVectorIndex`.
2. **Recall.** `memory_search({ semantic:'brewing technique', topK:5 })` → embed the
   query → `IVectorIndex.query(vector, 5)` → cosine top-k → hydrate the matching
   records from FileTree. **BENT — this is the genuine gap:** there is no fgv cosine/
   top-k. Resolution per tension 2: a minimal brute-force in-package
   `IVectorIndex` (cosine over an in-mem `Float32Array` set, no new dep, correct for
   small-N) is the reference impl; a consumer injects an external ANN index behind
   the same interface for large N.
3. **Hybrid.** Real systems (basic-memory) rank full-text + vector together. Behind
   `IMemoryRetriever`, a `HybridRetriever` composes a full-text retriever and the
   vector retriever and merges scores. **HELD** — composition of retrievers, no
   substrate change.
4. **Degradation.** If no `IVectorIndex` is wired, `memory_search({ semantic })`
   fails fast with a clear `Result.fail` ("semantic recall requires a vector index;
   none configured") rather than silently returning nothing. **HELD** — the
   retriever interface makes the capability presence explicit.

**Verdict B:** substrate held everywhere except the vector store itself, which is
the one acknowledged new-infra item — and it sits cleanly behind an interface the
substrate was shaped to accept (`embeddingRef` field + `IVectorIndex` seam). Semantic
recall is genuinely optional: the substrate is useful (per claude-obsidian) with
link + full-text alone.

### What the pressure-test changed in the design
- Added `contentHash` and `provenance` to the envelope (forced by the store-step
  dedup and the audit-step provenance need).
- Confirmed backlinks are a derived view, never stored state (forced by the link
  step) — and that this is the right call, not a compromise.
- Confirmed `IMemoryRetriever` must report capability presence so semantic recall
  degrades loudly (forced by the degradation step).
- Confirmed the envelope is stable across `kind: fact` and `kind: episodic`
  (tension 5) and across the L2 surface (scenario A) without reshaping.

---

## 6. Recommended architecture

**Single deep recommendation** (the lead candidate was decisive). A new package,
floated name **`@fgv/ts-agent-memory`** (recommendation, NOT a decision — could land
as a packlet family if the seam-extraction question (§4 tension 4) resolves toward
sharing with `ts-prompt-assist`).

Package-vs-packlet rationale: a new top-level library, because (a) it has a distinct
consumer (personaility) and a distinct surface (writable store + links + retrievers +
tools), (b) the active-development policy welcomes new libraries with no compat
burden, and (c) keeping it separate preserves the option to *later* extract a shared
record-store core from both it and `ts-prompt-assist` rather than entangling them now.

Proposed packlet layout (mirrors `ts-prompt-assist`'s proven shape):

```
@fgv/ts-agent-memory
  types/         MemoryId/Tag/LinkType/ScopeKey brands; IMemoryEnvelope; ILink;
                 provenance enum; per-kind write-policy enum
  converters/    frontmatter envelope Converter; per-kind body Converter registry
  store/         IMemoryStore (read+WRITE+delete) ; FileTreeMemoryStore (writable
                 from day one) ; scope encoding (reuse ts-prompt-assist pattern)
  index/         derived backlink + byTag in-memory index (rebuildable via walk)
  retrieve/      IMemoryRetriever ; recency / tag / link-traversal / structured
                 retrievers ; HybridRetriever ; capability-presence reporting
  vector/        IVectorIndex seam ; (fast-follow) minimal brute-force cosine impl
  observe/       clone of ts-prompt-assist observe packlet (ring-backed audit)
  tools/         (L2, later) IAiClientTool factory set: write/read/search/context,
                 behavior-hint metadata (read-only/destructive/idempotent)
  ingest/        (L3, later/separate stream) classify→escalate→dedup→merge pipeline
```

Layer ownership: `types`+`converters`+`store`+`index`+`retrieve`+`observe`+`vector`
= **L1** (the must-be-right-first substrate). `tools` = **L2**. `ingest` = **L3**
(arguably its own package/stream; see OQs).

---

## 7. Proposed minimal first slice

Substrate + *just enough* tool/semantic to be real (not a toy):

**In scope (v0.1):**
1. **Envelope + body.** `IMemoryEnvelope` Converter (frontmatter via `Yaml`),
   per-kind body Converter registry, branded ids, `contentHash` via `Crc32`.
2. **Writable FileTree store.** `FileTreeMemoryStore` with `get`/`list`/`put`/
   `delete` over `IMutableFileTreeAccessors`. Filename↔id verification
   (`verifyFilenameId` pattern). Upsert-on-matching-`contentHash` dedup.
3. **Derived index + non-vector retrievers.** backlink + byTag index (rebuild via
   walk); `IMemoryRetriever` with recency, tag, link-traversal (one-hop + bounded
   BFS with cycle detection), and structured-filter retrievers. **No vectors yet.**
4. **Observation/audit.** Ring-backed observe packlet (clone of prompt-assist), so
   recall/write are auditable from day one.
5. **One real L2 proof.** A small `IAiClientTool` set (write/read/search/context)
   wired through `executeClientToolTurn` in a `samples/testbed` scenario — enough to
   prove the agent-curates-the-substrate loop end-to-end (the Scenario A path),
   NOT a full tool suite.

**Explicitly out of v0.1 (fast-follow / later, named so they don't gate):**
- `IVectorIndex` + minimal cosine impl + semantic retriever (fast-follow #1; the
  seam — `embeddingRef` field + interface — ships in v0.1 so it is non-breaking).
- Full L2 tool suite, MCP exposure via `adaptMcpTools`.
- L3 ingest pipeline (own stream).
- Temporal state-transition reasoning, deep multi-hop graph queries.
- `watch`/change-notification.
- Shared-core extraction with `ts-prompt-assist`.

Acceptance shape (when it becomes a real stream): `rushx build`/`lint`/`test` at
100% coverage; no `any`; all fallible ops return `Result<T>`; Converters/Validators
for all `unknown`→typed; the testbed scenario demonstrates store→link→retrieve and
audit end-to-end.

---

## 8. Open Questions register

Questions personaility's eventual ask will answer. Each notes why it should NOT be
pre-committed now.

- **OQ-1 — Build the minimal in-package vector index, or defer entirely?** The one
  genuine new-infra call. *Why not now:* the right answer depends on personaility's
  N (thousands → brute-force cosine is fine; millions → require an injected external
  index) and whether semantic recall is even in its first ask. Ship the
  `IVectorIndex` seam regardless; defer the impl decision to the consumer's scale.
- **OQ-2 — Should the writable FileTree store land in `ts-prompt-assist` too?** The
  prompt store stayed read-only at v0.1 by choice. *Why not now:* answering forces
  the §4 tension-4 extraction question prematurely. Let memory prove the writable
  pattern first; backport/extract later under lockstep (cheap).
- **OQ-3 — Where does L3 ingest live — own package, packlet, or never?** It is the
  novel/risky surface (classify/escalate/dedup/merge/provenance). *Why not now:*
  it must not gate the substrate, and its shape depends entirely on what raw
  "things" personaility ingests and its escalation budget. Map it (§2 Cognee
  pattern), build it on demand.
- **OQ-4 — How "graph" does personaility actually need?** Derived in-mem index
  covers tag + one-hop + bounded BFS. *Why not now:* only a real multi-hop /
  temporal-reasoning requirement justifies a heavier index, and that is a
  consumer-driven, non-breaking later addition behind the retriever.
- **OQ-5 — Scope/qualifier model: full ts-res, or lighter?** The prompt store uses
  ts-res candidate selection for conditional recall (per-tenant/lang/persona).
  *Why not now:* memory may need only flat scopes, or may need full
  qualifier-conditional recall — depends on whether personaility's memories vary by
  context axis. The seam (scope-encoded subtrees) is identical either way; the
  selection richness is deferrable.
- **OQ-6 — Per-kind write policy vocabulary (append-only / upsert / bounded-ring /
  immutable)?** *Why not now:* the set of kinds and their lifecycle is personaility's
  domain model. The substrate must support a *pluggable* per-kind policy (it does:
  `RetainingRingBuffer` for bounded-ring, upsert-on-hash for facts); the concrete
  vocabulary is the consumer's.
- **OQ-7 — Provenance/redaction policy for machine-made (L3) memories.** The
  observe pattern is most-permissive by design (stores bodies verbatim). *Why not
  now:* redaction + retention are deployment policy (per the prompt-assist
  precedent), and L3 provenance semantics depend on personaility's trust model for
  classifier- vs LLM- vs human-authored memories.
- **OQ-8 — Tool/MCP surface granularity (how many tools, what behavior hints).**
  basic-memory exposes ~15 tools; Letta fewer, higher-level. *Why not now:* tool
  granularity is an L2/agent-ergonomics decision that depends on personaility's
  agent design; the substrate is indifferent. Ship a minimal proof set first.
