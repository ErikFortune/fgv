# State — `agent-memory-index-injection-seam`

Branch: `agent-memory-index-injection-seam` (off `origin/release`)

## Decisions

- **Param name: `index`.** Chosen over `memoryIndex` for two reasons:
  1. It matches the existing private plumbing exactly — `IInternalParams.index` and
     `FileTreeMemoryStore._index` are already spelled `index`, so the public param is a
     pass-through with zero rename churn in the constructor path.
  2. It matches the sibling naming convention in
     `IFileTreeMemoryStoreCreateParams`, which drops the domain prefix from the interface name
     (`registry: IBodyConverterRegistry`, `observers: IMemoryObserver[]`, `codecs: IIdentityCodec`).
     `IMemoryIndex` → `index` is the same transform. `vectorIndex` / `fragmentIndex` keep their
     qualifiers because they are *not* the store's index — they are separate, differently-shaped
     seams that need disambiguating from it.

## Progress

- [x] Branch created off `origin/release`
- [x] Brief written
- [x] `index?: IMemoryIndex` added to `IFileTreeMemoryStoreCreateParams` with the
      instrumentation-seam / non-guarantee TSDoc
- [x] `create()` resolves the injected index, defaulting to `MemoryIndex.create()`
- [x] Scenario tests (`src/test/unit/store/indexInjection.test.ts`)
- [x] `rushx build` / `rushx lint` / `rushx test`
- [x] `code-reviewer` on the diff (see result.md for outcome)
- [x] Coverage closure to 100%
- [x] `etc/ts-agent-memory.api.md` regenerated
- [x] Rush change file
- [x] Commit + push + PR
