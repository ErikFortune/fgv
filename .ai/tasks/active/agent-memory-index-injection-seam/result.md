# Result — `agent-memory-index-injection-seam`

## What shipped

One additive optional param on the public store factory:

```ts
FileTreeMemoryStore.create({ ..., index?: IMemoryIndex })
```

- **Omitted** → `MemoryIndex.create()`, byte-identical to prior behavior.
- **Supplied** → the store uses it for every index operation it performs and holds no
  second index.

Files changed:

| File | Change |
|---|---|
| `libraries/ts-agent-memory/src/packlets/store/fileTreeMemoryStore.ts` | `index?: IMemoryIndex` on `IFileTreeMemoryStoreCreateParams` + TSDoc; `create()` now routes through a new private `_resolveIndex(params.index)` instead of calling `MemoryIndex.create()` directly |
| `libraries/ts-agent-memory/src/test/unit/store/indexInjection.test.ts` | new — 8 scenario tests |
| `libraries/ts-agent-memory/etc/ts-agent-memory.api.md` | regenerated (one added line) |
| `common/changes/@fgv/ts-agent-memory/agent-memory-index-injection-seam_2026-07-31-12-00.json` | rush change file (`minor`) |

`IMemoryIndex`'s method signatures and return types are untouched, as scoped.

## Param name: `index`

Two reasons, over `memoryIndex`:

1. It matches the existing private plumbing exactly — `IInternalParams.index` and
   `FileTreeMemoryStore._index` were already spelled `index`, so the public param is a
   pass-through with zero rename churn in the constructor path.
2. It matches the sibling naming convention in `IFileTreeMemoryStoreCreateParams`, which
   drops the domain prefix from the interface name: `registry: IBodyConverterRegistry`,
   `observers: IMemoryObserver[]`, `codecs: IIdentityCodec`. `IMemoryIndex` → `index` is
   the same transform. `vectorIndex` / `fragmentIndex` keep their qualifiers precisely
   because they are *not* the store's index — they are separate, differently-shaped seams
   that need disambiguating from it.

## The non-guarantee is in the TSDoc

Confirmed present on `IFileTreeMemoryStoreCreateParams.index`, in a dedicated `@remarks`
block, opening with the bolded sentence:

> **This is an instrumentation seam, NOT a resident-memory fix.**

and stating in full that it does not lower the resident-memory ceiling, that a "persisted"
or "lazy" index will not change that, why (`entries()` yields `IIndexedMemoryRecord`s and
`byKind` / `byTag` / `byRecency` / `byRank` yield `{ envelope, body }` pairs with the body
materialized, so any conforming implementation must be able to produce every body), the
formulation *"an injected index changes WHERE records come from; it does not change WHETHER
bodies are held"*, and that lowering the ceiling requires a separate, breaking, design-first
partial-read redesign of `IMemoryIndex` itself.

The intended use (decorating the shipped `MemoryIndex` to count/time calls so a redesign
decision is driven by measurement rather than estimate) is stated immediately above it.

## Tests

`src/test/unit/store/indexInjection.test.ts`, 8 scenarios:

**Default path (index omitted)**
1. Creates and serves `list` / `get` / `listScoped` from a default `MemoryIndex`.
2. Reopening an existing vault re-indexes it and resumes `seq` past the persisted
   high-water mark.

**Injected path** — via `RecordingMemoryIndex`, a faithful delegating decorator over the real
`MemoryIndex` that records calls (deliberately the exact shape the consumer intends to build):
3. The injected index receives the `create()` `rebuild` of an existing vault, exactly once,
   with both persisted records — and no `patch`.
4. It receives a `put` patch, a second `put` patch on a same-id revision, and a `delete`
   patch, each with the right `(op, scope, id)`.
5. It serves the store's read surface (`entries()` call count rises across `list` /
   `listScoped`), and its projection views — `byKind` / `byTag` / `byRecency` / `byRank` /
   `backlinks`, none of which the store itself calls — answer from the patched state,
   proving no second index exists.
6. A `RecencyRetriever` built over the *same* instance sees the store's records — the
   consumer's real pattern (store maintains, retrievers read).
7. Via `HidingMemoryIndex` (filters `entries()`): the injected index, not a private one,
   determines what `list` / `listScoped` return, while `getById` still reads through to the
   FileTree — the source of truth is unaffected.
8. An index that reshapes `entries()` changes **write** semantics too: an A/B against the
   default index shows content-hash dedup collapsing a same-body new id under the default
   index but *not* under the hiding index.

Test 8 and the caveat paragraph it evidences came out of the review pass (below).

## Gates

| Gate | Status |
|---|---|
| `rushx build` | pass |
| `rushx lint` | pass (clean) |
| `rushx fixlint` before final commit | run; no changes produced |
| `rushx test` | 687 pass / 0 fail |
| Coverage | 100% statements / branches / functions / lines |
| No `any`; fallible ops return `Result<T>` | yes — `_resolveIndex` returns `Result<IMemoryIndex>`; test-only branded casts (`as Kind` / `as EntityId` / `as MemoryId` / `as Tag`) are the sanctioned pattern |
| `etc/ts-agent-memory.api.md` regenerated | yes (one added line) |
| Rush change file | yes |

Coverage was 100% without a coverage-closure pass — no `c8 ignore` directives were added
and no coverage-driven tests were written. Scenario tests were written first, per the
required ordering.

## Review pass

**No agent-spawn tool was available in this session** — there is no `Task`/subagent tool in
this agent's toolset, so the `code-reviewer` sub-agent could not be commissioned. Per the
brief's process note I did not block on it. I ran the review myself against
`CODE_REVIEW_CHECKLIST.md` on the final diff. Findings:

- **P1 — none.** No `any`; no manual type-check-then-cast; no double casts; the one new
  fallible helper returns `Result<T>`; no `orThrow()` outside test setup.
- **P2 — one found and fixed (doc accuracy).** My first TSDoc draft enumerated the store's
  index consumers as "`rebuild`, `patch`, and every `entries()` read behind `list` /
  `listScoped` / the keyed temporal reads." Walking that back against the implementation
  showed the enumeration was incomplete in a *material* way: `_admissionCohort` (write-policy
  admission) and `_findByContentHash` (content-hash dedup) also read `entries()`, so an
  injected index that reshapes `entries()` changes write semantics, not merely read results.
  Fixed by restructuring the paragraph into an explicit bulleted list of all three operation
  categories (naming dedup + admission), adding a caveat paragraph on why only a faithful
  delegating decorator is safe, and noting that `get` (flat) / `getById` go to the FileTree
  rather than the index. Test 8 was added to evidence the claim rather than assert it in
  prose only.
- **P3 — none outstanding.** All `{@link}` targets are same-package exports
  (`MemoryIndex`, `IMemoryIndex`, `IIndexedMemoryRecord`, `IMemoryStore.*`,
  `IFileTreeMemoryStoreCreateParams.index`), so no `ae-unresolved-link` warning is baked
  into `etc/*.api.md` — confirmed by a clean api-extractor run.

**This should be treated as a self-review, not an independent `code-reviewer` pass.** If the
orchestrator wants the independent layer-1 pass on record, it should commission
`code-reviewer` against the PR diff before merging.

## Notes for the orchestrator

- The concurrent vector stream will also regenerate `etc/ts-agent-memory.api.md`. My change
  there is a single added line (`readonly index?: IMemoryIndex;` inside
  `IFileTreeMemoryStoreCreateParams`); resolve by rebuilding at integration as planned.
- Nothing was touched under `src/packlets/vector/**`, `libraries/ts-extras/**`, `samples/**`,
  `docs/WORKSTREAMS.md`, or `docs/STATUS.md`.
- Copilot review loop (layer 2) not driven — PR opened, not merged, per the brief.
