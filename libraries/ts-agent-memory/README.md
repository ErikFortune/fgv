# @fgv/ts-agent-memory

A FileTree-backed storage and retrieval substrate for agent memory and
knowledge. It owns persistence, identity, typed per-kind bodies, attributed
edges, content-hash dedup, and the optional-layer seams (vector / temporal /
observe). It owns none of a consumer's processing, transformation, or
composition logic.

> **Status:** under active development. The package is being built
> knowledge-first. The surface listing below covers the foundational type model
> and converters; the store, index, retrieval, observe, and vector layers ship
> alongside them and are not itemized here.

## Foundational surface

### `types` packlet

- **Branded ids** — `MemoryId`, `EntityId`, `Kind`, `Tag`, `MemoryScopeKey`,
  `LinkType`, plus the `Convert` converter constants.
- **Envelope model** — `IMemoryEnvelope`, `IEdge`, `IProvenance`,
  `ITemporalBlock`, `IMemoryRecord<TBody>`.
- **Identity codec** — `IIdentityCodec` (domain key ⇄ `{ scope, idStem }`,
  deterministic and reversible) and `KnowledgeIdentityCodec`.
- **Write policy** — `IWritePolicy`, `AdmissionDecision`, and the
  last-write-wins `KnowledgeLwwPolicy` (RFC-7386 JSON Merge Patch over the
  declared mutable fields).

### `converters` packlet

- **`IBodyConverterRegistry` / `BodyConverterRegistry`** — per-kind body
  Converter registry (`register`, `registerSchema`, `has`, `getConverter`,
  `convert`).
- **Envelope converters** — `envelopeConverter` (object) /
  `envelopeYamlConverter` (YAML frontmatter), plus the `splitFrontmatter` /
  `joinFrontmatter` / `parseMemoryFile` / `serializeMemoryFile` helpers for
  the `---\n<yaml>\n---\n<body>` memory-file format.

## Record updates — the merge contract

When a `put` targets an `entityId` that already exists, the write is an
**update**, not a replace. The store projects the incoming record's mutable
fields into a patch and hands it to the kind's `IWritePolicy.applyUpdate`, which
applies it as an **RFC-7386 JSON Merge Patch** over the policy's declared
mutable surface. This is a **pinned contract**, not an artifact of the current
merge configuration — the shipped policies compose `@fgv/ts-json`'s `JsonEditor`
with `{ nullAsDelete: true, arrayMergeBehavior: 'replace' }` specifically to get
RFC-7386 semantics, and `applyUpdate` documents them as the interface contract.

Within the policy's declared mutable surface:

- **Objects merge per key.** Keys you supply overwrite; keys you omit are
  **preserved**, not dropped. An update that sets one provenance field leaves
  every sibling field intact.
- **An explicit `null` on a sub-key clears that sub-key.** This is the
  sanctioned way to remove a single key from a nested object such as
  `provenance`. The cleared key is gone from the persisted record and does not
  reappear on reload.
- **Arrays replace wholesale.** `tags` and `links` are not element-merged.
- **A whole-block `null` on a required field is rejected loudly**, never
  silently accepted. `body`, `tags`, `links`, and `provenance` are required; a
  patch that deletes one fails with
  `... merge patch may not delete required field(s): <names>`. (`embeddingRef`
  is optional and *may* be cleared by a `null`, which restores it to absent
  rather than to `null`.)
- **Keys outside the mutable surface are ignored.** Identity and
  transaction-time envelope fields (`id`, `entityId`, `kind`, `created`,
  `updated`, `seq`, `contentHash`) are preserved verbatim; the store stamps
  `updated` / `seq` / `contentHash` on write.

### `provenance` is on the pinned surface

`KnowledgeLwwPolicy` and `TemporalVersionedPolicy` both hard-code their mutable
surface as `['body', 'tags', 'links', 'provenance', 'embeddingRef']`. For those
policies the guarantees above apply to `provenance` specifically: per-key merge,
sub-key clearing via `null`, and loud rejection of a whole-block delete are all
part of the contract and are pinned by tests.

```ts
// existing.envelope.provenance: { source: 'agent', confidence: 0.9, note: 'stale' }

// clear one sub-key; siblings survive
policy.applyUpdate(existing, { provenance: { note: null } });
// => provenance: { source: 'agent', confidence: 0.9 }

// revise one sub-key; siblings survive
policy.applyUpdate(existing, { provenance: { confidence: 0.5 } });
// => provenance: { source: 'agent', confidence: 0.5, note: 'stale' }

// delete the whole block — rejected, not silently accepted
policy.applyUpdate(existing, { provenance: null });
// => Result.fail('knowledge LWW: merge patch may not delete required field(s): provenance')
```

Going through the store rather than calling a policy directly, the same three
cases are expressed as the `provenance` value on the record you `put`: include a
key to set it, set a key to `null` to clear it, and omit a key to leave it
alone. A whole-block delete is not expressible there at all —
`IMemoryEnvelope.provenance` is non-nullable and `envelopeConverter` rejects
`null` — so that case fails at the converter instead of at the policy. Either
way it fails loudly.

### The surface is policy-dependent

`MemoryCapCullPolicy` takes its `mutableFields` from the caller, so **what it
guarantees depends on what you declared**. A field you did not declare mutable
is not merged at all: patch keys naming it are dropped before the merge runs, so
a `null` on it neither clears anything nor raises an error — it is simply inert,
and the existing value is preserved verbatim. If you want the guarantees above
for `provenance` under a cap-cull policy, `provenance` must appear in the
`mutableFields` you pass to `MemoryCapCullPolicy.create`.

## Dedup granularity — `dedupScope`

Each kind's `IWritePolicy` declares the granularity at which a write
deduplicates against the existing vault:

- **`'content'`** — scope-wide, cross-id. An identical body anywhere in the
  scope, even under a different entity, is the same record. The knowledge
  family (`KnowledgeLwwPolicy`) uses this.
- **`'entity'`** — same-entity only. An identical re-put of one entity is a
  no-op, but two *distinct* entities with coincidentally-identical bodies both
  persist. `MemoryCapCullPolicy` and `TemporalVersionedPolicy` declare this, so
  every experience and versioned kind gets it.

Read the effective value for a kind through **`IMemoryStore.dedupScopeFor(kind)`**.
That accessor is the single owner: it resolves the registered policy, the store's
default policy, the policy's declaration, and finally `DEFAULT_DEDUP_SCOPE` — and
the store's own write path reads through it too, so nothing can drift out of
agreement with it.

> **Careful:** `DEFAULT_DEDUP_SCOPE` is `'entity'`, but it is only reached when a
> policy declares no `dedupScope`. A kind with **no registered policy** falls back
> to the store's default policy — a `KnowledgeLwwPolicy`, which declares
> `'content'` explicitly. So an unpoliced kind gets `'content'`, not `'entity'`.

### ⚠️ Behavior change: ingest now honors `dedupScope`

**This changes results for existing hosts, deliberately, with no opt-in flag.**

The ingest orchestrator's stage-4 layer-1 exact match previously ignored
`dedupScope` entirely and always behaved as `'content'` — the declaration was
dead code on that path. It now honors the declaration, so:

- A kind declaring **`'entity'`** (i.e. anything using `MemoryCapCullPolicy` or
  `TemporalVersionedPolicy`) **no longer collapses two distinct entities that
  share a byte-identical body** during `ingestItem` / `ingestBatch`. Candidates
  that used to come back `deduped` now come back `written`, and the records
  genuinely persist. If your vault silently lost turns whose summaries happened
  to match, it will stop doing that.
- A kind declaring **`'content'`** is unchanged.
- A kind with **no registered policy** is unchanged (it resolves to `'content'`,
  as above).

This is the intended fix, not a regression: the same declaration already governed
the direct `put` path, and the two paths disagreeing was the bug. It is not
flagged, because a flag would preserve the disagreement.

Independently of `dedupScope`, a `duplicate-of` collapse no longer orphans
sibling edges. An edge built against a collapsed candidate is **redirected** to
the record that candidate collapsed into, instead of failing the entire ingest
item. This also fixes `'content'` kinds, where the collapse is correct but the
ingest still should not fail.

See `.claude/project/agent-memory-ingest-design.md` §1 and §3 for the full
treatment.

## Conventions

`Result<T>` on every fallible operation; no `any`; Converters/Validators for
every `unknown` → typed boundary; branded ids; factory `create()` for fallible
construction. See the repository coding standards for the full set.

## License

MIT
