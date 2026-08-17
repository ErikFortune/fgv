# Stream brief — `agent-memory-index-partial-read`

**Status: QUEUED 🟢 — ready to start.** Filed 2026-08-15, immediately after
`vector-rebuild-report-by-kind` shipped, so the queue entry has a directory before the ledger's
next reconciliation.

**Shape: design-first, then breaking.** `@fgv/ts-agent-memory`. **Do not start implementing.** The
first deliverable is a design doc; the second is a decision on it; the third is code.

## The problem in one sentence

`FileTreeMemoryStore` holds every record body resident, and the seam that was supposed to be the
fix is not one.

## Why this needs a stream, and why the obvious reading is wrong

`agent-memory-index-injection-seam` (#582) added `index?: IMemoryIndex` to the store's create
params. That is easy to read as the resident-memory fix. It is not, and
`LIBRARY_CAPABILITIES.md` says so in as many words:

> *"This is an instrumentation seam, not a resident-memory fix — `IMemoryIndex`'s read surface
> returns whole records by construction, so any conforming index still materializes every body."*

An injected index changes **where** records come from, not **whether** bodies are held. Look at the
contract (`libraries/ts-agent-memory/src/packlets/index/memoryIndex.ts`) and the ceiling is
structural, not an implementation choice:

```ts
entries(): ReadonlyArray<IIndexedMemoryRecord>;          // whole records
byKind(kind: Kind): ReadonlyArray<IMemoryRecord<unknown>>;
byTag(tag: Tag): ReadonlyArray<IMemoryRecord<unknown>>;
byRecency(): ReadonlyArray<IMemoryRecord<unknown>>;
byRank(): ReadonlyArray<IMemoryRecord<unknown>>;
```

Every read returns `IMemoryRecord<unknown>`, and `IMemoryRecord` carries `body`. There is no
projection, no id-only view, and no laziness anywhere on the surface — so a conforming index that
wanted to hold less **could not**, because it has to be able to answer these calls. **The ceiling
is in the contract, so only a contract change moves it.**

That is the whole justification for the stream. A patch cannot do this.

## Mission

Lower `FileTreeMemoryStore`'s resident-memory ceiling **for real**, rather than making it
measurable.

Concretely: let the index answer filtering, ordering and cohort selection **without materializing
every body**, and fetch bodies on demand.

## Deliverable 1 — a design doc, before any code

Write it to `.ai/tasks/active/agent-memory-index-partial-read/design.md`. It must answer these,
and the last two are the ones that will sink a naive design:

**a. What the partial read returns.** An id-plus-metadata projection? A lazy record whose `body` is
a thunk? A separate `IMemoryIndexEntryRef` type alongside the existing one? Name the alternatives
and pick, with reasons — this repo's convention is that a considered-and-rejected option is more
useful than silence.

**b. Who fetches the body, and through what.** The store owns the `FileTree`; the index does not,
and must not start to. If the index hands back references, something has to resolve them, and the
obvious candidate (a resolver callback injected at index construction) puts store I/O behind an
interface the store also injects — say explicitly whether that is acceptable or a cycle in
disguise.

**c. The write path, which reads the index too.** This is the long-fuse regression. All of these
derive from the index today, and a read surface that serves retrieval while starving them is
broken in a way tests aimed at retrieval will not catch:

- content-hash dedup on every `put`
- write-policy admission cohorts (`MemoryCapCullPolicy` cap-cull over the `(scope, kind)` cohort)
- the temporal versioned put/delete paths, which derive an entity's version history from the index

Check each against the shipped source rather than against this list — the list is a starting point,
not an audit.

**d. What replaces the "faithful delegating decorator only" rule.** The current guidance exists
because a **reshaping** index changes write semantics — what a versioned `put` treats as current,
what cap-cull evicts — not merely what reads return. If the read surface is redesigned, that rule
either still holds in a new form or is replaced by something stronger. It cannot simply be dropped;
the reason it was written does not go away.

**e. What "lowered" means, measured.** State the metric and the harness before implementing, or the
stream will end with a plausible-sounding claim nobody checked. A vault-scale fixture with a
measured before/after is the deliverable; "the bodies are no longer held" is not.

## Deliverable 2 — the implementation, after the design is accepted

Breaking on `IMemoryIndex` and on anything implementing it. `@fgv/ts-agent-memory` is pre-1.0 with
a no-shim posture, so no compatibility layer — but see coordination below.

## Explicitly NOT in scope

- **Persisting the index.** The FileTree is the source of truth and the index is rebuilt on
  `create()`. Changing that is a different, larger stream.
- **The vector or fragment indexes.** `IVectorIndex` / `IFragmentVectorIndex` are separate seams
  with their own memory profile. Untouched here.
- **A cache eviction policy.** If bodies are fetched on demand, whether to cache them and with what
  policy is a follow-on question. Say so in the design; do not build it.

## Coordination

PersonAIlity implements against `IMemoryStore` and reads `LIBRARY_CAPABILITIES.md`; whether they
implement `IMemoryIndex` themselves is **not known from inside this repo and must be asked before
the breaking change lands**, not after. The capabilities doc currently tells them an injected index
is safe only as a faithful delegating decorator, which is the shape most likely to break.

Their bump tooling takes the whole `@fgv` set at once, so a breaking seam change arrives with
everything else and gets discovered by a red build rather than by reading. Same handling as
`vector-rebuild-report-by-kind`: a note in `.ai/notes/cross-repo-handoffs/`.

## Carried forward from the predecessor — do not lose

#582's `result.md` records that its review was a **self-review, not an independent `code-reviewer`
pass** (that session had no agent-spawn tool) and asks the orchestrator to commission one. Whether
that ever happened is not determinable from inside this repo. This stream touches the same surface
and should either commission that pass over #582's diff or record why it declined to.

## Gates

- [ ] **Design doc reviewed and accepted before implementation starts** — this is the gate that
      makes it a design-first stream rather than a stream with a design doc in it
- [ ] A measured before/after on a vault-scale fixture, per deliverable 1(e)
- [ ] `rushx build` / `rushx lint` / `rushx test` green, 100% coverage
- [ ] Repo-wide `rush rebuild` — this changes a shared contract, and test doubles in `samples/` and
      `tools/` are the usual casualty. On the immediately-preceding stream this caught a fake index
      in `samples/testbed` that neither library's own suite could see.
- [ ] Change file for every touched package; `rush change --verify --target-branch origin/release`
- [ ] Tests prove the **write** paths (dedup, admission cohort, temporal versioning) still behave,
      not only the retrieval paths
- [ ] `LIBRARY_CAPABILITIES.md` updated in the same PR — specifically the sentence quoted at the
      top of this brief, which becomes false the moment this ships
- [ ] `code-reviewer` on the final diff before first push
- [ ] Cross-repo note written before the alpha carrying it goes out
