# @fgv/ts-agent-memory

A FileTree-backed storage and retrieval substrate for agent memory and
knowledge. It owns persistence, identity, typed per-kind bodies, attributed
edges, content-hash dedup, and the optional-layer seams (vector / temporal /
observe). It owns none of a consumer's processing, transformation, or
composition logic.

> **Status:** v0.1, under active development. The package is being built
> knowledge-first. This tier (B0) ships the foundational type model and
> converters only — no store, index, retrieval, observe, or vector code yet.

## B0 surface (this tier)

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

## Conventions

`Result<T>` on every fallible operation; no `any`; Converters/Validators for
every `unknown` → typed boundary; branded ids; factory `create()` for fallible
construction. See the repository coding standards for the full set.

## License

MIT
