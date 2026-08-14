# Tech Debt — fgv

Already-shipped imperfections. Priority-ranked; addressed
opportunistically when the right surface area is touched.

---

## Priority key

- **P1** — blocking / structural; address before resuming major feature work.
- **P2** — fix before the next major feature in the affected area.
- **P3** — opportunistic cleanup.
- **P4** — doc / minor consistency.

## Entry format

```markdown
- **[Pn] Title.**
  Description with file pointers.

  **Trigger**: when this should be addressed.

  **Scope sketch**: one-paragraph fix shape.

  **Not a P(n+1)**: why this priority and not lower.

  **Reference**: PR / commit / session context that surfaced it.
```

---

## P1 — Blocking

*(none currently outstanding — the `ts-prompt-assist` validator-chain caller-controlled `T` cluster was fully retired by the surface-tidy round, which split `resolveAndValidateOutput<T>` into `resolveJsonOutput<K>` + `resolveFreeTextOutput` and replaced the remaining caller-asserted-`T` boundary with a runtime-evidenced kind check.)*

## P2 — Fix before next major feature in affected area

- **[RESOLVED] `@fgv/ts-agent-memory` `IProvenance.derivedFrom` carries the same latent bare-id ambiguity that scope-qualified edges just fixed.** *(fully resolved by the `agent-memory-scoped-finish` follow-on — see the two RESOLVED markers below; the historical context is retained.)*
  The scoped-edge-targets change (`IEdge.target: MemoryId → IEdgeTarget`) made every attributed edge unambiguous across scopes, and threaded the same `(scope, id)` fix through backlinks, link traversal, the ingest cycle guard, and the ingest edge-validation path. `IProvenance.derivedFrom` (`libraries/ts-agent-memory/src/packlets/types/envelope.ts`) remains a bare `MemoryId` and shares the identical root cause: per-scope codecs (e.g. the MTM codec's `turn-<n>` stems) legally reuse a stem across scopes, so a bare `derivedFrom` id is ambiguous. It is **not dereferenced anywhere today** — the ingest pipeline only stamps it from `IIngestItem.sourceId` and never resolves it back to a record — so there is no live correctness bug, only a latent one that would surface the moment a consumer tries to walk the provenance spine by id.

  **RESOLVED (vector/similarity + entity-resolution half):** the vector/similarity path is now scope-qualified — `IVectorIndex.add`/`remove` take an `IEdgeTarget`, `IVectorQueryHit` carries a `target: IEdgeTarget`, `InMemoryCosineIndex._vectors` keys by `edgeTargetKey(target)` (storing the target as the value), `IEntityResolutionCandidate.id → target: IEdgeTarget`, and `ResolutionVerdict`'s three target-bearing arms are `target: IEdgeTarget`. The orchestrator's bare `_indexById`/`byId` snapshot index was removed entirely; the verdict/similarity lookups now route through the same scope-qualified `byKey` view (keyed by `edgeTargetKey`) that the edge path already used, and the store threads the write/delete/cap-cull-evict scope through `_embedOnWrite` / `_removeVectorBestEffort`. `IMemoryRecordSource.list()` now yields `IScopedMemoryRecord` so a whole-vault `rebuild` re-indexes on the scoped key too. Landed as the `agent-memory-scoped-vectors` follow-on (breaking on the pre-1.0 `IEntityResolver` host contract, consistent with the no-shim posture).

  **~~New follow-up (store scoped-`list()` gap)~~ — RESOLVED (`agent-memory-scoped-finish`):** the gap was: `IMemoryRecordSource.list()` returns `IScopedMemoryRecord[]`, but `IMemoryStore.list()` returned bare `IMemoryRecord[]`, so the store did not *structurally* satisfy `IMemoryRecordSource` and `InMemoryCosineIndex.rebuild` (zero non-test callers) could not be wired to a real store. Closed via **option (b) — additive, no disturbance to `list()`:** `IMemoryStore` gained `listScoped(): Promise<Result<ReadonlyArray<IScopedMemoryRecord>>>` (whole-vault, no filter — a direct projection over the derived index's already-carried `IIndexedMemoryRecord.scope`) plus `asRecordSource(): IMemoryRecordSource` (a thin adapter whose `list()` delegates to `listScoped()`). `list(filter?)` keeps returning bare records (the ergonomic query surface, 1 production + ~20 test consumers) — retyping it (option a) would have churned every consumer and muddied the filtered-query return with rebuild-oriented scope addresses. A real `FileTreeMemoryStore` now drives `InMemoryCosineIndex.rebuild(store.asRecordSource(), embed)`, re-indexing on the scoped `(scope, id)` key (two same-stem records in different scopes index as distinct vector entries).

  **~~Still deferred (`derivedFrom` half)~~ — RESOLVED (`agent-memory-scoped-finish`):** `IProvenance.derivedFrom` promoted from bare `MemoryId` to `IEdgeTarget`; `IIngestItem.sourceId` promoted likewise (a breaking change on the pre-1.0 host ingest contract — the host now supplies a scope-qualified `sourceId`, no shim); the ingest stamping site (`orchestrator._buildRecord`) threads the scoped target through unchanged; and the envelope frontmatter converter serializes `derivedFrom` as the nested `{ scope, id }` object (mirroring `edgeConverter.target`), round-tripped by `edgeTargetConverter`. A same-stem-different-scope `derivedFrom` round-trips to its own scoped ref; a bare-scalar or missing-`scope`/`id` `derivedFrom` is rejected.

  **Reference**: the `agent-memory-scoped-edges` stream (scope-qualified `IEdge.target`) deferred both halves; the `agent-memory-scoped-vectors` stream resolved the vector/verdict half; the **`agent-memory-scoped-finish`** stream resolved the remaining `derivedFrom` half and the store scoped-`list()` gap, completing the scope-qualified-addressing migration.

- **[P2] `ts-prompt-assist` (and adjacent `ts-res` qualifier surface) needs an API documentation pass once the v0.1 surface settles.**
  PR #380 review surfaced that the recently-extended `ts-prompt-assist` surface — `PromptLibrary` + `IPromptLibraryCreateParams` + `IPromptResolveRequest` + the related fixture / resource-binding / resolve-output types — carries minimal TSDoc on individual methods, parameters, and return shapes. The v0.1 surface has been moving fast (Phase B sub-phases + post-merge cleanups + surface-tidy + round-1 ergonomics absorption), so documenting heavily during churn was the right call; with v0.1 effectively settled now, the next concern is consumer-facing TSDoc quality on the public surface.

  A related pattern Erik flagged in the same PR #380 review: **inline anonymous types + union types should be extracted to named `type` / `interface` declarations** so they have a single place to attach TSDoc. The library currently has a few patterns like `qualifiers: IReadOnlyQualifierCollector | ReadonlyArray<TAxes | (IQualifierDecl & { readonly name: TAxes })>` that would benefit from a named extracted type.

  **Trigger**: post-round-2 pressure-test, once the consumer port (agent chat application) confirms the surface is stable. Don't run this during cluster-close — let the round-2 absorption settle first so the docs don't have to be rewritten after.

  **Scope sketch**: commission a documentation-pass agent against `@fgv/ts-prompt-assist`'s public surface (and any new `@fgv/ts-res` qualifier surface from PR B). For each exported type / class / method:
  - Audit TSDoc presence + quality (does it answer "why" not just "what"; do `@public` symbols have useful `@remarks`).
  - Extract inline anonymous types + unions to named declarations where extraction creates a meaningful single-attach-point for documentation.
  - Cross-link related types via `{@link}` directives.
  - Run api-extractor; verify all `// @public` types have non-`(undocumented)` flags.

  Compare quality bar to `@fgv/ts-utils`'s base packlet, which is the reference for documentation depth.

  **Not a P3**: the surface is public alpha-stage and being consumed; opaque type signatures degrade the consumer-port experience materially. P2 trigger ("post-round-2 stable") puts it on a natural cadence.

  **Not a P1**: no functional gap; the surface works; this is documentation polish on shipped code.

  **Reference**: PR #380 (round-1 ergonomics PR C) — Erik's review surfaced both the doc gap and the inline-types pattern. Cluster spans `libraries/ts-prompt-assist` + the `ts-res` qualifier collector surface PR B extended.

- **[P2] `@fgv/ts-web-extras` lint content cleanup (config landed; 126 source violations remain).**
  Local sweep (chore/comprehensive-lint-fix) added the missing `eslint.config.js` to three sibling packages (`ts-http-storage`, `ts-random`, `tools/repo-template`) which all pass clean. Adding the same config to `ts-web-extras` surfaces **126 problems (6 errors + 120 warnings)** that were hidden while the config was missing. The config addition for `ts-web-extras` is therefore being held back until the source violations are resolved; the package continues to bypass the lint gate in the meantime.

  Rule-violation breakdown:
  | Rule | Count | Character |
  |---|---|---|
  | `@typescript-eslint/naming-convention` | 52 | DOM-mirror interfaces in `file-api-types/` (`FileSystemHandle`, `FileSystemFileHandle`, `FileSystemDirectoryHandle`, etc.) + test `Mock*` types missing `I` prefix |
  | `@typescript-eslint/no-explicit-any` | 24 | Real `any` types in fileApiTreeAccessors / fileSystemAccessTreeAccessors / mocks — repo-banned |
  | `@typescript-eslint/explicit-member-accessibility` | 17 | Missing `public` / `private` modifiers |
  | `@rushstack/typedef-var` | 8 | Missing type annotations |
  | `@typescript-eslint/no-unused-vars` | 7 | Mechanical cleanup |
  | `@rushstack/no-new-null` | 6 | File API mirrors that use `null` (browser convention) |
  | `no-void` | 4 errors | `return void x` pattern; mechanical fix |
  | `require-yield` | 2 | Likely async-generator issues |
  | `@rushstack/packlets/mechanics` | 2 | Packlet boundary |
  | `import/no-internal-modules` | 1 error | Plugin rule definition missing — config-side fix |
  | `require-atomic-updates` | 1 error | `globalThis.fetch = ...` race condition flag in tests; needs human review |
  | Other | 2 | `prefer-const`, `typedef` |

  **Trigger**: next time `ts-web-extras` is open for substantive changes, or before the next `release → main` promotion (so we don't keep shipping un-linted browser-side code).

  **Scope sketch**: three policy questions to adjudicate before mechanical work:
  1. **DOM-mirror naming.** The 3 DOM-mirror interfaces in `file-api-types/` intentionally match browser API names. Recommend: scoped rule override for that file rather than rename. Per CODING_STANDARDS, surface to orchestrator before disabling.
  2. **`no-explicit-any` (24 violations).** These violate the repo's "absolute and non-negotiable" Priority-1 rule. Genuine fixes required (likely `unknown` + cast in test mocks; real types in production adapters).
  3. **Test-file `Mock*` interface names.** Either rename (mechanical) or apply a test-file-scoped override.

  After adjudication, mechanical fixes for the rest are straightforward (4× `no-void`, 17× missing accessibility, 8× missing typedefs, 7× unused vars, 1× `prefer-const`, etc.). The `require-atomic-updates` and `import/no-internal-modules` errors need individual investigation.

  **Not a P1**: shipped code; no production breakage; downstream consumers integrate it. P2 because the gate is actively bypassed for browser-side changes.

  **Reference**: PR #353 (this stream) added the three sibling configs and confirmed scope; original P2 entry from PR #350 (cluster close) reframed.

- **[P2] Cross-runtime entry-point export parity is not systematically tested.**
  Libraries with both Node (`src/index.ts`) and browser (`src/index.browser.ts`) entry points can drift in export names without CI catching it. api-extractor runs only on the Node entry point, so a typo or rename in the browser entry slips through. Pattern has bitten the team three times: `@fgv/ts-extras` exported `Crypto` instead of `CryptoUtils` (personaility web app); `@fgv/ts-extras` missed `Yaml` entirely (ts-prompt-assist sample app, fixed in #377); plus the earlier `repo-template` issue. **`@fgv/ts-extras` now has the recommended micro-test** (`src/test/unit/index.browser.test.ts` asserts every top-level name in `index.ts` is also in `index.browser.ts`); other libraries with browser entries still need it.

  Comprehensive per-export coverage on every library is too expensive given the API surface. The right scope is opportunistic per-library micro-tests.

  **Libraries with `*.browser.ts` entries that still need the micro-test:** `ts-bcp47`, `ts-res`, `ts-web-extras`, `ts-app-shell`, `ts-res-ui-components`, `ts-json`, `ts-json-base`, `ts-sudoku-lib`, `ts-sudoku-ui`.

  **Trigger**: anytime one of those libraries' `index.browser.ts` is touched substantively (new exports added, namespace renames, refactors). Also: anytime a cross-runtime export bug is reported, expand the affected library's micro-test rather than just patching the single export.

  **Scope sketch**: copy the pattern from `@fgv/ts-extras/src/test/unit/index.browser.test.ts` — imports both `index.ts` and `index.browser.ts` directly via relative paths, asserts every top-level name exported from Node is also exported from browser. Browser may have additional names (e.g. back-compat aliases) but nothing Node ships may go missing on browser. Per-library cost: ~15 lines.

  **Not a P3**: the pattern has recurred multiple times across the team; the consumer-impact cost (production-visible undefined exports) is real. P2 trigger ("next time the browser entry is touched") puts it on a natural cadence.

  **Reference**: PR #377 (ts-extras Yaml fix + micro-test pattern landed); original L13 lessons-pending entry; earlier ts-extras `Crypto` bug.

## P3 — Opportunistic cleanup

- **[P3] `importPublicKeyFromMultibaseSpki` still early-returns instead of chaining; the bridge pattern it was waiting for has shipped.**
  `libraries/ts-extras/src/packlets/crypto-utils/spkiHelpers.ts` breaks its `Result` chain at the
  sync→async transition — `const decodeResult = multibaseBase64UrlDecode(encoded); if
  (decodeResult.isFailure()) { return fail(...); }` — rather than chaining into the awaited
  `provider.importPublicKeySpki(...)`. Its sibling `exportPublicKeyAsMultibaseSpki` chains cleanly, so
  the two read differently for no reason a caller can see.

  **Trigger**: fired already, and that is the point of this entry. The
  `auth-primitives-batch1` README deferred it explicitly — "a candidate to revisit if a clean
  `Result`-to-`AsyncResult` bridge pattern emerges" — and `AsyncResult` with `thenOnSuccess` /
  `thenOnFailure` has since shipped in `@fgv/ts-utils` and is documented in `CODING_STANDARDS.md`
  § "Async Result Chaining". Address on the next substantive change to `crypto-utils`.

  **Scope sketch**: `return multibaseBase64UrlDecode(encoded).thenOnSuccess(async (bytes) =>
  provider.importPublicKeySpki(bytes, algorithm)).withErrorFormat((e) =>
  `importPublicKeyFromMultibaseSpki: ${e}`)`. Behaviour-preserving; the existing tests should pass
  unchanged, which is the check that it was purely stylistic.

  **Not a P2**: it is a readability defect in a correct function, not a correctness or type-safety
  one. It earns an entry only because it was a *recorded deferral whose stated precondition is now
  met* — the class of debt that otherwise disappears, since a deferral living solely in a completed
  stream's README has no reader at the moment its trigger fires.

  **Reference**: `auth-primitives-batch1` (#322) "Notes for sibling-sweep / future cleanup"; surfaced
  2026-08-14 by the retroactive `finalize-task` antagonist pass over that stream.

- **[P3] `@fgv/ts-utils` should export a single-`AsyncDeferredResult` invoker; two packages now carry a private copy.**
  Invoking one consumer-supplied `() => Promise<Result<T>>` and turning a synchronous throw or a rejection
  into a `Failure` requires `captureAsyncResult` plus a flatten (`.onSuccess((inner) => inner)`), because
  `captureAsyncResult` wraps the hook's own `Result` and yields `Result<Result<T>>`. `ts-utils` already has
  exactly this as `_invokeDeferred` in `mapResultsAsync.ts`, but it is `@internal` and unexported, so
  `@fgv/ts-agent-memory` (`inMemoryCosineIndex.ts`) and `@fgv/ts-agent-memory-sqlite-vec`
  (`sqliteVecVectorIndex.ts`) each define an identical private `invokeHook`.

  **Trigger**: the third consumer that needs it, or the next time the async `Result` family is touched.

  **Scope sketch**: export the existing `_invokeDeferred` under a public name (`captureDeferredResult` reads
  naturally alongside `captureResult` / `captureAsyncResult`, and `AsyncDeferredResult<T>` is already
  exported), with tests + a change file, then delete both private copies. Purely additive on `ts-utils`.

  **Why not done inline**: `ts-utils` is a foundational, non-active-development surface and was outside the
  declared package scope of the PersonAIlity Stream A stack. Widening a four-PR stack a consumer is waiting
  on to add a public export to the repo's most-depended-on library is the wrong trade; three duplicated
  lines twice is the cheaper carry. Recorded rather than left as a silent copy-paste.

  **Reference**: PersonAIlity Stream A (#611, #614); Copilot round 1 on #611 finding 1.

- **[P3] `ai-assist` fence extraction mis-slices a fenced body that itself contains a triple backtick.**
  `FENCED_BLOCK` in `libraries/ts-extras/src/packlets/ai-assist/jsonResponse.ts` is a single lazy-body regex (`([\s\S]*?)` between an opening fence and the first following ` ``` `). When a model emits a fenced JSON block whose *body* contains a literal triple backtick — most plausibly inside a string value, e.g. ` ```json\n{"snippet": "``` foo ```"}\n``` ` — the lazy body stops at the inner backticks and `extractJsonText` hands `JSON.parse` a truncated candidate. Long-standing and **not introduced by the `ai-assist-fenced-json-diagnostics` stream**: that stream only renumbered the regex's capture groups (opening fence became group 1, body group 2, so a body offset can be mapped back to the original text), verified behaviour-preserving over a 6804-input fuzz. The new `classifyJsonParseFailure` degrades safely here — it reports `'unknown'` rather than compounding the mis-slice with a confident wrong verdict.

  **Trigger**: the next time fence extraction is touched, or the first time a consumer reports a fenced response with embedded backticks failing to parse. Not urgent — the failure is loud (a parse failure), not silent.

  **Scope sketch**: harden the fence scan — prefer counting the opening run's backtick length and matching a closing run of at least that length at a line start (the CommonMark rule), instead of the current first-` ``` `-wins lazy match. Keep `extractJsonText`'s messages unchanged; `locateJsonCandidate` is already the single source of truth for the strip-wrappers step, so the change lands in one place and both the extractor and the classifier follow.

  **Not a P4**: it produces a wrong parse candidate, not just a cosmetic wart — a consumer sees a confusing `JSON.parse` failure on output the model actually formed correctly.

  **Reference**: `ai-assist-fenced-json-diagnostics` stream; code-reviewer pass on that diff (2026-07-31), P3 finding 3.

- **[P3] `ts-agent-memory` L2 `createMemoryTools` duplicates the store's codec wiring instead of delegating.**
  `createMemoryTools({ codecs?, defaultCodec? })` (`libraries/ts-agent-memory/src/packlets/tools/memoryTools.ts`) accepts the per-kind identity codecs a second time, in addition to `FileTreeMemoryStore.create({ codecs })`. `memory_write` needs them because `IMemoryStore.put` (`fileTreeMemoryStore.ts:496-502`) validates `envelope.id === codec-derived idStem` and does not derive/stamp the id itself — so a caller building a new `IMemoryRecord` must compute the same `idStem` up front, which requires the same codec the store was constructed with. The testbed scenario passes the same `codecs` map to both constructors, illustrating the drift risk: a host that re-wires the store's codecs but forgets the mirrored `createMemoryTools` config gets a confusing "envelope id does not match codec-derived stem" failure at `put()` time. Scope isolation is NOT compromised (codec `scope` is derived deterministically from `kind`, not from agent input; a mismatch loudly rejects the write rather than writing cross-scope), so this is a DX/robustness smell, not a security gap.

  **Trigger**: when the temporal write path lands (it touches the same `IMemoryStore` write surface) or the next time `createMemoryTools` is extended.

  **Scope sketch**: add an additive method to `IMemoryStore` — e.g. `resolveWriteAddress(kind, entityId): Result<IIdentityCodecResult>` delegating to the store's already-configured `codecs`/`defaultCodec` — and have `memory_write` call it, dropping the `codecs?`/`defaultCodec?` params from `ICreateMemoryToolsParams`. Purely additive on the active `ts-agent-memory` surface; removes the duplicate config and the drift failure mode.

  **Reference**: `agent-memory-l2-tools` stream; code-reviewer pass on the L2 diff (2026-07-07).

- **[P3] ai-assist model-alias layer does NOT cover capability-detection or the typed `*ModelNames` unions — both stay manual on a provider line rotation.**
  The `@<provider>:<role>` alias layer (`ai-assist-model-aliases` stream) fixes model *selection/default* churn: a line rotation is one edit to a descriptor's `aliases` map plus a testbed run. It deliberately does **not** touch two adjacent axes, which still need a manual bump (design §3):

  1. **The capability-detection `idPattern` rules** (`libraries/ts-extras/src/packlets/ai-assist/registry.ts`, the `DEFAULT_MODEL_CAPABILITY_CONFIG.perProvider` block). These classify the concrete ids a provider's `listModels` endpoint returns (never aliases). When a new line ships (e.g. `gemini-4.x`), the rules need a matching `idPattern` sibling — without it, new ids fall to the base capability set and are mis-classified (e.g. a thinking-capable model detected as non-thinking). Tier 2 added `/^gemini-3/ → ['chat','tools','vision','thinking']`; the next line needs the same hand-edit.
  2. **The typed `*ModelNames` unions** (`model.ts` — `GeminiThinkingModelNames`, `GeminiFlashImageModelNames`, the parallel `OpenAiThinkingModelNames`, etc.) used by the layered-options `models?` filter arrays. They enumerate concrete ids for compile-time ergonomics and must track real ids on a deprecation. Tier 2 bumped the Gemini unions to the 3.x ids by hand.

  **Trigger**: any future provider line rotation (Google/OpenAI/etc.), or when a `listModels` mis-classification or a stale `models?` filter id surfaces.

  **Scope sketch**: per rotation, add/adjust the provider's `idPattern` rule(s) and bump the corresponding `*ModelNames` union(s) alongside the one-line `aliases` map edit. A follow-on could additively allow aliases inside the `models?` arrays (so the unions stop enumerating concrete ids), but that is a separate design — out of the alias stream's scope.

  **Not a P2**: no shipped-behavior regression; the alias layer's value is precisely bounded and the doc (`LIBRARY_CAPABILITIES.md`, packlet README) states the boundary explicitly. This entry exists so the two manual axes are not forgotten on the next rotation.

  **Reference**: `ai-assist-model-aliases` design §3 + Tier 2 manual-axis bumps (`.ai/tasks/completed/2026-06/ai-assist-model-aliases/state.md`).

- **[P3] New pure-library packages must declare `"sideEffects": false` in `package.json`.**
  Every `libraries/` package whose `src/index.ts` exports only functions and types (no module-level side effects) carries `"sideEffects": false` so bundlers can tree-shake it. This was caught in PR review on `crypto-batch-2-webauthn`: `@fgv/ts-extras-webauthn` was missing the field; `@fgv/ts-web-extras-webauthn` had it. Fixed in-stream, but the gap reveals a scaffolding-checklist hole — the standard "new package" template doesn't enforce it.

  **Trigger**: next stream that creates a new pure-library package, or next time someone refactors the scaffolding template / `rush.json` registration guide.

  **Scope sketch**: (a) audit existing `libraries/*/package.json` to confirm everyone has the field correctly set (one quick grep), and (b) add a line to the per-package scaffolding doc / convention note that flags `"sideEffects": false` as required alongside `"main"` and `"types"`. Optionally add a tiny test or pre-PR check that fails when a `libraries/` package is missing the field and has no module-level side effects.

  **Not a P2**: failure mode is "consumer bundle size slightly larger than necessary," not a functional regression.

  **Reference**: PR #347 review (crypto-batch-2-webauthn); lesson captured in `.ai/tasks/completed/2026-05/crypto-batch-2-webauthn/README.md` § L1.

- **[P3] `resolveImageCapability` in `ai-assist/registry.ts` returns `| undefined` instead of `Result<IAiImageModelCapability>`.**
  `registry.ts:328–339`. The function returns `undefined` when no capability matches `modelId`, silently swallowing the "unknown model" case. Callers must null-check rather than chain. Returning `Result<IAiImageModelCapability>` with a contextual error message would let callers propagate the failure cleanly.

  **Trigger**: next substantive change to the provider registry or capability resolution path.

  **Scope sketch**: change return type to `Result<IAiImageModelCapability>`; return `fail(\`model '${modelId}' not found in provider '${descriptor.name}' image capabilities\`)` when the reduce produces `undefined`; update call sites (primarily in `apiClient.ts`) to chain off the result.

  **Not a P2**: the function is currently only called in contexts that already handle `undefined` defensively; behaviour is correct, just non-idiomatic.

  **Reference**: PR #329 review — pattern pre-existed the PR, absolved from that review.

- **[P3] ~~`ai-assist/apiClient.ts` is at the 2000-line `max-lines` cap; decompose it.~~ ✅ RESOLVED 2026-08 by #620.**
  **The file no longer exists.** #620 split it by concern into `completionClient.ts` /
  `imageGenerationClient.ts` / `listModelsClient.ts` (plus `embeddingClient.ts` and
  `streamingClient.ts`) — which is precisely the split this entry's own "scope sketch"
  below proposed, down to the module names. Verified 2026-08-14: `ls` on the path fails;
  the named siblings are present.

  *Closed by the retroactive `finalize-task` sweep. Note the 2026-08 "Correction" paragraph
  at the end of this entry — the one warning that whoever next edits the file has zero
  headroom — was written about a file that was already gone or going. A debt entry whose
  own resolution has shipped is worse than a missing one: it sends the next reader to a
  path that does not exist, and it makes the ledger look busier than the work actually is.
  The original text is kept below for the reasoning, which remains the best statement of
  why the split was needed.*

  ---

  *Original entry, retained for its reasoning:*

  `libraries/ts-extras/src/packlets/ai-assist/apiClient.ts` sits right at the ESLint `max-lines` ceiling (2000). It is a monolith spanning four largely-independent concerns: chat completion (OpenAI/Anthropic/Gemini adapters + dispatcher), image generation (adapters + dispatcher + response validators), list-models (adapters + capability resolution), and the proxied variants of all three. Every additive change to any one concern now requires trimming JSDoc elsewhere in the file purely to stay under the cap — this happened repeatedly on `ai-assist-message-ordering` (PR #478), where each Copilot round that added a proxy-path guard forced compensating comment cuts. This is unsustainable: doc quality is being traded for line budget, and the next feature touching this file will hit the wall immediately.

  **Trigger**: next substantive change to `apiClient.ts` (any new provider adapter, image format, list-models source, or proxy field), or proactively before the next ai-assist feature stream.

  **Scope sketch**: split by concern into sibling modules under `ai-assist/` (e.g. `completionClient.ts`, `imageGenerationClient.ts`, `listModelsClient.ts`, and a `proxiedClient.ts` — or co-locate each proxied variant with its direct sibling), keeping the shared HTTP helpers (`fetchJson`/`fetchMultipart`/`fetchGetJson`) and response validators in a small internal module. Re-export the public surface unchanged from `index.ts` so `etc/ts-extras.api.md` is unaffected (pure file-organization move, no API change → Rush change `none`). Verify per-file `max-lines` compliance without JSDoc trimming.

  **Upgraded from "soft blocker" to hard blocker**: no functional or API impact; the file works correctly. This is a maintainability/headroom issue — but it becomes a soft blocker on the *next* edit, so it should be done before, not during, the next feature.

  **Correction (2026-08, PersonAIlity Stream A):** "soft blocker" understated it. CI runs `rush rebuild`, which exits **non-zero on "SUCCESS WITH WARNINGS"** — so the first line that pushes this file past 2000 turns the PR's check red, not yellow. A local `rushx build` exits 0 on that same warning, which is how the identical situation in `ts-agent-memory` reached CI before anyone noticed (fixed in #616 by extracting a collaborator). Whoever next edits `apiClient.ts` should assume they have **zero** headroom.

  **Reference**: PR #478 (`ai-assist-message-ordering`) — repeated JSDoc trims to keep the file ≤2000 lines while adding proxy-path validation guards; Erik 2026-06-07 ("we won't be able to cut lines every time").

## P4 — Doc / minor consistency

- **[P4] `mutableFsTree` `permission-denied for read-only file` test fails when the test container runs as root.**
  `@fgv/ts-json-base` `mutableFsTree` suite — one test expects `chmod`-based read-only enforcement to block a write. When the test container runs as root (the default in the cloud-agent harness), `chmod` is advisory; the kernel lets root write read-only files regardless. Reproduces on the `release` baseline; **not a regression** from any recent stream. Surfaced (and explicitly dispositioned as unrelated) during the `capture-async-result-upgrade` full-repo `rush test` sweep (PR #433).

  **Trigger**: opportunistic — next time the `mutableFsTree` test surface is open, or when CI logs become a meaningful nuisance.

  **Scope sketch**: gate the assertion on `process.getuid?.() !== 0` (skip the read-only-enforcement check under root); or rewrite the assertion to use a `FileTree` adapter capability check rather than relying on `chmod` semantics. Single-test scope; behavior of the production code is fine.

  **Not a P3**: no shipped-behavior impact and no functional regression; this is a sandbox-specific test-environment quirk.

  **Reference**: PR #433 (`capture-async-result-upgrade`) full-repo `rush test` sweep; reproduced on `release` baseline.

