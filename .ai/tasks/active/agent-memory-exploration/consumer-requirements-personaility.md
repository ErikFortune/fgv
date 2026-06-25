<!--
Provenance: authored by the PersonAIlity side and delivered to the fgv team on
2026-06-25 as the consumer ask for @fgv/ts-agent-memory. Captured verbatim into
the agent-memory-exploration substrate by FGV Orchestrator IV. This is the
grounding contract for the commission; the companion rationale is in
consumer-assessment-personaility.md.
-->

# `@fgv/ts-agent-memory` — requirements spec (commission from PersonAIlity)

> **Status**: requirements for commission. Authored 2026-06-25 by the PersonAIlity side for the fgv team.
> **Origin**: fgv PR #495 (`@fgv/ts-agent-memory` design spike, design-only) + the PersonAIlity
> architecture assessment in `ts-agent-memory-assessment-2026-06-25.md` (this dir).
> **Asking party**: PersonAIlity (the first consumer). The substrate is intended app-agnostic; this spec
> states what PersonAIlity needs so the contract is grounded in a real consumer.

## 1. What we're commissioning

A reusable `@fgv/*` package providing a **storage + retrieval substrate for agent memory and
knowledge** — the durable, app-agnostic foundation a consumer builds its memory/knowledge subsystem on.
It owns persistence, identity, typed bodies, attributed edges, dedup, and the optional-layer seams. It
owns **none** of the consumer's processing, transformation, or composition logic (see § 6 Non-goals).

PersonAIlity will consume it behind our existing seams: a knowledge vault behind
`IKnowledgeSearchProvider`, and (later) the long-term/medium-term stores behind our memory accessors.
Our curator pipeline, three-tier processing, working-memory composition, sentiment/epistemic model,
mnemonic/recall, and actor scoping all remain ours and layer on top.

## 2. Core model (the invariant nucleus)

1. **Typed identity envelope** — every record carries entity identity, a version/kind discriminator,
   and transaction-time metadata. (See § 5 OQ-11 — the entity-id-vs-version question must resolve.)
2. **Typed per-kind body** — each memory *kind* registers its own validated body shape (a Converter),
   not a generic blob. Two kind families at minimum: **knowledge** and **experience** (distilled).
3. **Attributed edges** — links between records carry kind, confidence, provenance, and (opt-in)
   validity metadata. Not bare string references.
4. **FileTree-backed writable store** — persistence via `FileTree` (`@fgv/ts-json-base`), yielding a
   human-readable markdown-plus-frontmatter vault (git-trackable, snapshot-friendly).
5. **Content-hash deduplication** — duplicate detection on write across both kind families.
6. **Optional layers as seams (not required for v1, but the seams must exist)** — vector index
   (in-package cosine/top-k acceptable; no external ANN required), bi-temporal tracking (opt-in per
   kind), observation/audit trail, qualifier-based recall. Each degrades loudly when unwired.

## 3. Required interfaces & contracts

1. **Envelope identity** — a stable entity-id model that accommodates a consumer whose records are
   addressed by a domain key (PersonAIlity: medium-term entries keyed by `(conversationId, turnIndex)`;
   long-term entries keyed by `conversationId`). We must be able to express "this record's stable
   identity is its domain address" without minting a separate meaningless UUID. **Blocked on OQ-11.**
2. **Per-kind body registration** — register a TypeScript type as a named kind's body, validated via a
   `@fgv/ts-utils` Converter. PersonAIlity will register at least `IKnowledgeDoc`,
   `ISummarizedTurnMemory`, `ISummarizedConversationMemory`. Type-safe (no `any` in the body).
3. **Write API** — all writes return `Result<T>` from `@fgv/ts-utils`. No thrown exceptions in
   business logic.
4. **Read/query API** — keyed lookup by entity id (`Result`-returning) + a query over a kind's metadata
   fields. v1 retrieval may be substring/keyword; the interface must admit a future
   semantic/embedding implementation **without resignature**.
5. **Attributed edges** — write an edge between two records carrying: source id, target id, edge kind
   (open string, not a closed enum), confidence (0..1), provenance (text), validity markers (opt-in).
   Cycle-safe. (PersonAIlity's LTM→MTM `IMtmRef` becomes an attributed edge.)
6. **Content-hash deduplication** — duplicate detection on write (same kind + same body hash) returns
   the existing record rather than creating a duplicate. Deterministic, stable hashing; composable with
   `@fgv/ts-utils` `Hash.Crc32Normalizer`.
7. **FileTree-backed storage** — the backend implements `FileTree` from `@fgv/ts-json-base`, never node
   `fs` directly. Markdown + YAML frontmatter is the required on-disk format (interop with our
   snapshot-export/import).
8. **Per-kind write policies** — pluggable policy interface; the consumer injects admission
   (cap-cull-oldest for memory, last-write-wins for knowledge), a mutable-field declaration (our
   `mutableMemoryFields`), and update semantics (JSON Merge Patch for memory fields).
9. **No `any`** — non-negotiable. No production cast to `unknown` as a workaround. Per-kind bodies are
   typed through registration.

## 4. Guarantees required (all PersonAIlity critical conventions)

- `Result<T>` returns on every fallible operation (never throw in business logic).
- Converter-based validation at every type boundary (no manual `typeof`/`in` checks).
- FileTree-based I/O (no direct `fs`).
- No `any` anywhere in the public API or implementation.

## 5. Open question we need fgv to resolve first (blocking for memory adoption)

**OQ-11 — entity-id vs. version** (the PR's own "consequential one"). The envelope's identity model
determines whether our `(conversationId, turnIndex)` MTM addressing and `conversationId`-keyed LTM fit
directly, or require a wrapper / id migration. We cannot finalize the registration of our memory bodies
until this resolves. (Knowledge adoption — § 7 — is less exposed to this, since knowledge docs already
have their own doc ids.)

## 6. Explicit non-goals (must stay out of fgv — PersonAIlity owns these)

- The three-tier progressive-compression pipeline (short→medium→long, eviction, queue, conversation-end
  flush) — our processing model.
- The curator framework (dispatch, `brainRef` resolution, per-task routing) — our transform layer that
  *produces* the bodies fgv stores.
- Working-memory composition (`IWorkingMemory`, `IMemoryContributor`) — our prompt-assembly layer.
- Sentiment / epistemic domain model (`ISentiment`, `IEpistemic`) — fgv stores these as opaque payload
  within a per-kind body; it does not interpret them.
- Mnemonic / `recall` system — our recall UX on top of storage.
- Actor / presence scoping — we layer this at the access boundary; the vault is actor-agnostic.
- Prompt library integration, and the measurement/evaluation framework — ours.

## 7. PersonAIlity adoption plan (informational — shapes priorities, not fgv's build)

- **Knowledge first.** Our stream-3 knowledge store independently converged on exactly this vault model;
  it's the highest-fit, lowest-risk adoption, behind `IKnowledgeSearchProvider`. If fgv ships before we
  implement stream-3 we use it directly; otherwise we build bespoke-but-compatible and migrate.
- **Memory later.** After our LTM tranche + backfill harness land (the backfill harness is the
  migration tool) and after OQ-11 resolves. Our LTM/MTM body shapes become the registered per-kind
  bodies; nothing above the storage seam changes.
- The side-chats→familiar arc is unaffected and proceeds independently.

## 8. v1 acceptance criteria

- Both kind families registerable from one FileTree vault, bodies Converter-validated, no `any`.
- Keyed read + metadata query (`Result`-returning), retrieval interface stable against a future
  semantic backend.
- Attributed-edge write (cycle-safe) + content-hash dedup on write.
- Pluggable per-kind write policy accepting our admission + mutable-field + merge-patch needs.
- All public surface returns `Result`, validates via Converters, does I/O through FileTree.
- OQ-11 resolved with a documented mapping for domain-keyed identity.
