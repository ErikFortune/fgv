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

## Durability — atomic record writes, one store per root

`FileTreeMemoryStore` writes each record file atomically whenever its root can,
so a crash mid-write leaves the previous record intact instead of a torn file
that fails the next open (with the default `onRecordError: 'fail'`, one torn
record would fail the whole open).

```ts
const store = FileTreeMemoryStore.create({ root, registry, codecs }).orThrow();
store.durability;
// { atomic: true, guarantee: 'process-crash', reason: 'ext2/ext3/ext4 on linux', removedTemporaries: [] }
```

- **The guarantee** is the strongest the root lists: `'process-crash'` on a
  qualified filesystem root (Linux, ext2/3/4 or tmpfs — see `@fgv/ts-json-base`),
  `'session'` on an in-memory tree. It is chosen once, at `create`.
- **A root that cannot write atomically** (an unqualified filesystem, or a custom
  `FileTree` without the capability) gets plain writes, with
  `durability.atomic: false` and the root's `reason`. To refuse such a root
  instead, pass `durability: { require: 'process-crash' }` (or `'session'`). A
  root whose capability inquiry *fails* — it does not exist, or it lies outside
  its accessors' tree — fails the open: only an answer degrades, never a refusal.
- **Symbolic links.** A root reached through a symbolic link is qualified as its
  target and works normally. A scope directory that *is* a symbolic link is
  refused: a filesystem listing does not show it, so no read, open walk or sweep
  could ever find a record written through it.
- **No silent fallback.** A later write that cannot honour the chosen guarantee
  — say a scope directory on another mount — fails; it is never retried as a
  plain write.
- **Uncertain outcomes are settled.** If the filesystem reports that the new
  file is already visible (`'replaced'`), the write is treated as committed and
  logged at `warn`. If the outcome is `'unknown'`, the store re-reads the file
  and reports what it actually holds, and the in-memory index follows. The one
  case it cannot settle — the re-read itself fails — is reported as a failure
  that says the file may hold either record; reopening the store settles it.
- **One store per root, per process.** Opening a second store on a root another
  store holds — or on a directory nested inside it, or containing it — fails
  until the first calls `dispose()` (also reachable as the optional
  `IMemoryStore.dispose`). The guard detects **the same accessor instance, or the
  same real filesystem directory**: two `getDirectory('/')` calls on one tree,
  two `FsTree`s over one directory, a symbolic-link alias. Two separate accessor
  objects over one non-filesystem backing store (two `localStorage` accessors on
  one key, say) cannot be told apart and are not detected. The real path is
  taken when the store opens, so retargeting a symlink afterwards is not
  tracked, and on a case-insensitive filesystem whose real path is not
  canonicalized, two case variants of one directory are not detected. A disposed store
  refuses writes, deletes and reconciles — including ones already queued, and
  vector adds whose embedding finishes after the dispose — and still reads, from
  what it last knew; once a new owner writes, those reads may be stale. This is
  an in-process guard only — one writer per root across processes remains the
  host's responsibility.
- **Interrupted writes are cleaned up.** At open, while holding the guard, the
  store removes working files that interrupted atomic writes left in its scope
  directories (those holding a record file) and lists them on
  `durability.removedTemporaries`, including the ones a partly-failed sweep did
  remove. A scope directory whose only content is an interrupted first write is
  swept by a later open, once it holds a record.
- **Multi-file operations are not atomic as a whole.** A versioned `put` writes
  the new version and then invalidates the previous current version; a
  cap-cull admission writes one record and deletes others. A crash between those
  writes leaves every file whole, and the next open copes: the highest `seq`
  wins current-version selection, and the next admission re-culls an exceeded
  cap.

## Conditional writes — `expected`

A read-modify-write loses a concurrent update unless the write can say what it
read. `put` and `delete` take an optional `expected`: the `envelope.seq` of the
record the caller read (for a versioned kind, the current version's), or
`'absent'` for "nothing there" (`put` only).

```ts
const read = (await store.get(kind, entityId)).orThrow();
const written = await store.put(revised, { expected: read?.envelope.seq ?? 'absent' });
if (written.isFailure()) {
  const detail = written.detail;
  if (detail?.code === 'conflict') {
    // Someone wrote since our read; nothing was written. `detail.current` is the seq found.
  } else if (detail?.code === 'duplicate') {
    // This content already exists as `detail.existingId`; nothing was written.
  }
}
```

- **Where the check runs.** Under the store's write lock, after the address
  resolves and **before any dedup** — so neither a content-dedup hit on another
  id nor a same-id no-op can mask a conflict. On a mismatch nothing is written,
  and the failed write is still observed.
- **Under `expected`, success means the addressed record was written.** On a
  `'content'`-scoped kind an unconditional `put` whose content already exists
  under another id succeeds by returning *that* record, unchanged. With
  `expected` the same put fails `duplicate`, naming `existingId`, and writes
  nothing. Without `expected` nothing changes.
- **What the token is.** `seq`, which the store issues strictly increasing and
  never twice. A derived-state rewrite (a reconcile restamp, a version
  invalidation) keeps it; any write that follows recomputes that state, so it
  cannot lose a caller's update. `contentHash` is not a token: it excludes tags
  and provenance and can recur.
- **Never re-issued, even across a restart.** The store persists a high-water
  mark in two root files, `memory-store.seq.a.json` and `memory-store.seq.b.json`,
  advanced (in blocks) before any `seq` it covers is used. Without it, deleting the
  highest record and reopening would re-issue that record's `seq`, and a stale
  writer holding it would pass. The two files are written alternately — each write
  to the missing, unreadable, or lower one, never the only good one — so a write
  torn by a crash on a root without atomic writes leaves the other intact, and the
  open takes the larger readable ceiling. A vault with neither opens as before and
  gains one on its first write. If they exist and neither reads, the open fails;
  deleting both lets it open, at the cost of the guarantee. A root *directory* with
  either name is refused. `seq` is therefore strictly increasing but **not
  dense**: a reopen resumes past the last reservation.
- **In-process only.** The guarantee holds among writers sharing one store
  instance per root — which the single-writer guard above enforces within a
  process. It is not fencing; a second process over the same storage is outside it.
- **Failures are classified.** `put` and `delete` return
  `MemoryWriteResult<T>`, a `DetailedResult` whose detail is an
  `IMemoryWriteFailure`: `conflict` (with `expected` and `current`), `duplicate`
  (with `existingId`), `invalid` (input refused before the vault was read),
  `rejected` (the write policy refused), `not-found` (a delete with no record), or
  `io`. Use `.asResult` to chain into plain `Result` code — **BREAKING:** a caller
  that chained a plain-`Result` continuation onto `put` / `delete` must add it.
- **One behaviour change without `expected`.** A flat `put` now reads its same-id
  record before content dedup, so a same-id file that cannot be read fails the
  put (`io`) even when its content exists under another id; before, such a put
  could succeed by deduping without reading its own file.
- **Embed hooks must not write to the same store.** `embed` and
  `fragmentEmbedder` run inside the write lock; one that awaits `put` / `delete`
  on that store waits on itself.
- **Ingest.** A `merge-into` writes under the `seq` its target entity had in the
  pre-ingest snapshot. If the target moved meanwhile, that candidate is reported
  with disposition `'conflict'` and its `conflict` detail; if its merged content
  already exists under another id, it is `'deduped'` with that record's id. The
  item still succeeds and nothing is retried.

## Conventions

`Result<T>` on every fallible operation; no `any`; Converters/Validators for
every `unknown` → typed boundary; branded ids; factory `create()` for fallible
construction. See the repository coding standards for the full set.

## License

MIT
