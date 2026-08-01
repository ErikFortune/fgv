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

## Conventions

`Result<T>` on every fallible operation; no `any`; Converters/Validators for
every `unknown` → typed boundary; branded ids; factory `create()` for fallible
construction. See the repository coding standards for the full set.

## License

MIT
